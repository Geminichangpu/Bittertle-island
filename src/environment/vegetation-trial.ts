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
export function maskTrialTrees(root:T.Object3D,_roots:Root[]){
 root.traverse(n=>{if(n instanceof T.Mesh){const key=String(n.geometry.userData.sourceKey||'');if(key.startsWith('replace-tree:')||key.startsWith('replace-flora:')||key==='pilot:grass'||key==='life:cave-trunk'||key==='life:cave-canopy')n.visible=false;}});
 const grass=root.getObjectByName('island-fine-grass');if(grass){grass.userData.vegetationReplacement=true;grass.visible=false;}
}
function release(o:T.Object3D){const gs=new Set<T.BufferGeometry>(),ms=new Set<T.Material>(),ts=new Set<T.Texture>();o.traverse(n=>{if(n instanceof T.Mesh){gs.add(n.geometry);for(const m of Array.isArray(n.material)?n.material:[n.material]){ms.add(m);for(const v of Object.values(m))if(v instanceof T.Texture)ts.add(v);}}});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());ts.forEach(t=>t.dispose());}
export function disposeVegetationTrial(root:T.Group){cancellations.get(root)?.();cancellations.delete(root);}
export function addVegetationTrial(root:T.Group,p:Project,surface:TerrainSurface,routes:Route[],obstacles:Obstacle[],pilotRoots:Root[],globalRoots:Root[],onReady:()=>void){
 const caveRoots=(root.userData.localLife?.caveRoots||[]) as Root[];
 const beachRoots=(root.userData.beachTreeRoots||[]) as Root[];
 const selected=[...pilotRoots,...globalRoots,...caveRoots,...beachRoots];
 let cancelled=false;cancellations.set(root,()=>{cancelled=true;});
 const started=performance.now();root.userData.vegetationTrialStatus='loading';
 const promise=(async()=>{
  const {GLTFLoader}=await import('three/addons/loaders/GLTFLoader.js');const loader=new GLTFLoader();
  const url=(name:string)=>new URL('./vegetation-pilot/assets/'+name,document.baseURI).href;
  const species=['Coconut','Frangipani','Broadleaf'];
  const treeUrls=species.flatMap(name=>['','_LOD1','_LOD2'].map(suffix=>new URL('./plant-art/'+name+suffix+'.glb',document.baseURI).href));
  const flora=['Sakura_low','White_flowers','Yellow_wildflowers','Pink_ornamental','Common_grass','Ornamental_grass','Groundcover','Fern','Green_shrub','Flowering_shrub'];
  const floraUrls=flora.flatMap(name=>[1,2].map(variant=>new URL('./flora-pack/'+name+'_'+variant+'.glb',document.baseURI).href));
  const loaded=await Promise.allSettled([...treeUrls,...floraUrls].map(path=>loader.loadAsync(path)));
  const sources=loaded.flatMap(result=>result.status==='fulfilled'?[result.value.scene]:[]);
  if(cancelled||loaded.some(r=>r.status==='rejected')){sources.forEach(release);if(!cancelled)throw new Error('vegetation assets could not be loaded');return;}
  const group=new T.Group();group.name='vegetation-pilot';group.userData.noCollision=true;
  const make=(source:T.Group,places:Placement[],height:number)=>{
   source.updateMatrixWorld(true);const box=new T.Box3().setFromObject(source),size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3());if(!size.y)return;
   const norm=new T.Matrix4().makeScale(height/size.y,height/size.y,height/size.y).multiply(new T.Matrix4().makeTranslation(-center.x,-box.min.y,-center.z));
   const chunks=new Map<string,Placement[]>();for(const q of places){const k=Math.floor(q.x/128)+','+Math.floor(q.z/128),a=chunks.get(k)||[];a.push(q);chunks.set(k,a);}
   source.traverse(n=>{if(!(n instanceof T.Mesh))return;for(const places of chunks.values()){const mesh=new T.InstancedMesh(n.geometry,n.material,places.length);mesh.castShadow=false;mesh.receiveShadow=true;mesh.userData.noCollision=true;
    places.forEach((q,i)=>{const matrix=new T.Matrix4().compose(new T.Vector3(q.x,q.y,q.z),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),q.angle),new T.Vector3(q.scale,q.scale,q.scale)).multiply(norm).multiply(n.matrixWorld);mesh.setMatrixAt(i,matrix);});mesh.computeBoundingSphere();group.add(mesh);}
   });
  };
  const trees=selected.map((q,i)=>({x:q[0],y:q[1],z:q[2],angle:i*2.4,scale:.78+(i%5)*.055}));
  const speciesCounts=[0,0,0];
  const treeChunks=new Map<string,{kind:number;places:Placement[]}>();
  trees.forEach((q,i)=>{const coast=coastDistance(p.terrain,[q.x,q.z]);const kind=beachRoots.includes(selected[i])||(coast<42&&q.y<28&&i%3===0)?0:(i%5===1||roadDistance(routes,q.x,q.z)<9&&i%3===1)?1:2;speciesCounts[kind]++;const key=kind+':'+Math.floor(q.x/28)+':'+Math.floor(q.z/28),chunk=treeChunks.get(key)||{kind,places:[]};chunk.places.push(q);treeChunks.set(key,chunk);});
  for(const {kind,places} of treeChunks.values()){
   const lod=new T.LOD();lod.name='plant-art-'+species[kind];lod.position.set(places.reduce((a,q)=>a+q.x,0)/places.length,places.reduce((a,q)=>a+q.y,0)/places.length,places.reduce((a,q)=>a+q.z,0)/places.length);
   for(let level=0;level<3;level++){
    const source=sources[kind*3+level],layer=new T.Group();source.updateMatrixWorld(true);
    source.traverse(n=>{if(!(n instanceof T.Mesh))return;const mesh=new T.InstancedMesh(n.geometry,n.material,places.length);mesh.userData.noCollision=true;mesh.userData.plantSpecies=species[kind];mesh.userData.plantLod=level;mesh.receiveShadow=true;mesh.castShadow=level===0;
     places.forEach((q,i)=>mesh.setMatrixAt(i,new T.Matrix4().compose(new T.Vector3(q.x,q.y,q.z).sub(lod.position),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),q.angle),new T.Vector3(q.scale,q.scale,q.scale)).multiply(n.matrixWorld)));mesh.computeBoundingSphere();layer.add(mesh);
    });lod.addLevel(layer,level===0?0:level===1?55:130,.12);
   }group.add(lod);
  }
  const plants:Placement[]=[],flowers:Placement[]=[],grass=root.getObjectByName('island-fine-grass'),m=new T.Matrix4(),v=new T.Vector3();let index=0;
  grass?.traverse(n=>{if(!(n instanceof T.InstancedMesh))return;for(let i=0;i<n.count;i++){n.getMatrixAt(i,m);v.setFromMatrixPosition(m);const q={x:v.x,y:v.y,z:v.z,angle:index*2.4,scale:.75+(index%5)*.08};if(index%6===0)flowers.push(q);else plants.push(q);index++;}});
  const clear=obstacles.filter(o=>o.id!=='scenic_cliff');
  for(let i=0;i<pilotRoots.length;i++){const q=pilotRoots[i];for(let k=0;k<8;k++){const a=i*2.4+k*2.1,d=2.2+(k%3)*1.4,x=q[0]+Math.cos(a)*d,z=q[2]+Math.sin(a)*d,y=surface.height(x,z);if(y===undefined||!isLand(p.terrain,x,z)||inNorthBeach(p,x,z)||coastDistance(p.terrain,[x,z])<6||blocked(clear,x,z,1.2)||roadDistance(routes,x,z)<2.7)continue;const place={x,y:y-.02,z,angle:a,scale:.8+(k%3)*.1};(k%5===0?flowers:plants).push(place);}}
  const batches=Array.from({length:20},()=>[] as Placement[]),floraCounts=Array.from({length:10},()=>0);
  plants.forEach((q,i)=>{const k=i%100,kind=k<68?4:k<78?5:k<87?6:k<93?7:k<98?8:9,variant=(Math.floor(i/7)+i)%2;batches[kind*2+variant].push(q);floraCounts[kind]++;});
  flowers.forEach((q,i)=>{const kind=i%23===0?9:i%4,variant=(Math.floor(i/5)+i)%2;batches[kind*2+variant].push(q);floraCounts[kind]++;});
  const heights=[.62,.80,.86,.92,.62,1.30,.25,.70,.80,.85];
  batches.forEach((places,i)=>{if(places.length)make(sources[9+i],places,heights[Math.floor(i/2)]);});
  if(cancelled){release(group);return;}
  cancellations.set(root,()=>{cancelled=true;release(group);});root.add(group);maskTrialTrees(root,selected);root.userData.vegetationTrialRoots=selected;root.userData.vegetationTrialStatus='ready';root.userData.vegetationTrialMetrics={trees:trees.length,species:Object.fromEntries(species.map((s,i)=>[s,speciesCounts[i]])),flora:Object.fromEntries(flora.map((s,i)=>[s,floraCounts[i]])),assetVersion:'flora-pack-20261106',lodLevels:3,grass:plants.length,flowers:flowers.length,chunks:group.children.length,loadMs:Math.round(performance.now()-started)};onReady();
 })().catch(error=>{if(!cancelled){root.userData.vegetationTrialStatus='failed';console.warn('Vegetation unavailable; existing vegetation retained',error);}});
 root.userData.vegetationTrialPromise=promise;
}
