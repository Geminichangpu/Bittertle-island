import {coastalSkirt} from './coastal-skirt';
import {scenicPaths} from './scenic-paths';
import {shrineCoastRock} from './shrine-coast';
import {addCentralCampus} from './central-campus';
import * as T from 'three';
import {surfaceMaterial} from '../render/surface-material.ts';
import {createNatureMaterials} from './nature-materials';
import {crownGeometry,boulderGeometry,leafSprigGeometry} from './nature-geometry';
import type {Project,Point} from '../data/model.ts';
import {Builder} from '../generators/shrine.ts';
import {mainCoast,isLand,coastDistance,inside} from '../terrain/terrain.ts';
import {objectWorldBounds} from '../terrain/placement.ts';
import {TerrainSurface} from './surface.ts';
import {planPaths,buildingObstacles,blocked,roadDistance,type Route} from './paths.ts';

type V=[number,number,number];
function random(seed:number){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t^=t+Math.imul(t^t>>>7,61|t);return ((t^t>>>14)>>>0)/4294967296;};}
function surfaceMesh(vertices:number[],colors:number[],name:string,material:T.MeshStandardMaterial){const g=new T.BufferGeometry(),uv:number[]=[];for(let i=0;i<vertices.length;i+=3)uv.push(vertices[i]*.32,vertices[i+2]*.32);g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();g.userData.surfaceKind="road";Object.assign(material,{side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});const m=new T.Mesh(g,material);m.name=name;return m;}
const natureDisposers=new WeakMap<T.Group,()=>void>();
const natureLibraries=new WeakMap<T.Group,ReturnType<typeof createNatureMaterials>>();
/** Authored tree/rock objects share the same texture set as the surrounding vegetation. */
export function finishAuthoredNature(objects:T.Object3D,environment:T.Group){
 const library=natureLibraries.get(environment);if(!library)return;
 objects.traverse(n=>{
  if(!(n instanceof T.Mesh)||!n.userData.natureKind)return;
  if(n.userData.natureKind==='bark')n.material=library.material('bark','#e7d6bd');
  else if(n.userData.natureKind==='cliff'||n.userData.natureKind==='coast-ground'||n.userData.natureKind==='coast-trail')n.material=library.material(n.userData.natureKind);
  else if(n.userData.natureKind==='rock')n.material=library.material('rock','#d8e2df');
  else {const m=n.material as T.MeshStandardMaterial;m.vertexColors=true;m.side=T.DoubleSide;m.needsUpdate=true;}
 });
}

/** Derived, seeded, static M3 layer. It never writes to the project or schedules animation. */
export function makeEnvironment(p:Project,terrainGeometry:T.BufferGeometry,onReady:()=>void=()=>{}){
 const root=new T.Group();root.name='M3-environment';
 if(!p.environment)return root;
 const nature=createNatureMaterials(onReady);natureDisposers.set(root,nature.dispose);natureLibraries.set(root,nature);
 const rnd=random(p.environment.seed),surface=new TerrainSurface(terrainGeometry),routes=[...planPaths(p),...scenicPaths(p)],obstacles=p.objects.map(o=>({id:o.id,box:objectWorldBounds(p,o)}));
 const geometries=new Map<string,T.BufferGeometry>(),materials=new Map<string,T.MeshStandardMaterial>();
 const geo=(key:string,make:()=>T.BufferGeometry)=>{if(!geometries.has(key)){const g=make();g.userData.surfaceKind=key==='env:blade'?'grass':'nature';geometries.set(key,g);}return geometries.get(key)!;};
 const stoneColors=new Set(['#8a8c84','#aaa698','#777e7a','#939ea8','#8c959e','#b2b9bc']);
 const pavingColors=new Set(['#bcc6cd','#dce3df','#d6e0e5','#d6e0df']);
 const leafColors=new Set(['#557f4e','#658d50','#7ca35d','#97b66d','#4e7750','#7ca968','#629453']);
 const mat=(color:string)=>{
  if(!materials.has(color)){
   const tint='#'+new T.Color(color).lerp(new T.Color('#ffffff'),.66).getHexString();
   const m=color==='#766246'||color==='#7a765f'?nature.material('bark','#e7d6bd'):stoneColors.has(color)?nature.material('rock',tint):pavingColors.has(color)?nature.material('paving',tint):surfaceMaterial(color,'nature');
   if(leafColors.has(color)){m.vertexColors=true;m.side=T.DoubleSide;}
   materials.set(color,m);
  }return materials.get(color)!;
 };
 const b=new Builder({geo,mat,sign:mat});
 const metrics={trees:0,bushes:0,grass:0,flowers:0,rocks:0,steps:0,roadSamples:0};
 const ground=(x:number,z:number)=>surface.height(x,z);
 const shrineRock=shrineCoastRock(p,terrainGeometry,nature.material('cliff'));if(shrineRock)root.add(shrineRock);
 const skirt=coastalSkirt(p,terrainGeometry,nature.material('cliff'));if(skirt)root.add(skirt);
 const leaf=(v:V,s:V,color:string)=>b.emit('env:leaf',crownGeometry,color,v,s);
 const rock=(v:V,s:V,color:string,angle=0)=>{const variant=Math.floor(Math.abs(angle)*3)%3;b.emit('env:rock:'+variant,()=>boulderGeometry(variant),color,v,s,new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),angle));};

 // Drape short, cross-subdivided road ribbons on the actual mesh (not an approximate heightfield).
 for(const r of routes){
  if(r.status!=='connected')continue;
  const vertices:number[]=[],colors:number[]=[],stone=new T.Color('#f4f0e5'),earth=new T.Color('#f4ebd8'),edge=new T.Color('#c3baa1');
  const emit=(a:V,c:V,d:V,color:T.Color)=>{for(const v of [a,c,d]){vertices.push(...v);colors.push(color.r,color.g,color.b);}};
  let previous:V[]|undefined;
  for(let i=0;i<r.points.length;i++){
   const q=r.points[i],a=r.points[Math.max(0,i-1)],c=r.points[Math.min(r.points.length-1,i+1)],dx=c[0]-a[0],dz=c[1]-a[1],length=Math.hypot(dx,dz)||1;
   const row:V[]=[];for(let j=0;j<=4;j++){const shift=(j/4-.5)*r.width,x=q[0]-dz/length*shift,z=q[1]+dx/length*shift,y=ground(x,z);row.push([x,(y??ground(...q)??0)+.14,z]);}
   if(previous){
    const steep=Math.abs(row[2][1]-previous[2][1])/Math.max(.1,Math.hypot(row[2][0]-previous[2][0],row[2][2]-previous[2][2]))>.25;
    for(let j=0;j<4;j++){const color=steep&&i%2===0?stone:j===0||j===3?edge:earth;emit(previous[j],row[j],previous[j+1],color);emit(previous[j+1],row[j],row[j+1],color);}
    metrics.roadSamples++;if(steep&&i%2===0)metrics.steps++;
   }
   previous=row;
  }
  const paved=[r.fromId,r.toId].some(id=>id.startsWith('shrine_')||id.startsWith('base_')||id==='landmark_library'||id==='scenic_cliff'||id==='scenic_north_rock');
  const mesh=surfaceMesh(vertices,colors,r.name,nature.material(r.id==='scenic-coast-path'?'coast-trail':paved?'paving':'gravel','#ffffff',true));mesh.userData.routeId=r.id;root.add(mesh);
 }

 // Sandy shore skirt, turquoise shallows and broken white foam. All waves are static geometry.
 const shoreV:number[]=[],shoreC:number[]=[],sand=new T.Color('#f3e3b7'),wet=new T.Color('#b3e4d8'),aqua=new T.Color('#4fc4d0'),blue=new T.Color('#168bc0');
 const shoreTri=(a:V,c:V,d:V,ca:T.Color,cc:T.Color,cd:T.Color)=>{shoreV.push(...a,...c,...d);shoreC.push(ca.r,ca.g,ca.b,ca===blue?0:1,cc.r,cc.g,cc.b,cc===blue?0:1,cd.r,cd.g,cd.b,cd===blue?0:1);};
 const coastLoops=p.terrain.campus?[mainCoast(p.terrain)]:[mainCoast(p.terrain),p.terrain.islet];
 for(const loop of coastLoops){
  const rows:{p:Point;n:Point;v:V[]}[]=[];
  for(let i=0;i<loop.length;i++){
   const a=loop[i],c=loop[(i+1)%loop.length],dx=c[0]-a[0],dz=c[1]-a[1],len=Math.hypot(dx,dz),steps=Math.ceil(len/1.5);
   for(let j=0;j<steps;j++){
    const u=j/steps,x=a[0]+dx*u,z=a[1]+dz*u;let nx=-dz/len,nz=dx/len;if(isLand(p.terrain,x+nx*.2,z+nz*.2)){nx=-nx;nz=-nz;}
    const widths=[0,1.8,6.5,14],ys=[.9,.04,-.03,-.1];rows.push({p:[x,z],n:[nx,nz],v:widths.map((w,k)=>[x+nx*w,ys[k],z+nz*w] as V)});
    if(j%3===0&&rnd()>.18){const off=2.1+rnd()*.5,length=.6+rnd()*1.3;b.box([x+nx*off,.09,z+nz*off],[length,.025,.11],'#ecfaf1',-Math.atan2(dz,dx));}
   }
  }
  const palette=[sand,wet,aqua,blue];for(let i=0;i<rows.length;i++){const a=rows[i],c=rows[(i+1)%rows.length];for(let k=0;k<3;k++){const mid=[(a.v[k+1][0]+c.v[k+1][0])/2,(a.v[k+1][2]+c.v[k+1][2])/2] as Point;if(isLand(p.terrain,...mid))continue;shoreTri(a.v[k],c.v[k],a.v[k+1],palette[k],palette[k],palette[k+1]);shoreTri(a.v[k+1],c.v[k],c.v[k+1],palette[k+1],palette[k],palette[k+1]);}}
 }
 const shoreGeometry=new T.BufferGeometry();shoreGeometry.setAttribute('position',new T.Float32BufferAttribute(shoreV,3));shoreGeometry.setAttribute('color',new T.Float32BufferAttribute(shoreC,4));
 const shore=new T.Mesh(shoreGeometry,new T.MeshBasicMaterial({vertexColors:true,transparent:true,depthWrite:false,side:T.DoubleSide}));shore.material.userData.shore=true;shore.name='Shore';root.add(shore);

 // A cached occupancy field makes road clearance inexpensive for many vegetation candidates.
 const roadCache=new Map<string,number>();
 const roadClearance=(x:number,z:number)=>{const key=Math.round(x)+','+Math.round(z);if(!roadCache.has(key))roadCache.set(key,roadDistance(routes,Math.round(x),Math.round(z)));return roadCache.get(key)!;};
 const base=p.terrain.grading?.baseRect;
 const clearing=(x:number,z:number)=>base&&x>base[0]-5&&x<base[1]+5&&z>base[2]-3&&z<base[3]+4;
 const occupied=new Map<string,Point[]>();
 const spaced=(x:number,z:number,r:number)=>{const ix=Math.floor(x/5),iz=Math.floor(z/5);for(let xx=ix-1;xx<=ix+1;xx++)for(let zz=iz-1;zz<=iz+1;zz++)for(const q of occupied.get(xx+','+zz)||[])if(Math.hypot(q[0]-x,q[1]-z)<r)return false;const key=ix+','+iz;let qs=occupied.get(key);if(!qs)occupied.set(key,qs=[]);qs.push([x,z]);return true;};
 const palette=['#557f4e','#658d50','#7ca35d','#97b66d','#4e7750'];
 for(let attempt=0;attempt<22000;attempt++){
  const x=(rnd()-.5)*p.terrain.size,z=(rnd()-.5)*p.terrain.size,y=ground(x,z);if(p.terrain.campus&&inside([x,z],p.terrain.islet))continue;if(y===undefined)continue;
  const shore=coastDistance(p.terrain,[x,z]);if(shore<4||blocked(obstacles,x,z,3.5)||roadClearance(x,z)<2.8||clearing(x,z))continue;
  const slope=Math.max(Math.abs((ground(x+1,z)??y)-y),Math.abs((ground(x,z+1)??y)-y));if(slope>2||y>65||(x<-105&&y>28))continue;
  const patch=(Math.sin(x*.055+Math.sin(z*.04))*Math.cos(z*.065)+Math.sin((x+z)*.11)*.28+1.3)/2.6;
  if(rnd()>patch*.8||!spaced(x,z,2.8))continue;
  const color=palette[Math.floor(rnd()*palette.length)],r=1.1+rnd()*1.6;
  if(metrics.trees<600&&rnd()<.37&&shore>7&&y<36){
   const h=3.6+rnd()*3.2,trunkRadius=.18+rnd()*.12;
   b.emit('env:tapered-trunk',()=>new T.CylinderGeometry(.66,1,1,10,3),'#766246',[x,y+(h*.72-.2)/2,z],[trunkRadius,h*.72+.2,trunkRadius]);
   for(let branch=0;branch<3;branch++){
    const a=attempt+branch*2.4,xx=x+Math.cos(a)*r*.55,zz=z+Math.sin(a)*r*.55;
    b.cylinder([x,y+h*.48,z],[xx,y+h*.8,zz],trunkRadius*.42,'#766246',7);
    b.emit('env:leaf-sprig',leafSprigGeometry,color,[x+Math.cos(a)*r*.87,y+h*.79+(branch%2)*r*.4,z+Math.sin(a)*r*.87],[1.4,1.4,1.4],new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),a));
   }
   for(let j=0;j<4;j++){const a=j*2.4+attempt,rr=j===0?0:r*.6;leaf([x+Math.cos(a)*rr,y+h*.74+(j%2)*r*.4,z+Math.sin(a)*rr],[r*(.8+rnd()*.25),r*.8,r],j%2?color:palette[(Math.floor(rnd()*palette.length))]);}
   metrics.trees++;
  }else if(metrics.bushes<1900){for(let j=0;j<3;j++)leaf([x+(rnd()-.5)*r,y+.35+r*.28,z+(rnd()-.5)*r],[r*.65,r*.45,r*.65],color);metrics.bushes++;}
 }
 for(let attempt=0;attempt<6000;attempt++){
  const x=(rnd()-.5)*p.terrain.size,z=(rnd()-.5)*p.terrain.size,y=ground(x,z);if(p.terrain.campus&&inside([x,z],p.terrain.islet))continue;if(y===undefined||y>33||coastDistance(p.terrain,[x,z])<4||blocked(obstacles,x,z,1)||roadClearance(x,z)<.75)continue;
  if(metrics.grass<750){for(let j=0;j<3;j++)b.emit('env:blade',()=>{const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([-.12,0,0,.08,.7,0,.12,0,0,0,0,-.1,0,.6,.1,0,0,.1],3));g.computeVertexNormals();return g;},j%2?'#8ba65e':'#afbc72',[x+(rnd()-.5),y-.04,z+(rnd()-.5)],[1,.5+rnd(),1],new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),rnd()*6.28));metrics.grass++;}
  if(metrics.flowers<140&&roadClearance(x,z)<5&&rnd()>.5){for(let j=0;j<4;j++){const xx=x+(rnd()-.5),zz=z+(rnd()-.5),yy=ground(xx,zz)??y;b.cylinder([xx,yy,zz],[xx,yy+.5,zz],.025,'#70884e',5);leaf([xx,yy+.5,zz],[.16,.1,.16],j%2?'#f5ead1':'#d9b7c0');}metrics.flowers++;}
 }
 // Irregular boulder beaches and exposed west-peak rock blades match the supplied island artwork.
 for(let attempt=0;attempt<4000;attempt++){
  const x=(rnd()-.5)*p.terrain.size,z=(rnd()-.5)*p.terrain.size,y=ground(x,z);if(p.terrain.campus&&inside([x,z],p.terrain.islet))continue;if(y===undefined||blocked(obstacles,x,z,3)||roadClearance(x,z)<2)continue;
  const d=coastDistance(p.terrain,[x,z]);if(d<1||d>8||rnd()>.38||metrics.rocks>=180)continue;
  const r=.7+rnd()*1.9;rock([x,y+r*.3,z],[r,r*(.5+rnd()*.45),r*.8],['#8a8c84','#aaa698','#777e7a'][attempt%3],rnd()*6);metrics.rocks++;
 }
 for(let i=0;i<9;i++){
  const a=i*2.4,x=-129+Math.cos(a)*(3+i*.5),z=21+Math.sin(a)*(3+i*.4),y=ground(x,z);if(p.terrain.campus&&inside([x,z],p.terrain.islet))continue;if(y===undefined||blocked(obstacles,x,z,5)||roadClearance(x,z)<4)continue;
  rock([x,y-1,z],[3.5+i%3,7+i%4*2,2.8],i%2?'#8a8c84':'#aaa698',a);metrics.rocks++;
 }
 for(let i=0;i<140;i++){const x=(rnd()-.5)*600,z=(rnd()-.5)*460;if(isLand(p.terrain,x,z)||coastDistance(p.terrain,[x,z])<17)continue;b.box([x,-.035,z],[1+rnd()*3,.015,.08],'#87d1e0',-.08);}

 addCentralCampus(p,b);
 const instances=b.finish();instances.name='植被、岩石与静态海浪';root.add(instances);
 root.userData.routes=routes;root.userData.metrics=metrics;
 root.userData.environmentRevision=p.environment.revision;
 return root;
}

export function disposeEnvironment(root:T.Group){
 natureDisposers.get(root)?.();natureDisposers.delete(root);natureLibraries.delete(root);
 const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>();root.traverse(n=>{if(n instanceof T.Mesh){geometries.add(n.geometry);for(const m of Array.isArray(n.material)?n.material:[n.material])materials.add(m);if(n instanceof T.InstancedMesh)n.dispose();}});
 geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());root.clear();root.removeFromParent();
}

export function seaMaterial(){const material=new T.ShaderMaterial({fog:true,
 uniforms:T.UniformsUtils.merge([T.UniformsLib.fog,{nearColor:{value:new T.Color('#269fca')},farColor:{value:new T.Color('#0869a6')},detailStrength:{value:.035}}]),
 vertexShader:`#include <fog_pars_vertex>
 varying vec2 worldXZ; void main(){vec4 world=modelMatrix*vec4(position,1.0);worldXZ=world.xz;vec4 mvPosition=viewMatrix*world;gl_Position=projectionMatrix*mvPosition;
 #include <fog_vertex>
 }`,
 fragmentShader:`#include <fog_pars_fragment>
 varying vec2 worldXZ; uniform vec3 nearColor; uniform vec3 farColor; uniform float detailStrength;
 void main(){float depth=clamp(length(worldXZ)/650.0,0.0,1.0);float patches=(sin(worldXZ.x*.018+sin(worldXZ.y*.025))*sin(worldXZ.y*.021)+.24*sin(worldXZ.x*.21+worldXZ.y*.13)*sin(worldXZ.y*.17-worldXZ.x*.09))*detailStrength;
 gl_FragColor=vec4(mix(nearColor,farColor,depth)+patches,1.0);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 #include <fog_fragment>
 }`
});material.userData.sea=true;return material;}
