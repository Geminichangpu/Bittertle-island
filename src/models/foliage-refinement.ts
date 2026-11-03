import * as T from 'three';

/** Reuse the authored instance transforms when a baked scenic GLB has old solid crowns.
 * Owned geometry/material copies allow the refinement cache to dispose independently. */
export function replaceBakedLeafCrowns(refined:T.Group,authored:T.Object3D|undefined){
 if(!authored)return;
 const keys=new Set(['scenic:green-crown','settlement:leaf','treehouse:leaf']);
 const treehouseLeaves=new Set(['6c9647','6d934a','8e9f54','86a653','91ab53','94ad59','98aa5a','728a4d','789b4c','a6b764','a6b960','b1bd71']);
 const baked:T.Object3D[]=[];refined.traverse(n=>{if(n instanceof T.Mesh&&(keys.has(n.userData.component)||(Array.isArray(n.material)?n.material:[n.material]).some(m=>m.name.startsWith('TH_')&&treehouseLeaves.has(m.name.slice(3,9)))))baked.push(n);});if(!baked.length)return;
 authored.updateWorldMatrix(true,true);const inverse=authored.matrixWorld.clone().invert(),leaves=new T.Group();leaves.name='共享叶簇实例';
 authored.traverse(n=>{
  if(!(n instanceof T.Mesh)||!keys.has(n.geometry.userData.sourceKey))return;
  const materials=(Array.isArray(n.material)?n.material:[n.material]).map(m=>new T.MeshStandardMaterial({color:(m as T.MeshStandardMaterial).color,roughness:1,vertexColors:true,side:T.DoubleSide})),material=Array.isArray(n.material)?materials:materials[0];
  const geometry=n.geometry.clone(),copy=n instanceof T.InstancedMesh?new T.InstancedMesh(geometry,material,n.count):new T.Mesh(geometry,material);
  if(copy instanceof T.InstancedMesh&&n instanceof T.InstancedMesh){copy.instanceMatrix.copy(n.instanceMatrix);copy.computeBoundingBox();copy.computeBoundingSphere();}
  copy.matrix.multiplyMatrices(inverse,n.matrixWorld);copy.matrixAutoUpdate=false;copy.matrixWorldNeedsUpdate=true;copy.userData.noCollision=true;leaves.add(copy);
 });
 if(!leaves.children.length)return;
 // Keep the hidden source allocations in this asset's lifetime/disposal traversal.
 baked.forEach(n=>{n.visible=false;});refined.add(leaves);
}
