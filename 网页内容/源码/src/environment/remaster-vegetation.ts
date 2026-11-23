import * as T from 'three';
import type {Project} from '../data/model.ts';
import {beachAffinity,ease,isNaturalLandform,landscapeNoise} from '../terrain/natural-landform.ts';
import {coastDistance,inside,isLand,mainCoast} from '../terrain/terrain.ts';
import {blocked,type Obstacle,type Route} from './paths.ts';
import type {TerrainSurface} from './surface.ts';
import {inCherryClearing,seededLandscapeRandom,shrineSlopeTrees,shrineTreeClearings,type TreeRoot} from './remaster-canopy.ts';

type Clearing=[number,number,number];
type Plant={matrix:T.Matrix4; color:T.Color};
type RoadSegment={x:number;z:number;dx:number;dz:number;length2:number;halfWidth:number};
const key=(x:number,z:number)=>x+','+z;

function protectedRoads(routes: Route[]) {
  const cells=new Map<string,RoadSegment[]>(), step=10;
  for(const route of routes) {
    if(route.status!=='connected') continue;
    for(let i=1;i<route.points.length;i++) {
      const [x,z]=route.points[i-1], [endX,endZ]=route.points[i];
      const dx=endX-x, dz=endZ-z, halfWidth=route.width*.5, margin=halfWidth+6.8;
      const segment={x,z,dx,dz,length2:dx*dx+dz*dz||1,halfWidth};
      for(let ix=Math.floor((Math.min(x,endX)-margin)/step);ix<=Math.floor((Math.max(x,endX)+margin)/step);ix++) {
        for(let iz=Math.floor((Math.min(z,endZ)-margin)/step);iz<=Math.floor((Math.max(z,endZ)+margin)/step);iz++) {
          const cell=key(ix,iz), found=cells.get(cell);
          if(found) found.push(segment); else cells.set(cell,[segment]);
        }
      }
    }
  }
  return (x:number,z:number,margin:number)=>{
    for(const s of cells.get(key(Math.floor(x/step),Math.floor(z/step)))??[]) {
      const t=T.MathUtils.clamp(((x-s.x)*s.dx+(z-s.z)*s.dz)/s.length2,0,1);
      if((x-s.x-s.dx*t)**2+(z-s.z-s.dz*t)**2<(s.halfWidth+margin)**2) return true;
    }
    return false;
  };
}

const groves=[
  [-86,-104,72,31],[-23,-114,46,26],[102,-97,45,26],[-134,37,34,36],
  [-108,83,43,36],[-54,111,51,33],[12,127,42,22],[66,107,31,28],[166,21,23,91],
];
function woodland(x:number,z:number) {
  let grove=0;
  for(const [cx,cz,rx,rz] of groves) {
    const dx=(x-cx)/rx, dz=(z-cz)/rz;
    grove=Math.max(grove,1-ease(.12,1.55,dx*dx+dz*dz));
  }
  const patch=.59*landscapeNoise(x/30+3,z/30-7)+.30*landscapeNoise(x/15-8,z/15+13)+.11*landscapeNoise(x/7,z/7+2);
  return ease(.24,.91,patch*.75+grove*.47);
}

function batch(geometry:T.BufferGeometry,material:T.Material,plants:Plant[],kind:string,coloured=true) {
  const mesh=new T.InstancedMesh(geometry,material,plants.length);
  for(const [i,p] of plants.entries()) {
    mesh.setMatrixAt(i,p.matrix);
    if(coloured) mesh.setColorAt(i,p.color);
  }
  mesh.instanceMatrix.needsUpdate=true;
  if(mesh.instanceColor) mesh.instanceColor.needsUpdate=true;
  mesh.computeBoundingSphere(); mesh.name=kind; mesh.userData.noCollision=true;
  mesh.receiveShadow=true; mesh.castShadow=true;
  return mesh;
}

/** Low bedding and small emergent rocks collect in groups on the exposed sides of headlands. */
function tidalLedges(p:Project,obstacles:Obstacle[],surface:TerrainSurface,rnd:()=>number) {
  const t=p.terrain, coast=mainCoast(t), rocks:Plant[]=[], temp=new T.Object3D();
  const palette=['#747f79','#89918a','#919589','#879085','#737f79'];
  for(let i=0;i<coast.length;i++) {
    const a=coast[i], b=coast[(i+1)%coast.length], dx=b[0]-a[0], dz=b[1]-a[1], len=Math.hypot(dx,dz);
    if(len<3.5) continue;
    const steps=Math.ceil(len/11);
    for(let j=0;j<steps;j++) {
      const u=(j+.22+.52*rnd())/steps, x=a[0]+dx*u,z=a[1]+dz*u;
      const exposure=landscapeNoise(x/28+7,z/28-12);
      if(beachAffinity(x,z)>.46 || exposure<.39 || x>149&&z< -22 || x>40&&z> -70&&z<54 || rnd()<.22) continue;
      let nx=-dz/len, nz=dx/len;
      if(isLand(t,x+nx*.4,z+nz*.4)) {nx=-nx;nz=-nz;}
      const tangent=Math.atan2(-dz,dx), count=2+Math.floor(rnd()*4);
      for(let k=0;k<count;k++) {
        const offset=(rnd()-.5)*6, offshore=.15+rnd()*(k===0?2.2:5.4);
        const xx=x+nx*offshore+dx/len*offset, zz=z+nz*offshore+dz/len*offset;
        const width=(k===0?2.6:1.0)+rnd()*(k===0?3.4:1.7);
        if(blocked(obstacles,xx,zz,width*.65)) continue;
        const ground=surface.height(xx,zz);
        if(ground!==undefined&&ground>2.4) continue;
        const h=width*(.13+.15*rnd());
        temp.position.set(xx,ground===undefined?-.12+rnd()*.29:ground-.4*h,zz);
        temp.rotation.set((rnd()-.5)*.14,tangent+(rnd()-.5)*.55,(rnd()-.5)*.15);
        temp.scale.set(width,h,width*(.38+.37*rnd()));temp.updateMatrix();
        rocks.push({matrix:temp.matrix.clone(),color:new T.Color(palette[Math.floor(rnd()*palette.length)])});
      }
    }
  }
  if(!rocks.length) return;
  const g=new T.IcosahedronGeometry(1,1), pos=g.getAttribute('position');
  const colors=new Float32Array(pos.count*3);
  for(let i=0;i<pos.count;i++) {
    const x=pos.getX(i), y=pos.getY(i), z=pos.getZ(i), n=landscapeNoise(7+x*3.2,z*3.2-y*2.8);
    pos.setXYZ(i,x*(.89+.2*n)+.12*y,y>.23?.31+y*.35+.08*n:y,z*(.92+.12*n));
    const shade=.77+.15*ease(-1,1,y)+.08*n;
    colors[i*3]=shade; colors[i*3+1]=shade; colors[i*3+2]=shade*.98;
  }
  g.setAttribute('color',new T.BufferAttribute(colors,3));g.computeVertexNormals();
  return batch(g,new T.MeshStandardMaterial({vertexColors:true,roughness:.84}),rocks,'潮池岩床');
}

export type RemasterPlanting={trees:TreeRoot[];shrubs:TreeRoot[];slope:TreeRoot[]};

export function makeRemasterVegetation(p:Project,surface:TerrainSurface,routes:Route[],obstacles:Obstacle[],clearings:Clearing[]=[]) {
  const root=new T.Group();root.name='海岛林地与潮间带';root.userData.noCollision=true;
  const planting:RemasterPlanting={trees:[],shrubs:[],slope:[]};
  if(!isNaturalLandform(p.terrain))return {root,planting};
  const seed=p.environment?.seed??34017, rnd=seededLandscapeRandom(seed^0x72fe13);
  const road=protectedRoads(routes), t=p.terrain, zones=shrineTreeClearings(p);
  const neighbours=new Map<string,{x:number;z:number;r:number}[]>();
  function space(x:number,z:number,r:number) {
    const cx=Math.floor(x/6),cz=Math.floor(z/6);
    for(let i=cx-1;i<=cx+1;i++)for(let j=cz-1;j<=cz+1;j++) {
      for(const q of neighbours.get(key(i,j))??[])if((x-q.x)**2+(z-q.z)**2<(r+q.r)**2)return false;
    }
    const cell=key(cx,cz), group=neighbours.get(cell);
    if(group)group.push({x,z,r});else neighbours.set(cell,[{x,z,r}]);
    return true;
  }
  for(let i=0;i<26000&&(planting.trees.length<475||planting.shrubs.length<420);i++) {
    const x=(rnd()-.5)*t.size,z=(rnd()-.5)*t.size,y=surface.height(x,z);
    if(y===undefined||t.campus&&inside([x,z],t.islet))continue;
    const forest=woodland(x,z), small=rnd()<.25+.33*(1-forest);
    if(small?planting.shrubs.length>=420:planting.trees.length>=475)continue;
    const coast=coastDistance(t,[x,z]), beach=beachAffinity(x,z);
    if(coast<(small?2.1:5.2)+beach*(small?6:12)||rnd()>(small?.19+forest*.66:.07+forest*.91))continue;
    const gx=(surface.height(x+.9,z)??y)-(surface.height(x-.9,z)??y);
    const gz=(surface.height(x,z+.9)??y)-(surface.height(x,z-.9)??y);
    if(Math.hypot(gx,gz)/1.8>(small?1.22:1.07))continue;
    const radius=small?.72:4.8,margin=radius+.4;
    if(blocked(obstacles,x,z,margin)||road(x,z,margin)||clearings.some(([cx,cz,r])=>Math.hypot(x-cx,z-cz)<r+radius))continue;
    const base=t.grading?.baseRect;
    if(base&&x>base[0]-margin&&x<base[1]+margin&&z>base[2]-margin&&z<base[3]+margin)continue;
    if(inCherryClearing(x,z,radius,zones)||!space(x,z,small?.70:1.85+.48*rnd()))continue;
    (small?planting.shrubs:planting.trees).push([x,y,z]);
  }
  planting.slope=shrineSlopeTrees(p,surface,obstacles,road,planting.trees,seededLandscapeRandom(seed^0x16a73));
  // Give the original tidal outcrops their own seed so subsequent forest edits cannot move them.
  const ledges=tidalLedges(p,obstacles,surface,seededLandscapeRandom(915914301^(seed^34017)));
  if(ledges)root.add(ledges);
  root.userData.woodlandCounts={trees:planting.trees.length+planting.slope.length,shrubs:planting.shrubs.length,shrineSlope:planting.slope.length,tidalRocks:ledges?.count??0};
  return {root,planting};
}
