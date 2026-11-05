import * as T from 'three';
import {loadAbortableGLB} from './loadAbortableGLB';
import c0 from '../assets/cc0-test/farm-crop-0.glb?url';
import c1 from '../assets/cc0-test/farm-crop-1.glb?url';
import c2 from '../assets/cc0-test/farm-crop-2.glb?url';
import c3 from '../assets/cc0-test/farm-crop-3.glb?url';
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
  for(let row=0;row<5;row++)for(let j=0;j<8;j++){
   const a=(row*8+j)*2.39996,scale=.86+(j%4)*.06;
   matrices.push(new T.Matrix4().compose(new T.Vector3(x-4+j*1.12,.48,z-3+row*1.4),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),a),new T.Vector3(scale,scale,scale)));
  }
  const g=instances(sources[[0,2,1,3][kind]],matrices,.9);g.name='custom-farm-crops-'+kind;scene.add(g);kind++;
 }
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
