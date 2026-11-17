import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import type {InteriorRoom} from './room-kit';

/** Refines existing furniture in place: no rearrangement and no per-frame effects. */
export function refineInterior(room:InteriorRoom){
 const rounded=new RoundedBoxGeometry(1,1,1,1,.045),soft=new T.SphereGeometry(1,16,10);
 const maps:T.Texture[]=[],owned:T.Material[]=[],fabricMaterials=new Map<T.Material,T.Material>();
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d')!;
 ctx.fillStyle='#ededed';ctx.fillRect(0,0,128,128);
 for(let i=0;i<128;i+=3){ctx.strokeStyle=i%2?'#c5c5c5':'#dedede';ctx.lineWidth=.65;ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,128);ctx.moveTo(0,i);ctx.lineTo(128,i);ctx.stroke();}
 const weave=new T.CanvasTexture(canvas);weave.wrapS=weave.wrapT=T.RepeatWrapping;weave.repeat.set(8,8);maps.push(weave);
 const fabric=(source:T.Material)=>{let mat=fabricMaterials.get(source);if(!mat){const m=(source as T.MeshStandardMaterial).clone();m.roughness=.94;m.metalness=0;m.bumpMap=weave;m.bumpScale=.012;mat=m;fabricMaterials.set(source,mat);owned.push(mat);}return mat;};
 const matrix=new T.Matrix4(),pos=new T.Vector3(),scale=new T.Vector3(),q=new T.Quaternion();let bevels=0,pillows=0;
 const nodes:T.InstancedMesh[]=[];room.root.traverse(n=>{if(n instanceof T.InstancedMesh)nodes.push(n);});
 for(const mesh of nodes){
  if(mesh.parent===room.walls||mesh.parent===room.lid||mesh.parent===room.scenery)continue;
  const material=mesh.material as T.MeshStandardMaterial;if(!material?.color||material.transparent||material.emissiveIntensity>0)continue;
  const color='#'+material.color.getHexString(),clothColors=new Set(['#873b51','#a6544a','#84acd9','#729dcc','#604575','#e7dfce','#f0e9db','#f5eee0','#d5ceb4','#e7dec7','#eef0f2','#e7e9ee','#f3f2ee','#f7f4ef']);
  const groups=new Map<string,T.Matrix4[]>();
  for(let i=0;i<mesh.count;i++){
   mesh.getMatrixAt(i,matrix);matrix.decompose(pos,q,scale);const sx=Math.abs(scale.x),sy=Math.abs(scale.y),sz=Math.abs(scale.z);
   let type='original';
   if(mesh.geometry.type==='BoxGeometry'&&Math.min(sx,sy,sz)>=.075&&Math.max(sx,sy,sz)<6&&Math.min(sx,sy,sz)/Math.max(sx,sy,sz)>.024&&pos.y>.18){type='bevel';bevels++;}
   if(type==='bevel'&&clothColors.has(color)&&sy<.8&&sx>1&&sz>.65&&pos.y>.2)type='cloth';
   if(mesh.geometry.type==='IcosahedronGeometry'&&clothColors.has(color)&&sx>.2&&sz>.12&&sy<.7){type='soft';pillows++;}
   const list=groups.get(type)||[];list.push(matrix.clone());groups.set(type,list);
  }
  if(groups.size===1&&groups.has('original'))continue;
  const parent=mesh.parent!;
  for(const [type,matrices] of groups){const next=new T.InstancedMesh(type==='original'?mesh.geometry:type==='soft'?soft:rounded,type==='cloth'||type==='soft'?fabric(material):material,matrices.length);next.name=mesh.name;next.userData={...mesh.userData};next.position.copy(mesh.position);next.quaternion.copy(mesh.quaternion);next.scale.copy(mesh.scale);next.castShadow=mesh.castShadow;next.receiveShadow=mesh.receiveShadow;matrices.forEach((m,i)=>next.setMatrixAt(i,m));next.instanceMatrix.needsUpdate=true;next.computeBoundingBox();next.computeBoundingSphere();parent.add(next);}
  parent.remove(mesh);mesh.dispose();
 }
 room.root.userData.refinement={bevels,pillows,sharedFabricTextures:1};
 const dispose=room.dispose;room.dispose=()=>{dispose();rounded.dispose();soft.dispose();maps.forEach(t=>t.dispose());owned.forEach(m=>m.dispose());};
}
