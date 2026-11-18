import {makeTownMesh} from './island-town.ts';
import {makeScenicMesh} from './scenic.ts';
import {makeLayoutBuilding} from './layout-buildings.ts';
import {makeBridge} from './bridge.ts';
import {makeLandmarkMesh} from './landmarks.ts';
import {makeBaseMesh} from './base.ts';
import {Builder,makeShrineMesh} from './shrine.ts';
import {makeFeihuaPart} from './feihua-compound.ts';
import {slateRoof,paneFrame} from './details.ts';
import * as T from 'three';
import {surfaceMaterial,disposeSurfaceStock} from '../render/surface-material.ts';
import {crownGeometry,boulderGeometry,leafSprigGeometry} from '../environment/nature-geometry.ts';
import type {IslandObject} from '../data/model.ts';
const geometries=new Map<string,T.BufferGeometry>(),materials=new Map<string,T.MeshStandardMaterial>();
function geo(key:string,fn:()=>T.BufferGeometry){if(!geometries.has(key)){const g=fn();g.userData.sourceKey=key;geometries.set(key,g);}return geometries.get(key)!;}
function mat(color:string,role?:'window'|'lamp'){const key=color+'|'+(role||'surface');if(!materials.has(key)){const m=surfaceMaterial(color);if(role)m.userData.lightRole=role;materials.set(key,m);}return materials.get(key)!;}
export function makeMesh(o:IslandObject){
 const root=o.templateId.startsWith('layout_island_')?makeTownMesh(o,{geo,mat,sign}):o.templateId.startsWith('scenic_')?makeScenicMesh(o,{geo,mat,sign}):o.templateId.startsWith('feihua_')?makeFeihuaPart(o,{geo,mat,sign}):o.templateId==='island_bridge'?makeBridge(o,{geo,mat,sign}):o.templateId.startsWith("layout_")?makeLayoutBuilding(o,{geo,mat,sign}):o.templateId.startsWith("landmark_")?makeLandmarkMesh(o,{geo,mat,sign}):o.templateId.startsWith("base_")?makeBaseMesh(o,{geo,mat,sign}):o.templateId.startsWith("shrine_")?makeShrineMesh(o,{geo,mat,sign}):new T.Group(),p=o.params,w=p.width,d=p.depth,h=p.wallHeight;
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
 else if(o.templateId==='pier'){
  const deck=new Builder({geo,mat,sign});
  const boards=Math.max(4,Math.ceil(d*2/.42));
  for(let i=0;i<boards;i++){
   const z=-d+(i+.5)*d*2/boards;
   deck.box([0,2.38,z],[w,.24,d*2/boards-.014],['#a28460','#aa8d68','#967b59'][i%3]);
   for(const x of [-w*.39,w*.39])deck.cylinder([x,2.499,z],[x,2.504,z],.026,'#695d4e',8);
  }
  for(const x of [-w*.40,w*.40]){
   deck.box([x,2.04,0],[.32,.48,d*2],'#765d45');
   for(const z of [-d*.8,d*.8]){
    deck.cylinder([x,-1,z],[x,2.25,z],.35,'#675f51',14);
    for(const y of [1.44,1.63])deck.cylinder([x,y,z],[x,y+.06,z],.363,'#535950',14);
   }
  }
  root.add(deck.finish());
 }
 else {part('box',p.wallColor,[0,h/2,0],[w,h,d]);
   if(o.templateId==='house_hip'||o.templateId==='shrine'){part('hip',p.roofColor,[0,h+2,0],[(w+2)/Math.SQRT2,4,(d+2)/Math.SQRT2],Math.PI/4);}
   const facade=new Builder({geo,mat,sign});
   if(o.templateId!=='house_hip'&&o.templateId!=='shrine')slateRoof(facade,[0,h,0],d+1.15,w+1.15,2.4,p.roofColor,Math.PI/2);
   const front=d/2,doorH=Math.min(3.6,h*.84),doorW=Math.min(1.8,w*.24);
   facade.box([0,doorH/2,front+.06],[doorW,doorH,.13],'#77604e');
   for(const sx of [-1,1])facade.box([sx*doorW*.51,doorH*.51,front+.13],[.115,doorH*1.02,.18],'#655348');
   facade.box([0,doorH+.04,front+.13],[doorW+.21,.125,.18],'#796553');
   for(const y of [.24,.71]){
    facade.box([0,y*doorH,front+.14],[doorW*.76,doorH*.39,.022],'#96795b');
    facade.box([0,y*doorH,front+.16],[doorW*.66,doorH*.31,.018],'#80694f');
   }
   facade.box([doorW*.37,doorH*.48,front+.17],[.078,.16,.02],'#a38b68');
   facade.cylinder([doorW*.37,doorH*.49,front+.17],[doorW*.37,doorH*.49,front+.24],.025,'#ba9c72',10);
   facade.cylinder([doorW*.37,doorH*.49,front+.24],[doorW*.27,doorH*.49,front+.24],.024,'#ba9c72',10);
   const winW=Math.min(2.25,w*.20),winH=Math.min(2.2,h*.41);
   for(const x of [-w*.30,w*.30])facade.scoped([x,h*.59,front+.08],0,()=>{
    facade.litBox([0,0,0],[winW,winH,.085],'#89a9ac');paneFrame(facade,winW,winH,.084);
    facade.box([0,0,.089],[.052,winH,.083],'#8c7964');
    facade.box([0,winH*.16,.095],[winW,.050,.071],'#8c7964');
   });
   for(const side of [-1,1])facade.box([side*(w*.5-.036),h*.5,front+.051],[.12,h,.14],'#917e6a');
   root.add(facade.finish());
   if(o.templateId==='shop')part('box','#efbe65',[0,h*.55,d/2+1],[w,0.6,2]);
   if(o.templateId==='academy'){part('box',p.wallColor,[0,h+3,0],[3,6,3]);part('hip',p.roofColor,[0,h+7,0],[3,3,3],Math.PI/4);}
   if(o.templateId==='shrine'){for(const x of [-5,5])part('box','#b95b46',[x,4,d],[.8,8,.8]);part('box','#b95b46',[0,8,d],[13,1,1]);}
 }
 root.userData.objectId=o.id;root.traverse(n=>n.userData.objectId=o.id);root.position.fromArray(o.position);root.rotation.set(...o.rotation);root.scale.fromArray(o.scale);return root;
}
export function disposeObjectCaches(){disposeSurfaceStock();geometries.forEach(g=>g.dispose());materials.forEach(m=>{m.map?.dispose();m.dispose();});geometries.clear();materials.clear();}
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
