import {makeScenicMesh} from './scenic.ts';
import {makeLayoutBuilding} from './layout-buildings.ts';
import {makeBridge} from './bridge.ts';
import {makeLandmarkMesh} from './landmarks.ts';
import {makeBaseMesh} from './base.ts';
import {makeShrineMesh} from './shrine.ts';
import {makeFeihuaPart} from './feihua-compound.ts';
import * as T from 'three';
import {surfaceMaterial} from '../render/surface-material.ts';
import {crownGeometry,boulderGeometry,leafSprigGeometry} from '../environment/nature-geometry.ts';
import type {IslandObject} from '../data/model.ts';
const geometries=new Map<string,T.BufferGeometry>(),materials=new Map<string,T.MeshStandardMaterial>();
function geo(key:string,fn:()=>T.BufferGeometry){if(!geometries.has(key)){const g=fn();g.userData.sourceKey=key;geometries.set(key,g);}return geometries.get(key)!;}
function mat(color:string,role?:'window'|'lamp'){const key=color+'|'+(role||'surface');if(!materials.has(key)){const m=surfaceMaterial(color);if(role)m.userData.lightRole=role;materials.set(key,m);}return materials.get(key)!;}
export function makeMesh(o:IslandObject){
 const root=o.templateId.startsWith('scenic_')?makeScenicMesh(o,{geo,mat,sign}):o.templateId.startsWith('feihua_')?makeFeihuaPart(o,{geo,mat,sign}):o.templateId==='island_bridge'?makeBridge(o,{geo,mat,sign}):o.templateId.startsWith("layout_")?makeLayoutBuilding(o,{geo,mat,sign}):o.templateId.startsWith("landmark_")?makeLandmarkMesh(o,{geo,mat,sign}):o.templateId.startsWith("base_")?makeBaseMesh(o,{geo,mat,sign}):o.templateId.startsWith("shrine_")?makeShrineMesh(o,{geo,mat,sign}):new T.Group(),p=o.params,w=p.width,d=p.depth,h=p.wallHeight;
 function part(kind:string,color:string,pos:number[],scale:number[],rotation=0){const g=geo(kind,()=>kind==='box'?new T.BoxGeometry(1,1,1):kind==='sphere'?new T.IcosahedronGeometry(1,0):kind==='cone'?new T.ConeGeometry(1,1,7):kind==='gable'?new T.CylinderGeometry(1,1,1,3):new T.ConeGeometry(1,1,4));const m=new T.Mesh(g,mat(color));m.position.fromArray(pos);m.scale.fromArray(scale);m.rotation.y=rotation;root.add(m);return m;}
 if(o.templateId.startsWith('scenic_')||o.templateId==='island_bridge'||o.templateId.startsWith('feihua_')||o.templateId.startsWith('layout_')||o.templateId.startsWith('landmark_')||o.templateId.startsWith('shrine_')||o.templateId.startsWith('base_')){} 
 else if(o.templateId==='tree'){
  const trunk=new T.Mesh(geo('nature:trunk',()=>new T.CylinderGeometry(.66,1,1,12,3)),mat('#776852'));trunk.position.set(0,3.6,0);trunk.scale.set(.65,7.2,.65);trunk.userData.natureKind='bark';root.add(trunk);
  const crown=geo('nature:crown',crownGeometry),sprig=geo('nature:sprig',leafSprigGeometry);
  for(let i=0;i<5;i++){
   const a=i*2.4,rr=i===0?0:2.0,c=new T.Mesh(crown,mat(i%2?'#447d64':'#629273'));c.position.set(Math.cos(a)*rr,8+(i%2)*3,Math.sin(a)*rr);c.scale.set(i===0?4.3:2.7,i===0?4.8:3.7,i===0?4.3:2.7);c.userData.natureKind='leaf';root.add(c);
   if(i===0)continue;
   const from=new T.Vector3(0,4.2,0),to=new T.Vector3(c.position.x,7,c.position.z),branch=new T.Mesh(geo('nature:branch',()=>new T.CylinderGeometry(.55,1,1,8)),mat('#776852'));branch.position.copy(from).add(to).multiplyScalar(.5);branch.scale.set(.22,from.distanceTo(to),.22);branch.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),to.clone().sub(from).normalize());branch.userData.natureKind='bark';root.add(branch);
   const leaf=new T.Mesh(sprig,mat(i%2?'#447d64':'#629273'));leaf.position.set(Math.cos(a)*4.4,9+(i%2)*2,Math.sin(a)*4.4);leaf.scale.setScalar(2);leaf.rotation.y=a;leaf.userData.natureKind='leaf';root.add(leaf);
  }
 }
 else if(o.templateId==='rock'){const rock=new T.Mesh(geo('nature:boulder',()=>boulderGeometry(2)),mat('#82939a'));rock.position.set(0,2,0);rock.scale.set(3,4,2.5);rock.userData.natureKind='rock';root.add(rock);}
 else if(o.templateId==='pier'){part('box','#a28460',[0,2,0],[w,1,d*2]);for(const x of [-w*.4,w*.4])for(const z of [-d*.8,d*.8])part('box','#675f51',[x,.5,z],[1,3,1]);}
 else {part('box',p.wallColor,[0,h/2,0],[w,h,d]);
   if(o.templateId==='house_hip'||o.templateId==='shrine'){part('hip',p.roofColor,[0,h+2,0],[(w+2)/Math.SQRT2,4,(d+2)/Math.SQRT2],Math.PI/4);}
   else {const roof=part('gable',p.roofColor,[0,h+1.2,0],[(w+2)/Math.sqrt(3),d+2,4]);roof.rotation.x=Math.PI/2;roof.rotation.z=Math.PI;}
   part('box','#72624d',[0,1.8,d/2+.05],[1.8,3.6,.2]);for(const x of [-w*.3,w*.3]){part('box','#f8f3db',[x,h*.6,d/2+.12],[2.5,2.5,.18]);part('box','#6b9eab',[x,h*.6,d/2+.23],[1.8,1.8,.12]);}
   if(o.templateId==='shop')part('box','#efbe65',[0,h*.55,d/2+1],[w,0.6,2]);
   if(o.templateId==='academy'){part('box',p.wallColor,[0,h+3,0],[3,6,3]);part('hip',p.roofColor,[0,h+7,0],[3,3,3],Math.PI/4);}
   if(o.templateId==='shrine'){for(const x of [-5,5])part('box','#b95b46',[x,4,d],[.8,8,.8]);part('box','#b95b46',[0,8,d],[13,1,1]);}
 }
 root.userData.objectId=o.id;root.traverse(n=>n.userData.objectId=o.id);root.position.fromArray(o.position);root.rotation.set(...o.rotation);root.scale.fromArray(o.scale);return root;
}
export function disposeObjectCaches(){geometries.forEach(g=>g.dispose());materials.forEach(m=>{m.map?.dispose();m.dispose();});geometries.clear();materials.clear();}
export function pruneMaterials(root:T.Object3D){const used=new Set<T.Material>();root.traverse(n=>{if(n instanceof T.Mesh){if(Array.isArray(n.material))n.material.forEach(m=>used.add(m));else used.add(n.material);}});const usedGeometries=new Set<T.BufferGeometry>();root.traverse(n=>{if(n instanceof T.Mesh)usedGeometries.add(n.geometry);});geometries.forEach((g,k)=>{if(!usedGeometries.has(g)){g.dispose();geometries.delete(k);}});materials.forEach((m,k)=>{if(!used.has(m)){m.map?.dispose();m.dispose();materials.delete(k);}});}
function sign(text:string){
 const key='sign:'+text;
 if(!materials.has(key)){
  const m=new T.MeshStandardMaterial({color:'#f4e8c7',roughness:1});
  if(typeof document!=='undefined'){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=192;const ctx=canvas.getContext('2d')!;ctx.fillStyle='#e9dbb7';ctx.fillRect(0,0,512,192);ctx.fillStyle='#332e24';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 100px "Microsoft YaHei",serif';ctx.fillText(text,256,99,460);m.map=new T.CanvasTexture(canvas);m.map.colorSpace=T.SRGBColorSpace;m.color.set('#ffffff');}
  materials.set(key,m);
 }return materials.get(key)!;
}
export function disposeObjectInstances(root:T.Object3D){root.traverse(n=>{if(n instanceof T.InstancedMesh)n.dispose();});}

