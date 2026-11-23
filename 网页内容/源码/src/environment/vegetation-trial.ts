import {islandLoadingManager} from '../models/island-loading-manager';
import * as T from 'three';
import type {Project} from '../data/model';
import {isLand,coastDistance} from '../terrain/terrain';
import {isNaturalLandform} from '../terrain/natural-landform';
import {inCherryClearing,shrineTreeClearings} from './remaster-canopy';
import type {RemasterPlanting} from './remaster-vegetation';
import {transformMatrix} from '../terrain/placement';
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
export function addVegetationTrial(root:T.Group,p:Project,surface:TerrainSurface,routes:Route[],obstacles:Obstacle[],pilotRoots:Root[],globalRoots:Root[],onReady:()=>void,planting?:RemasterPlanting){
 const caveRoots=(root.userData.localLife?.caveRoots||[]) as Root[];
 const beachRoots=(root.userData.beachTreeRoots||[]) as Root[];
 const natural=isNaturalLandform(p.terrain);
 const slope=new Set(planting?.slope??[]),cherries=shrineTreeClearings(p);
 const selected=natural&&planting?[...planting.trees,...planting.slope,...caveRoots,...beachRoots]:[...pilotRoots,...globalRoots,...caveRoots,...beachRoots];
 let cancelled=false;cancellations.set(root,()=>{cancelled=true;});
 const started=performance.now();root.userData.vegetationTrialStatus='loading';
 const promise=(async()=>{
  const {GLTFLoader}=await import('three/addons/loaders/GLTFLoader.js');const loader=new GLTFLoader(islandLoadingManager());
  const species=['Coconut','Frangipani','Broadleaf'];
  const crownRadii=[4.6,4.8,5.6];
  const treeUrls=species.flatMap(name=>['','_LOD1','_LOD2'].map(suffix=>new URL('./plant-art/'+name+suffix+'.glb',document.baseURI).href));
  const flora=['Sakura_low','White_flowers','Yellow_wildflowers','Pink_ornamental','Common_grass','Ornamental_grass','Groundcover','Fern','Green_shrub','Flowering_shrub'];
  const floraUrls=flora.flatMap(name=>[1,2].map(variant=>new URL('./flora-pack/'+name+'_'+variant+'.glb',document.baseURI).href));
  const loaded=await Promise.allSettled([...treeUrls,...floraUrls].map(path=>loader.loadAsync(path)));
  const sources=loaded.map(result=>result.status==='fulfilled'?result.value.scene:undefined);
  if(cancelled){sources.forEach(source=>source&&release(source));return;}
  const trees=species.map((_,k)=>sources.slice(k*3,k*3+3));
  const fallback=trees.findIndex(levels=>levels.some(Boolean));
  if(fallback===-1){sources.forEach(source=>source&&release(source));throw new Error('树木模型未能加载');}
  const group=new T.Group();group.name='vegetation-pilot';group.userData.noCollision=true;
  const make=(source:T.Group,places:Placement[],height:number)=>{
   source.updateMatrixWorld(true);const box=new T.Box3().setFromObject(source),size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3());if(!size.y)return;
   const norm=new T.Matrix4().makeScale(height/size.y,height/size.y,height/size.y).multiply(new T.Matrix4().makeTranslation(-center.x,-box.min.y,-center.z));
   const chunks=new Map<string,Placement[]>();for(const q of places){const k=Math.floor(q.x/32)+','+Math.floor(q.z/32),a=chunks.get(k)||[];a.push(q);chunks.set(k,a);}
   source.traverse(n=>{if(!(n instanceof T.Mesh))return;for(const places of chunks.values()){const mesh=new T.InstancedMesh(n.geometry,n.material,places.length);mesh.castShadow=false;mesh.receiveShadow=true;mesh.userData.noCollision=true;mesh.userData.walkDetailRange=65;
    places.forEach((q,i)=>{const matrix=new T.Matrix4().compose(new T.Vector3(q.x,q.y,q.z),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),q.angle),new T.Vector3(q.scale,q.scale,q.scale)).multiply(norm).multiply(n.matrixWorld);mesh.setMatrixAt(i,matrix);});mesh.computeBoundingSphere();group.add(mesh);}
   });
  };
  const speciesCounts=[0,0,0];
  const treeChunks=new Map<string,{kind:number;places:Placement[]}>();
  const beach=new Set(beachRoots),kept:Root[]=[];
  selected.forEach((point,i)=>{
   const [x,y,z]=point,coast=coastDistance(p.terrain,[x,z]);
   const patch=Math.sin(x*.087+Math.cos(z*.061))*.53+Math.sin(z*.103-x*.023)*.47;
   const variation=Math.abs(Math.sin(x*27.61+z*11.43)*1543.7)%1;
   const hill=slope.has(point);
   if(!natural&&!beach.has(point)&&patch<-.30&&variation<.39)return;
   let kind=hill?(variation<.23?1:2):beach.has(point)||(coast<42&&y<28&&variation<.45)?0:
    (roadDistance(routes,x,z)<9&&variation<.64)||(patch>.38&&variation<.52)?1:2;
   if(!trees[kind].some(Boolean))kind=fallback;
   const scale=hill?.78+.19*variation:.66+.32*variation+.12*(patch+1)/2;
   if(inCherryClearing(x,z,crownRadii[kind]*scale,cherries))return;
   const q={x,y,z,angle:i*2.39996+variation*.6,scale};
   kept.push(point);
   speciesCounts[kind]++;const key=kind+':'+Math.floor(q.x/28)+':'+Math.floor(q.z/28),chunk=treeChunks.get(key)||{kind,places:[]};chunk.places.push(q);treeChunks.set(key,chunk);});
  for(const {kind,places} of treeChunks.values()){
   const lod=new T.LOD();lod.name='plant-art-'+species[kind];lod.position.set(places.reduce((a,q)=>a+q.x,0)/places.length,places.reduce((a,q)=>a+q.y,0)/places.length,places.reduce((a,q)=>a+q.z,0)/places.length);
   for(let level=0;level<3;level++){
    const source=trees[kind][level]??trees[kind].find((model):model is T.Group=>!!model)!;
    const layer=new T.Group();source.updateMatrixWorld(true);
    source.traverse(n=>{if(!(n instanceof T.Mesh))return;const mesh=new T.InstancedMesh(n.geometry,n.material,places.length);mesh.userData.noCollision=true;mesh.userData.plantSpecies=species[kind];mesh.userData.plantLod=level;mesh.userData.plantFootprints=places.map(q=>[q.x-lod.position.x,q.z-lod.position.z,crownRadii[kind]*q.scale]);mesh.receiveShadow=true;mesh.castShadow=level===0;
     places.forEach((q,i)=>mesh.setMatrixAt(i,new T.Matrix4().compose(new T.Vector3(q.x,q.y,q.z).sub(lod.position),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),q.angle),new T.Vector3(q.scale,q.scale,q.scale)).multiply(n.matrixWorld)));mesh.computeBoundingSphere();layer.add(mesh);
    });lod.addLevel(layer,level===0?0:level===1?30:80,.12);
   }group.add(lod);
  }
  const plants:Placement[]=[],flowers:Placement[]=[],grass=root.getObjectByName('island-fine-grass'),m=new T.Matrix4(),v=new T.Vector3();let index=0;
  grass?.traverse(n=>{if(!(n instanceof T.InstancedMesh))return;for(let i=0;i<n.count;i++){n.getMatrixAt(i,m);v.setFromMatrixPosition(m);const q={x:v.x,y:v.y,z:v.z,angle:index*2.4,scale:.75+(index%5)*.08};if(index%6===0)flowers.push(q);else plants.push(q);index++;}});
  const clear=obstacles.filter(o=>o.id!=='scenic_cliff');
  for(let i=0;i<pilotRoots.length;i++){const q=pilotRoots[i];for(let k=0;k<8;k++){const a=i*2.4+k*2.1,d=2.2+(k%3)*1.4,x=q[0]+Math.cos(a)*d,z=q[2]+Math.sin(a)*d,y=surface.height(x,z);if(y===undefined||!isLand(p.terrain,x,z)||inNorthBeach(p,x,z)||coastDistance(p.terrain,[x,z])<6||blocked(clear,x,z,1.2)||roadDistance(routes,x,z)<2.7)continue;const place={x,y:y-.02,z,angle:a,scale:.8+(k%3)*.1};(k%5===0?flowers:plants).push(place);}}
  const origin=(id:string)=>{
   const object=p.objects.find(o=>o.id===id);if(!object)return;
   const matrix=transformMatrix(object),parent=p.groups?.find(g=>g.id===object.parentId);
   if(parent)matrix.premultiply(transformMatrix(parent));
   return new T.Vector3().setFromMatrixPosition(matrix);
  };
  const blossom=origin('scenic_sakura'),gate=origin('shrine_torii');
  if(blossom&&gate){
   const end=gate.add(new T.Vector3(15,0,12)),delta=end.clone().sub(blossom);
   const normal=new T.Vector2(-delta.z,delta.x).normalize();
   const structures=clear.filter(o=>o.id!=='scenic_sakura');
   for(let j=0;j<30;j++){
    const t=.08+.84*(Math.floor(j/3)+.5)/10,side=Math.sin(j*2.4)*2.7;
    const x=blossom.x+t*delta.x+normal.x*side,z=blossom.z+t*delta.z+normal.y*side,y=surface.height(x,z);
    if(y===undefined||!isLand(p.terrain,x,z)||blocked(structures,x,z,.45)||roadDistance(routes,x,z)<2.5)continue;
    (j%4===1?flowers:plants).push({x,y:y-.015,z,angle:j*2.4,scale:.56+.09*(j%4)});
   }
  }
  const batches=Array.from({length:20},()=>[] as Placement[]),floraCounts=Array.from({length:10},()=>0);
  plants.forEach((q,i)=>{const k=i%100,kind=k<68?4:k<78?5:k<87?6:k<93?7:k<98?8:9,variant=(Math.floor(i/7)+i)%2;batches[kind*2+variant].push(q);floraCounts[kind]++;});
  flowers.forEach((q,i)=>{const kind=i%23===0?9:i%4,variant=(Math.floor(i/5)+i)%2;batches[kind*2+variant].push(q);floraCounts[kind]++;});
  planting?.shrubs.forEach(([x,y,z],i)=>{const kind=i%7===0?9:8,variant=i%2;batches[kind*2+variant].push({x,y:y-.015,z,angle:i*2.39996,scale:1.0+.16*(i%4)});floraCounts[kind]++;});
  const heights=[.62,.80,.86,.92,.62,1.30,.25,.70,.80,.85];
  batches.forEach((places,i)=>{const source=sources[species.length*3+i];if(source&&places.length)make(source,places,heights[Math.floor(i/2)]);});
  if(cancelled){release(group);return;}
  cancellations.set(root,()=>{cancelled=true;release(group);});root.add(group);maskTrialTrees(root,selected);root.userData.vegetationTrialRoots=kept;root.userData.vegetationTrialStatus='ready';root.userData.vegetationTrialMetrics={trees:kept.length,species:Object.fromEntries(species.map((s,i)=>[s,speciesCounts[i]])),flora:Object.fromEntries(flora.map((s,i)=>[s,floraCounts[i]])),shrineSlopeTrees:kept.filter(q=>slope.has(q)).length,assetVersion:'island-renewal',lodLevels:3,grass:plants.length,flowers:flowers.length,chunks:group.children.length,loadMs:Math.round(performance.now()-started)};onReady();
 })().catch(error=>{if(!cancelled){root.userData.vegetationTrialStatus='failed';console.warn('Vegetation unavailable; existing vegetation retained',error);}});
 root.userData.vegetationTrialPromise=promise;
}
