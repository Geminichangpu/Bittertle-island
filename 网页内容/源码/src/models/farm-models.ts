import * as T from 'three';
import {loadAbortableGLB} from './loadAbortableGLB';
import c0 from '../assets/island-craft/farm-crop-0.glb?url';
import c1 from '../assets/island-craft/farm-crop-1.glb?url';
import c2 from '../assets/island-craft/farm-crop-2.glb?url';
import c3 from '../assets/island-craft/farm-crop-3.glb?url';
import forageUrl from '../assets/island-craft/farm-forage-bins.glb?url';
import sheepUrl from '../assets/cc0-test/farm-sheep.glb?url';

function instances(source:T.Group,placements:T.Matrix4[],height:number){
 source.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(source),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
 if(!Number.isFinite(size.y)||size.y<=0)throw new Error('Invalid farm model bounds');
 const factor=height/size.y,normal=new T.Matrix4().makeScale(factor,factor,factor).multiply(new T.Matrix4().makeTranslation(-center.x,-bounds.min.y,-center.z));
 const group=new T.Group();group.userData.noCollision=true;
 source.traverse(n=>{if(!(n instanceof T.Mesh))return;const mesh=new T.InstancedMesh(n.geometry,n.material,placements.length);mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.noCollision=true;
  placements.forEach((m,i)=>mesh.setMatrixAt(i,m.clone().multiply(normal).multiply(n.matrixWorld)));mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();group.add(mesh);
 });return group;
}

/** Called only for the farm asset; retain the original crop meshes until all four assets are ready. */
export async function addFarmCrops(scene:T.Group,signal:AbortSignal){
 const sources=await Promise.all([c0,c1,c2,c3].map(async u=>(await loadAbortableGLB(u,signal)).scene));
 if(signal.aborted)return;
 let kind=0;
 for(const x of [-8,6])for(const z of [-6,6]){
  const matrices:T.Matrix4[]=[];
  const count=[8,7,6,7][kind],height=[.64,.81,.86,.59][kind];
  for(let row=0;row<5;row++)for(let j=0;j<count;j++){
   const a=2.39996*(row*count+j)+kind,scale=.74+.28*(.5+.5*Math.sin(a+row*.4));
   const xx=x-4.08+j*(7.9/(count-1))+(row%2)*.16+.08*Math.sin(a);
   const zz=z-3+row*1.4+.095*Math.cos(a);
   matrices.push(new T.Matrix4().compose(new T.Vector3(xx,.47,zz),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),a),new T.Vector3(scale,scale,scale)));
  }
  const g=instances(sources[kind],matrices,height);g.name='custom-farm-crops-'+kind;scene.add(g);kind++;
 }
}

export async function addFarmForage(farmGroup:T.Group,transform:T.Matrix4,signal:AbortSignal){
 const {scene}=await loadAbortableGLB(forageUrl,signal);
 if(signal.aborted){scene.traverse(n=>{if(n instanceof T.Mesh){n.geometry.dispose();for(const m of Array.isArray(n.material)?n.material:[n.material])m.dispose();}});return;}
 const bounds=new T.Box3().setFromObject(scene),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
 const fit=transform.clone().multiply(new T.Matrix4().makeTranslation(-11,.625,-13))
  .multiply(new T.Matrix4().makeScale(4.97/size.x,.95/size.y,1.13/size.z))
  .multiply(new T.Matrix4().makeTranslation(-center.x,-bounds.min.y,-center.z));
 scene.applyMatrix4(fit);scene.name='farm-forage-bins';scene.traverse(n=>{if(n instanceof T.Mesh){n.castShadow=true;n.receiveShadow=true;}});
 farmGroup.add(scene);
}

/** Original pasture meshes are retained for fallback and hidden only when replacements succeed. */
export async function addFarmSheep(farmGroup:T.Group,old:T.Group,transform:T.Matrix4,signal:AbortSignal){
 const {scene}=await loadAbortableGLB(sheepUrl,signal);if(signal.aborted)return;
 const matrices:T.Matrix4[]=[];for(let i=0;i<3;i++)matrices.push(transform.clone().multiply(new T.Matrix4().compose(new T.Vector3(-16.7+i*1.1,.08,i%2?.45:-.45),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),i*.8),new T.Vector3(1,1,1))));
 const group=instances(scene,matrices,.92);group.name='custom-farm-sheep';farmGroup.add(group);old.visible=false;
}

export function hideOldFarmCrops(scene:T.Object3D){
 const oldColors=new Set(['SC_plain_82c7ce','SC_leaf_699456','SC_plain_62764a','SC_plain_b6d58c','SC_plain_7b9fb5','SC_plain_e8ad71','SC_plain_b989d1','SC_plain_dfb0cb','SC_plain_b4c8e3','SC_plain_d8d6b1']);
 scene.traverse(n=>{if(n instanceof T.Mesh){const m=Array.isArray(n.material)?n.material:[n.material];if(m.length&&m.every(x=>oldColors.has(x.name)))n.visible=false;}});
 const old=scene.getObjectByName('farm-original-crops');if(old)old.visible=false;
}
