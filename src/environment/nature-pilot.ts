import * as T from 'three';
import type {Project} from '../data/model.ts';
import {Builder} from '../generators/shrine.ts';
import {crownGeometry,leafSprigGeometry} from './nature-geometry';
import {palmFrondGeometry,screwPineCrownGeometry} from './tropical-foliage';
import type {TerrainSurface} from './surface';
import {blocked,roadDistance,type Obstacle,type Route} from './paths';
import {isLand,coastDistance} from '../terrain/terrain';
import type {createNatureMaterials} from './nature-materials';

export function pilotCenter(p:Project){const g=p.groups?.find(g=>g.id==='shrine_group');return new T.Vector2(g?.position[0]??139,g?.position[2]??-21);}
export function inNaturePilot(p:Project,x:number,z:number){const c=pilotCenter(p);return ((x-c.x)/83)**2+((z-c.y)/98)**2<1;}
function random(seed:number){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t^=t+Math.imul(t^t>>>7,61|t);return ((t^t>>>14)>>>0)/4294967296;};}

const details=new WeakMap<T.Group,{grass:T.Group;center:T.Vector2}>();
export function updatePilotDetails(root:T.Group,camera:T.Camera,target:T.Vector3){const pilot=root.children.find(n=>n.name==='自然环境样板植被') as T.Group|undefined,d=details.get(root)||(pilot&&details.get(pilot));if(!d)return;const close=camera instanceof T.OrthographicCamera?camera.zoom>2:camera.position.distanceTo(target)<130;d.grass.visible=close&&Math.hypot(target.x-d.center.x,target.z-d.center.y)<120;}

/** Remove only old decorative tree components from the cliff asset, not its rock/path/collision. */
export function maskPilotScenicTrees(root:T.Object3D){
 if(root.userData.objectId!=='scenic_cliff')return;
 root.traverse(n=>{if(!(n instanceof T.Mesh))return;const component=n.userData.component||n.geometry.userData.sourceKey||'';if(component==='scenic:green-crown'||component==='scenic:continuous-branch:scenic_cliff'){n.visible=false;n.userData.naturePilotOldTree=true;}});
}

/** Independent seed keeps the rest of the island's existing random placement unchanged. */
export function makePilotVegetation(p:Project,surface:TerrainSurface,routes:Route[],obstacles:Obstacle[],nature:ReturnType<typeof createNatureMaterials>){
 const root=new T.Group();root.name='自然环境样板植被';root.userData.noCollision=true;
 const center=pilotCenter(p),rnd=random((p.environment?.seed??1)^0x7254),geometries=new Map<string,T.BufferGeometry>(),materials=new Map<string,T.MeshStandardMaterial>();
 const geo=(key:string,make:()=>T.BufferGeometry)=>{if(!geometries.has(key)){const g=make();g.userData.sourceKey=key;geometries.set(key,g);}return geometries.get(key)!;};
 const mat=(color:string)=>{if(color==='#766246')return nature.material('bark','#e7d6bd');if(!materials.has(color)){const m=new T.MeshStandardMaterial({color,vertexColors:true,side:T.DoubleSide,roughness:1});m.name='样板叶簇';materials.set(color,m);}return materials.get(color)!;};
 const b=new Builder({geo,mat,sign:mat}),roots:[number,number,number][]=[],types={tall:0,broad:0,lean:0,palm:0,screwPine:0},palette=['#47644a','#668154','#81915d'];
 const clearObstacles=obstacles.filter(o=>o.id!=='scenic_cliff'),clusters=[[center.x-38,center.y+28,24],[center.x-12,center.y-63,26],[center.x+28,center.y-48,21]];
 const leaf=(x:number,y:number,z:number,sx:number,sy:number,sz:number,color:string,angle:number)=>b.emit('pilot:leaf',crownGeometry,color,[x,y,z],[sx,sy,sz],new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),angle));
 const plantTree=(x:number,y:number,z:number,treeRnd:()=>number)=>{
  const kind=roots.length%3,angle=treeRnd()*Math.PI*2,h=kind===0?6.7+treeRnd()*2.4:4.4+treeRnd()*2.0,r=kind===0?1.35+treeRnd()*.35:1.8+treeRnd()*.65,lean=kind===2?1.6:0,dx=Math.cos(angle)*lean,dz=Math.sin(angle)*lean;
  const tropical=coastDistance(p.terrain,[x,z])<42&&y<28&&(x>center.x||z>center.y+10)&&roots.length%4<2;
  if(tropical&&roots.length%4===0){
   types.palm++;const height=6.5+(h-4.4)*.65,bendX=Math.cos(angle)*1.1,bendZ=Math.sin(angle)*1.1;
   for(let k=0;k<4;k++){const a=k/4,c=(k+1)/4;b.cylinder([x+bendX*a*a,y+height*a-.1,z+bendZ*a*a],[x+bendX*c*c,y+height*c,z+bendZ*c*c],.19-k*.025,'#766246',8);}
   for(let k=0;k<8;k++){const a=angle+k*Math.PI/4+(k%2)*.12,span=2.7+(k%3)*.2;b.emit('pilot:palm-frond',palmFrondGeometry,k%2?'#668154':'#47644a',[x+bendX,y+height-.06,z+bendZ],[span,span*(k%2?.85:1.15),span],new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),a));}
  }else if(tropical){
   types.screwPine++;const height=3.1+(h-4.4)*.4;
   b.cylinder([x,y-.1,z],[x+dx*.3,y+height,z+dz*.3],.19,'#766246',8);
   for(let k=0;k<4;k++){const a=angle+k*Math.PI/2,xx=x+Math.cos(a)*.72,zz=z+Math.sin(a)*.72,yy=surface.height(xx,zz)??y;b.cylinder([xx,yy-.08,zz],[x,y+1.25,z],.07,'#766246',7);}
   for(let k=0;k<3;k++){const a=angle+k*2.4,xx=x+Math.cos(a)*.65,zz=z+Math.sin(a)*.65,yy=y+height+(k===0?.6:0);b.cylinder([x,y+height*.6,z],[xx,yy,zz],.1,'#766246',7);b.emit('pilot:screw-pine',screwPineCrownGeometry,k%2?'#668154':'#47644a',[xx,yy,zz],[1.8,1.8,1.8],new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),a));}
  }else {
  b.cylinder([x,y-.1,z],[x+dx*.35,y+h*.48,z+dz*.35],.22,'#766246',8);b.cylinder([x+dx*.35,y+h*.48,z+dz*.35],[x+dx,y+h*.87,z+dz],.14,'#766246',8);
  if(kind===0){types.tall++;for(let k=0;k<4;k++){const a=angle+k*2.4,rr=r*(1-k*.16),yy=y+h*.53+k*h*.16;leaf(x+Math.cos(a)*.3,yy,z+Math.sin(a)*.3,rr,rr*.9,rr,palette[k%3],a);}}
  else {if(kind===1)types.broad++;else types.lean++;for(let k=0;k<5;k++){const a=angle+k*2.4,spread=k===0?0:r*.75,xx=x+dx+Math.cos(a)*spread,zz=z+dz+Math.sin(a)*spread,yy=y+h*.72+(k%3)*r*.48;b.cylinder([x+dx*.3,y+h*.43,z+dz*.3],[xx,yy-.2,zz],.08,'#766246',7);leaf(xx,yy,zz,r*(k===0?1:.8),r*.72,r*.84,palette[k%3],a);}}
  }
  roots.push([x,y,z]);
 };
 for(let attempt=0;attempt<2300&&roots.length<92;attempt++){
  const x=center.x+(rnd()-.5)*166,z=center.y+(rnd()-.5)*196,y=surface.height(x,z);if(y===undefined||!inNaturePilot(p,x,z)||!isLand(p.terrain,x,z)||coastDistance(p.terrain,[x,z])<7||blocked(clearObstacles,x,z,4)||roadDistance(routes,x,z)<4.5)continue;
  const slope=Math.max(Math.abs((surface.height(x+1,z)??y)-y),Math.abs((surface.height(x,z+1)??y)-y));if(slope>.6||roots.some(q=>Math.hypot(q[0]-x,q[2]-z)<3.8))continue;
  const density=Math.max(...clusters.map(([cx,cz,r])=>Math.exp(-((x-cx)**2+(z-cz)**2)/(r*r))));if(rnd()>.12+density*.85)continue;
  if(x>center.x+15&&z>center.y+8)continue;
  plantTree(x,y,z,rnd);
 }
 // A separate seeded pass adds small groves to the east meadow without moving the existing trees.
 const meadowRnd=random((p.environment?.seed??1)^0x342d),meadowShapes=random(0x71ab),groves=[[30,40,10],[35,65,11],[22,88,10]],previousTrees=roots.length;
 for(let attempt=0;attempt<800&&roots.length-previousTrees<16;attempt++){
  const [cx,cz,r]=groves[attempt%groves.length],a=meadowRnd()*Math.PI*2,d=Math.sqrt(meadowRnd())*r,x=center.x+cx+Math.cos(a)*d,z=center.y+cz+Math.sin(a)*d,y=surface.height(x,z);
  if(y===undefined||!inNaturePilot(p,x,z)||!isLand(p.terrain,x,z)||coastDistance(p.terrain,[x,z])<9||blocked(clearObstacles,x,z,4)||roadDistance(routes,x,z)<6.2||roots.some(q=>Math.hypot(q[0]-x,q[2]-z)<5))continue;
  if(Math.max(Math.abs((surface.height(x+1,z)??y)-y),Math.abs((surface.height(x,z+1)??y)-y))>.55)continue;
  plantTree(x,y,z,meadowShapes);
 }
 root.userData.meadowTrees=roots.length-previousTrees;
 // Sparse low planting collects at woodland edges; meadow and paths stay legible.
 for(let i=0;i<roots.length;i+=3){const [x,y,z]=roots[i];for(let j=0;j<2;j++){const a=i+j*2.4,xx=x+Math.cos(a)*2.2,zz=z+Math.sin(a)*2.2,yy=surface.height(xx,zz);if(yy===undefined||roadDistance(routes,xx,zz)<2.2||blocked(clearObstacles,xx,zz,2))continue;leaf(xx,yy+.5,zz,.9,.6,.85,palette[(i+j)%3],a);}}
 const canopy=b.finish();canopy.userData.naturePilotVegetation=true;canopy.traverse(n=>{n.userData.naturePilotVegetation=true;});root.add(canopy);
 const g=new Builder({geo,mat,sign:mat});for(let i=0;i<roots.length;i+=2){const [x,,z]=roots[i],xx=x+1.8,zz=z-.6,y=surface.height(xx,zz);if(y===undefined||roadDistance(routes,xx,zz)<2)continue;for(let k=0;k<3;k++)g.emit('pilot:grass',leafSprigGeometry,'#81915d',[xx+k*.28,y-.03,zz],[.75,.85,.75],new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),i+k));}
 // A few irregular understory clusters use the existing instanced sprig and
 // follow the same near-camera visibility gate as the original grass.
 for(let i=0;i<roots.length;i+=3){const [x,,z]=roots[i];for(let k=0;k<5;k++){const a=i*2.4+k*2.1,r=2.4+(k%3)*.8,xx=x+Math.cos(a)*r,zz=z+Math.sin(a)*r,y=surface.height(xx,zz);if(y===undefined||roadDistance(routes,xx,zz)<2.8||blocked(clearObstacles,xx,zz,1.2)||coastDistance(p.terrain,[xx,zz])<3)continue;const s=.65+(k%3)*.18;g.emit('pilot:grass',leafSprigGeometry,'#81915d',[xx,y-.03,zz],[s,s*(.85+(k%2)*.25),s],new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),a));}}
 const grass=g.finish();grass.name='近景小草簇';grass.visible=false;grass.traverse(n=>{n.userData.naturePilotVegetation=true;n.userData.noCollision=true;if(n instanceof T.Mesh)n.geometry.userData.surfaceKind='grass';});root.add(grass);details.set(root,{grass,center});root.userData.metrics={...types,trees:roots.length};root.userData.roots=roots;
 return {root,roots};
}
