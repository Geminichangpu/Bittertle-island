import * as T from 'three';
import {loadAbortableGLB} from '../models/loadAbortableGLB';
import {disposeAboTrial} from '../models/abo-test';
import loungerUrl from '../assets/abo-test/B07YNFQCWM.glb?url';

const cancellations=new WeakMap<T.Group,()=>void>();
const starters=new WeakMap<T.Group,()=>void>();
type Place={x:number;y:number;z:number};

/** Replace the original beach loungers only after the shared model has loaded. */
export function addAboBeach(root:T.Group,fallback:T.Group,places:Place[],onReady:()=>void){
 if(!places.length)return;
 const controller=new AbortController();let owned:T.Group|undefined;
 cancellations.set(root,()=>{controller.abort();if(owned)disposeAboTrial(owned);});
 root.userData.aboBeachStatus='idle';
 let started=false;const start=()=>{if(started||controller.signal.aborted)return;started=true;root.userData.aboBeachStatus='loading';
 root.userData.aboBeachPromise=(async()=>{
  const {scene}=await loadAbortableGLB(loungerUrl,controller.signal);
  if(controller.signal.aborted){disposeAboTrial(scene);return;}
  scene.updateMatrixWorld(true);let box=new T.Box3().setFromObject(scene),size=box.getSize(new T.Vector3());
  if(size.x>size.z){scene.rotation.y=Math.PI/2;scene.updateMatrixWorld(true);box=new T.Box3().setFromObject(scene);size=box.getSize(new T.Vector3());}
  const length=Math.max(size.x,size.z),center=box.getCenter(new T.Vector3());
  if(!Number.isFinite(length)||length<=0){disposeAboTrial(scene);throw new Error('海滩躺椅尺寸无效');}
  const norm=new T.Matrix4().makeScale(2.3/length,2.3/length,2.3/length).multiply(new T.Matrix4().makeTranslation(-center.x,-box.min.y,-center.z));
  const group=new T.Group();group.name='abo-beach-loungers';root.userData.aboBeachPlaces=places;group.userData.noCollision=true;
  scene.traverse(node=>{if(!(node instanceof T.Mesh))return;const mesh=new T.InstancedMesh(node.geometry,node.material,places.length);mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.noCollision=true;
   places.forEach((p,i)=>{const placement=new T.Matrix4().makeTranslation(p.x,p.y,p.z);mesh.setMatrixAt(i,placement.multiply(new T.Matrix4().makeRotationY(Math.PI)).multiply(norm).multiply(node.matrixWorld));});mesh.computeBoundingSphere();group.add(mesh);
  });
  if(!group.children.length){disposeAboTrial(scene);throw new Error('海滩躺椅模型没有网格');}
  if(controller.signal.aborted){disposeAboTrial(group);return;}
  owned=group;root.add(group);fallback.visible=false;root.userData.aboBeachStatus='ready';root.userData.aboBeachCount=places.length;onReady();
 })().catch(error=>{if(!controller.signal.aborted){root.userData.aboBeachStatus='failed';console.warn('海滩躺椅加载失败，保留原模型',error);}});};starters.set(root,start);
}
export function requestAboBeach(root:T.Group,target:T.Vector3,close:boolean,all=false){if(!close)return;const points=(root.userData.northBeach||[]) as Place[];if(all||points.some(p=>Math.hypot(target.x-p.x,target.z-p.z)<75))starters.get(root)?.();}
export function disposeAboBeach(root:T.Group){cancellations.get(root)?.();cancellations.delete(root);starters.delete(root);}
