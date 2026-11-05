import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {TerrainSurface} from '../environment/surface';
import type {SceneController} from './SceneController';

const originals=new WeakMap<T.InstancedMesh,T.Matrix4[]>();
/** Clear tree instances only, in every LOD; retain original matrices for later moves. */
export function clearTreesNear(root:T.Object3D,center:T.Vector3,radius=7.5,gate?:T.Vector3){
 root.updateWorldMatrix(true,true);let removed=0;
 root.traverse(n=>{if(!(n instanceof T.InstancedMesh)||!n.userData.plantSpecies)return;
  let saved=originals.get(n);if(!saved){saved=[];for(let i=0;i<n.count;i++){const m=new T.Matrix4();n.getMatrixAt(i,m);saved.push(m);}originals.set(n,saved);}
  const v=new T.Vector3(),zero=new T.Vector3(0,0,0);
  saved.forEach((original,i)=>{const m=original.clone();v.setFromMatrixPosition(m).applyMatrix4(n.matrixWorld);let between=false;if(gate){const dx=center.x-gate.x,dz=center.z-gate.z,t=((v.x-gate.x)*dx+(v.z-gate.z)*dz)/(dx*dx+dz*dz);between=t>0&&t<1&&Math.hypot(v.x-(gate.x+t*dx),v.z-(gate.z+t*dz))<3;}if(between||Math.hypot(v.x-center.x,v.z-center.z)<radius){m.scale(zero);if(n.userData.plantLod===0)removed++;}n.setMatrixAt(i,m);});n.instanceMatrix.needsUpdate=true;
 });return removed;
}

/** Replacement attaches to the authored object; its petals and surroundings stay intact. */
export class SakuraAssets {
 private templates?:[T.Group,T.Group];private disposed=false;
 private pendingEnvironments=new WeakSet<T.Group>();
 readonly ready:Promise<void>;
 constructor(private owner:SceneController){
  const loader=new GLTFLoader(),url=(name:string)=>new URL('./plant-art/'+name+'.glb',document.baseURI).href;
  this.ready=Promise.all([loader.loadAsync(url('Mature')),loader.loadAsync(url('Young'))]).then(results=>{
   this.templates=[results[0].scene,results[1].scene];if(this.disposed){this.dispose();return;}
   this.sync();owner.invalidateShadows();owner.requestRender();
  }).catch(e=>{console.warn('樱花树资产加载失败，保留原樱花树',e);});
 }
 sync(){
  if(!this.templates||this.disposed)return;
  const mature=this.owner.node('scenic_sakura'),gate=this.owner.node('shrine_torii');
  if(mature&&!mature.getObjectByName('sakura-mature-new')){
   const clone=this.templates[0].clone(true);clone.name='sakura-mature-new';clone.traverse(o=>{o.userData.objectId='scenic_sakura';if(o instanceof T.Mesh){o.castShadow=true;o.receiveShadow=true;}});mature.add(clone);
   mature.traverse(o=>{if(o instanceof T.Mesh&&!o.getObjectByName('sakura-mature-new')){const key=String(o.geometry.userData.sourceKey||o.userData.feature||'');if(key==='scenic:blossom'||key==='scenic:continuous-branch:scenic_sakura'){o.visible=false;o.userData.sakuraOld=true;}}});
  }
  let young=this.owner.objects.getObjectByName('sakura-young-new');
  if(!gate){young?.removeFromParent();return;}
  if(!young){young=this.templates[1].clone(true);young.name='sakura-young-new';young.traverse(o=>{o.userData.objectId='sakura-young-new';if(o instanceof T.Mesh){o.castShadow=true;o.receiveShadow=true;}});this.owner.objects.add(young);}
  gate.updateWorldMatrix(true,false);const pos=gate.getWorldPosition(new T.Vector3());pos.x+=15;pos.z+=12;
  pos.y=new TerrainSurface(this.owner.terrain.geometry).height(pos.x,pos.z)??pos.y;
  this.owner.objects.updateWorldMatrix(true,false);young.position.copy(this.owner.objects.worldToLocal(pos));
  young.userData.placement='15m east and 12m south of torii';young.updateMatrixWorld(true);
  const environment=this.owner.environment,clear=()=>{if(this.disposed||this.owner.environment!==environment)return;const group=environment.getObjectByName('vegetation-pilot');if(group){young!.updateWorldMatrix(true,false);gate.updateWorldMatrix(true,false);clearTreesNear(group,young!.getWorldPosition(new T.Vector3()),7.5,gate.getWorldPosition(new T.Vector3()));this.owner.invalidateShadows();this.owner.requestRender();}};
  clear();const pending=environment.userData.vegetationTrialPromise as Promise<void>|undefined;if(pending&&!this.pendingEnvironments.has(environment)){this.pendingEnvironments.add(environment);void pending.then(clear);}
 }
 dispose(){this.disposed=true;if(!this.templates)return;const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>(),textures=new Set<T.Texture>();for(const t of this.templates)t.traverse(o=>{if(o instanceof T.Mesh){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){materials.add(m);for(const v of Object.values(m))if(v instanceof T.Texture)textures.add(v);}}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());this.templates=undefined;}
}
