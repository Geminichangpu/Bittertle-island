import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import bedroomUrl from '../assets/models/bedroom-interior-refined-v1.glb?url';
import type {InteriorRoom} from '../interiors/room-kit';

function releaseAsset(root:T.Object3D){
 const gs=new Set<T.BufferGeometry>(),ms=new Set<T.Material>(),ts=new Set<T.Texture>();
 root.traverse(n=>{if(n instanceof T.Mesh){gs.add(n.geometry);for(const m of Array.isArray(n.material)?n.material:[n.material])ms.add(m);}});
 for(const m of ms){for(const t of Object.values(m))if(t instanceof T.Texture)ts.add(t);m.dispose();}gs.forEach(g=>g.dispose());ts.forEach(t=>t.dispose());
}

/** Replace visible room surfaces only; retain room transforms, cutaway containers,
 * scenery, the original collision world and native interactive instance support. */
export class BedroomInteriorRefinement extends EventTarget {
 enabled=true;
 status:'idle'|'loading'|'ready'|'error'='idle';
 private disposed=false;private asset?:T.Group;private mounted=false;
 private replacements:{target:T.Group;original:T.Object3D[];group:T.Group}[]=[];
 private instances:T.InstancedMesh[]=[];
 private lampMaterials=new Set<T.MeshStandardMaterial>();
 constructor(private room:InteriorRoom,private onChange:()=>void){super();}
 get active(){return this.mounted;}
 syncLighting(){for(const material of this.lampMaterials){material.emissive.copy(this.room.lampMaterial.emissive);material.emissiveIntensity=this.room.lampMaterial.emissiveIntensity;}}
 start(){if(this.enabled&&this.status==='idle')void this.load();}
 setEnabled(enabled:boolean){
  if(this.disposed||!enabled)return;this.enabled=true;
  if(this.status==='ready'){this.swap(enabled);this.onChange();}
  else this.start();
  this.dispatchEvent(new Event('change'));
 }
 retry(){if(this.status==='error'){this.status='idle';this.start();}}
 private swap(refined:boolean){
  for(const {target,original,group} of this.replacements){
   if(refined){target.remove(...original);target.add(group);}else{group.removeFromParent();target.add(...original);}
  }
  this.mounted=refined;this.room.root.userData.bedroomModelVariant=refined?'blender-v1':'original';this.room.root.updateMatrixWorld(true);
 }
 private async load(){
  this.status='loading';this.dispatchEvent(new Event('change'));
  try{
   const {scene}=await new GLTFLoader().loadAsync(bedroomUrl);
   if(this.disposed){releaseAsset(scene);return;}this.asset=scene;scene.updateMatrixWorld(true);
   const furniture=this.room.root.children.find(n=>n instanceof T.Group&&n!==this.room.walls&&n!==this.room.lid&&n!==this.room.scenery) as T.Group;
   const targets:Record<string,T.Group>={furniture,walls:this.room.walls,ceiling:this.room.lid};
   const groups:Record<string,T.Group>={furniture:new T.Group(),walls:new T.Group(),ceiling:new T.Group()};
   scene.traverse(node=>{
    if(!(node instanceof T.Mesh))return;
    const category=String(node.userData.roomCategory||'furniture');if(!groups[category])return;
    // One instance per exported component/material keeps the existing interaction
    // selection and animation code operating on the refined books/leaves/lamps.
    const geometry=node.geometry.clone().applyMatrix4(node.matrixWorld);
    const mapMaterial=(m:T.Material)=>{
     if(m.name.endsWith('_lamp')&&m instanceof T.MeshStandardMaterial){this.lampMaterials.add(m);m.emissiveMap=m.map;}
     if(m.name.endsWith('_window'))return this.room.glass;
     if(m instanceof T.MeshStandardMaterial){for(const texture of [m.map,m.normalMap,m.roughnessMap])if(texture)texture.anisotropy=4;m.side=T.DoubleSide;}
     return m;
    };
    const material=Array.isArray(node.material)?node.material.map(mapMaterial):mapMaterial(node.material);
    const mesh=new T.InstancedMesh(geometry,material,1);mesh.name=node.name;mesh.userData={...node.userData};mesh.setMatrixAt(0,new T.Matrix4());mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingBox();mesh.computeBoundingSphere();mesh.castShadow=material!==this.room.glass;mesh.receiveShadow=true;groups[category].add(mesh);this.instances.push(mesh);
   });
   this.replacements=Object.entries(targets).map(([category,target])=>({target,original:[...target.children],group:groups[category]}));
   this.status='ready';this.swap(this.enabled);this.onChange();this.syncLighting();this.dispatchEvent(new Event('change'));
  }catch(error){
   if(!this.disposed){this.status='error';this.onChange();console.warn('卧室精修模型加载失败。',error);this.dispatchEvent(new Event('change'));}
  }
 }
 dispose(){
  this.disposed=true;this.swap(false);
  for(const mesh of this.instances){mesh.dispose();mesh.geometry.dispose();}this.instances=[];
  if(this.asset)releaseAsset(this.asset);this.asset=undefined;this.replacements=[];this.lampMaterials.clear();
 }
}
