import * as T from 'three';
import type {Project} from '../data/model';
import {isLand,coastDistance} from '../terrain/terrain';
import {inNorthBeach} from './north-beach';
import {blocked,roadDistance,type Obstacle,type Route} from './paths';
import type {TerrainSurface} from './surface';

const cancellations=new WeakMap<T.Group,()=>void>();
type Root=[number,number,number];
type Placement={x:number;y:number;z:number;angle:number;scale:number};
/** Hide only the old vegetation selected for replacement, after every new asset loads. */
export function maskTrialTrees(root:T.Object3D,roots:Root[]){
 const m=new T.Matrix4(),v=new T.Vector3(),zero=new T.Vector3(0,0,0),buckets=new Map<string,Root[]>();
 for(const q of roots){const k=Math.floor(q[0]/8)+','+Math.floor(q[2]/8);const b=buckets.get(k)||[];b.push(q);buckets.set(k,b);}
 const near=(x:number,z:number,r:number)=>{const ix=Math.floor(x/8),iz=Math.floor(z/8);for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)for(const q of buckets.get((ix+dx)+','+(iz+dz))||[])if(Math.hypot(q[0]-x,q[2]-z)<r)return true;return false;};
 root.traverse(n=>{if(!(n instanceof T.InstancedMesh))return;const key=n.geometry.userData.sourceKey as string|undefined;
  const pilot=n.userData.naturePilotVegetation,global=n.userData.globalNatureInstances&&!!key&&(key.startsWith('env:leaf')||key==='env:tapered-trunk'||key.startsWith('shrine:cyl:'));
  if(!pilot&&!global)return;
  for(let i=0;i<n.count;i++){n.getMatrixAt(i,m);v.setFromMatrixPosition(m);if(near(v.x,v.z,key?.startsWith('shrine:cyl:')?1.8:3.1)){m.scale(zero);n.setMatrixAt(i,m);n.instanceMatrix.needsUpdate=true;}}
 });
 const grass=root.getObjectByName('island-fine-grass');if(grass){grass.userData.vegetationReplacement=true;grass.visible=false;}
}
function release(o:T.Object3D){const gs=new Set<T.BufferGeometry>(),ms=new Set<T.Material>(),ts=new Set<T.Texture>();o.traverse(n=>{if(n instanceof T.Mesh){gs.add(n.geometry);for(const m of Array.isArray(n.material)?n.material:[n.material]){ms.add(m);for(const v of Object.values(m))if(v instanceof T.Texture)ts.add(v);}}});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());ts.forEach(t=>t.dispose());}
export function disposeVegetationTrial(root:T.Group){cancellations.get(root)?.();cancellations.delete(root);}
export function addVegetationTrial(root:T.Group,p:Project,surface:TerrainSurface,routes:Route[],obstacles:Obstacle[],pilotRoots:Root[],globalRoots:Root[],onReady:()=>void){
 // Keep distinctive palms and a share of the original forest; spread selected oak trees across the island.
 const center=p.groups?.find(g=>g.id==='shrine_group')?.position||[139,0,-21];
 const pilot=pilotRoots.filter((q,i)=>{const coast=coastDistance(p.terrain,[q[0],q[2]]),tropical=coast<42&&q[1]<28&&(q[0]>center[0]||q[2]>center[2]+10)&&i%4<2;return !tropical&&i%3!==0&&!inNorthBeach(p,q[0],q[2])&&coast>12;});
 const limit=p.settings.quality==='low'?90:160,step=Math.max(1,Math.ceil(globalRoots.length/limit));
 const caveRoots=(root.userData.localLife?.caveRoots||[]) as Root[];
 const selected=[...pilot,...globalRoots.filter((q,i)=>i%step===0&&!inNorthBeach(p,q[0],q[2])&&coastDistance(p.terrain,[q[0],q[2]])>12),...caveRoots];
 let cancelled=false;cancellations.set(root,()=>{cancelled=true;});
 const started=performance.now();root.userData.vegetationTrialStatus='loading';
 const promise=(async()=>{
  const {GLTFLoader}=await import('three/addons/loaders/GLTFLoader.js');const loader=new GLTFLoader();
  const url=(name:string)=>new URL('./vegetation-pilot/assets/'+name,document.baseURI).href;
  const loaded=await Promise.allSettled(['ez-oak-medium.glb','Grass_Common_Tall.gltf','Flower_3_Group.gltf'].map(name=>loader.loadAsync(url(name))));
  const sources=loaded.flatMap(result=>result.status==='fulfilled'?[result.value.scene]:[]);
  if(cancelled||loaded.some(r=>r.status==='rejected')){sources.forEach(release);if(!cancelled)throw new Error('vegetation assets could not be loaded');return;}
  const group=new T.Group();group.name='vegetation-pilot';group.userData.noCollision=true;
  const make=(source:T.Group,places:Placement[],height:number)=>{
   source.updateMatrixWorld(true);const box=new T.Box3().setFromObject(source),size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3());if(!size.y)return;
   const norm=new T.Matrix4().makeScale(height/size.y,height/size.y,height/size.y).multiply(new T.Matrix4().makeTranslation(-center.x,-box.min.y,-center.z));
   const chunks=new Map<string,Placement[]>();for(const q of places){const k=Math.floor(q.x/64)+','+Math.floor(q.z/64),a=chunks.get(k)||[];a.push(q);chunks.set(k,a);}
   source.traverse(n=>{if(!(n instanceof T.Mesh))return;for(const places of chunks.values()){const mesh=new T.InstancedMesh(n.geometry,n.material,places.length);mesh.castShadow=false;mesh.receiveShadow=true;mesh.userData.noCollision=true;mesh.userData.walkDetailRange=height>1?180:75;
    places.forEach((q,i)=>{const matrix=new T.Matrix4().compose(new T.Vector3(q.x,q.y,q.z),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),q.angle),new T.Vector3(q.scale,q.scale,q.scale)).multiply(norm).multiply(n.matrixWorld);mesh.setMatrixAt(i,matrix);});mesh.computeBoundingSphere();group.add(mesh);}
   });
  };
  const trees=selected.map((q,i)=>({x:q[0],y:q[1],z:q[2],angle:i*2.4,scale:.82+(i%5)*.08}));
  const plants:Placement[]=[],flowers:Placement[]=[],grass=root.getObjectByName('island-fine-grass'),m=new T.Matrix4(),v=new T.Vector3();let index=0;
  grass?.traverse(n=>{if(!(n instanceof T.InstancedMesh))return;for(let i=0;i<n.count;i++){n.getMatrixAt(i,m);v.setFromMatrixPosition(m);const q={x:v.x,y:v.y,z:v.z,angle:index*2.4,scale:.75+(index%5)*.08};if(index%6===0)flowers.push(q);else plants.push(q);index++;}});
  const clear=obstacles.filter(o=>o.id!=='scenic_cliff');
  for(let i=0;i<pilotRoots.length;i++){const q=pilotRoots[i];for(let k=0;k<8;k++){const a=i*2.4+k*2.1,d=2.2+(k%3)*1.4,x=q[0]+Math.cos(a)*d,z=q[2]+Math.sin(a)*d,y=surface.height(x,z);if(y===undefined||!isLand(p.terrain,x,z)||inNorthBeach(p,x,z)||coastDistance(p.terrain,[x,z])<6||blocked(clear,x,z,1.2)||roadDistance(routes,x,z)<2.7)continue;const place={x,y:y-.02,z,angle:a,scale:.8+(k%3)*.1};(k%5===0?flowers:plants).push(place);}}
  make(sources[0],trees,5.5);make(sources[1],plants,.7);make(sources[2],flowers,.7);
  if(cancelled){release(group);return;}
  cancellations.set(root,()=>{cancelled=true;release(group);});root.add(group);maskTrialTrees(root,selected);root.userData.vegetationTrialRoots=selected;root.userData.vegetationTrialStatus='ready';root.userData.vegetationTrialMetrics={trees:trees.length,grass:plants.length,flowers:flowers.length,chunks:group.children.length,loadMs:Math.round(performance.now()-started)};onReady();
 })().catch(error=>{if(!cancelled){root.userData.vegetationTrialStatus='failed';console.warn('Vegetation unavailable; existing vegetation retained',error);}});
 root.userData.vegetationTrialPromise=promise;
}
