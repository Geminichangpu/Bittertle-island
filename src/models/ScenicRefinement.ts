import * as T from 'three';
import sakura from '../assets/models/scenic_sakura-refined-v3.glb?url';
import cliff from '../assets/models/scenic_cliff-refined-v5.glb?url';
import academy from '../assets/models/scenic_academy-refined-v5.glb?url';
import farm from '../assets/models/scenic_farm-refined-v5.glb?url';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import type {IslandObject} from '../data/model';
import type {SceneController} from '../scene/SceneController';
import {shadowSurfaces} from '../render/lighting';

const assets:Record<string,string>={scenic_sakura:sakura,scenic_cliff:cliff,scenic_academy:academy,scenic_farm:farm};
function supports(o:IslandObject){return Object.hasOwn(assets,o.id)&&o.templateId===o.id;}
function release(root:T.Object3D){
 const geometry=new Set<T.BufferGeometry>(),materials=new Set<T.Material>(),textures=new Set<T.Texture>();
 root.traverse(n=>{if(n instanceof T.InstancedMesh)n.dispose();if(n instanceof T.Mesh){geometry.add(n.geometry);for(const m of Array.isArray(n.material)?n.material:[n.material])materials.add(m);}});
 materials.forEach(m=>{for(const v of Object.values(m))if(v instanceof T.Texture)textures.add(v);m.dispose();});
 geometry.forEach(g=>g.dispose());textures.forEach(t=>t.dispose());
}

/** Local-space Blender exteriors retain the existing editable object roots. */
export class ScenicRefinement extends EventTarget {
 enabled=true;
 status:'idle'|'loading'|'ready'|'error'='idle';
 private templates=new Map<string,T.Group>();private disposed=false;
 private mounted:{root:T.Object3D;original:T.Object3D[];refined:T.Group}[]=[];
 constructor(private owner:SceneController){super();}
 get compatible(){return this.owner.project.objects.some(supports);}
 get active(){return this.mounted.length>0;}
 private changed(){this.dispatchEvent(new Event('change'));}
 restore(){
  for(const {root,original,refined} of this.mounted){refined.traverse(n=>{if(n instanceof T.InstancedMesh)n.dispose();});refined.removeFromParent();root.add(...original);root.userData.modelVariant='original';}
  this.mounted=[];
 }
 sync(){
  if(this.disposed)return;
  this.restore();
  if(this.enabled&&this.compatible){
   if(this.status==='ready')for(const o of this.owner.project.objects){
    if(!supports(o))continue;
    const root=this.owner.node(o.id),template=this.templates.get(o.id);if(!root||!template)continue;
    const refined=template.clone(true),original=root.children.filter(n=>!(n instanceof T.Mesh&&n.geometry.userData.sourceKey==='shrine:signplane'));refined.name=o.id+'-blender-v1';
    refined.traverse(n=>n.userData.objectId=o.id);
    root.remove(...original);root.add(refined);root.userData.modelVariant='refined';this.mounted.push({root,original,refined});
   }
   else if(this.status==='idle')void this.load();
  }
  this.owner.updateLabelPositions();this.owner.atmosphere?.refresh();this.owner.invalidateShadows();this.owner.requestRender();this.changed();
 }
 private async load(){
  this.status='loading';this.changed();const loader=new GLTFLoader(),ids=Object.keys(assets);
  const results:PromiseSettledResult<Awaited<ReturnType<GLTFLoader['loadAsync']>>>[]=[];
  for(let i=0;i<ids.length;i+=2){results.push(...await Promise.allSettled(ids.slice(i,i+2).map(id=>loader.loadAsync(assets[id]))));if(this.disposed)break;}
  if(this.disposed||results.some(r=>r.status==='rejected')){
   for(const result of results)if(result.status==='fulfilled')release(result.value.scene);
   if(!this.disposed){this.status='error';this.changed();console.warn('樱花海崖精修模型未完整载入。');this.owner.host.dispatchEvent(new CustomEvent('scene-error',{detail:'樱花海崖精修模型未完整载入，请刷新重试。'}));}
   return;
  }
  results.forEach((result,i)=>{
   if(result.status!=='fulfilled')return;
   const scene=result.value.scene;
   scene.traverse(n=>{if(n instanceof T.Mesh)for(const m of Array.isArray(n.material)?n.material:[n.material]){
    if(m.name.endsWith('_lamp')){m.userData.lightRole='lamp';if(m instanceof T.MeshStandardMaterial)m.emissiveMap=m.map;}
    if(m.name.endsWith('_window'))m.userData.lightRole='window';
    if(m instanceof T.MeshStandardMaterial){for(const t of [m.map,m.normalMap,m.roughnessMap])if(t)t.anisotropy=4;m.side=T.DoubleSide;}
    if(m.transparent){m.depthWrite=false;m.side=T.DoubleSide;m.forceSinglePass=true;}
   }});
   const meshes:T.Mesh[]=[];scene.traverse(n=>{if(n instanceof T.Mesh)meshes.push(n);});
   for(const source of meshes){
    const mesh=new T.InstancedMesh(source.geometry,source.material,1);mesh.name=source.name;mesh.userData={...source.userData};mesh.position.copy(source.position);mesh.quaternion.copy(source.quaternion);mesh.scale.copy(source.scale);mesh.setMatrixAt(0,new T.Matrix4());mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingBox();mesh.computeBoundingSphere();source.parent?.add(mesh);source.removeFromParent();
   }
   shadowSurfaces(scene);this.templates.set(ids[i],scene);
  });
  this.status='ready';this.sync();
 }
 retry(){if(this.status!=='error')return;this.status='idle';this.sync();}
 dispose(){this.disposed=true;this.restore();this.templates.forEach(release);this.templates.clear();}
}
