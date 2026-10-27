import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import treehouseUrl from '../assets/models/treehouse-refined-v1.glb?url';
import type {IslandObject} from '../data/model';
import type {SceneController} from '../scene/SceneController';
import {shadowSurfaces} from '../render/lighting';

export function supportsRefinement(o:IslandObject){
 return o.id==='layout_treehouse'&&o.templateId==='layout_treehouse';
}
function release(root:T.Object3D){
 const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>(),textures=new Set<T.Texture>();
 root.traverse(n=>{if(n instanceof T.Mesh){geometries.add(n.geometry);for(const m of Array.isArray(n.material)?n.material:[n.material])materials.add(m);}});
 for(const m of materials){for(const value of Object.values(m))if(value instanceof T.Texture)textures.add(value);m.dispose();}
 textures.forEach(t=>t.dispose());geometries.forEach(g=>g.dispose());
}

/** Replace only a root's visible children. The original root, IDs and authored transforms survive. */
export class TreehouseRefinement extends EventTarget {
 enabled=true;
 status:'idle'|'loading'|'ready'|'error'='idle';
 private template?:T.Group;private disposed=false;
 private mounted?:{root:T.Object3D;original:T.Object3D[];refined:T.Object3D};
 constructor(private owner:SceneController){super();}
 get compatible(){return this.owner.project.objects.some(supportsRefinement);}
 get active(){return !!this.mounted;}
 private changed(){this.dispatchEvent(new Event('change'));}
 restore(){
  if(!this.mounted)return;
  const {root,original,refined}=this.mounted;refined.removeFromParent();root.add(...original);root.userData.modelVariant='original';this.mounted=undefined;
 }
 sync(){
  if(this.disposed)return;
  this.restore();
  const object=this.owner.project.objects.find(supportsRefinement),root=object&&this.owner.node(object.id);
  if(this.enabled&&root){
   if(this.template){
    const refined=this.template.clone(true),original=[...root.children];
    refined.name='treehouse-refined-v1';refined.traverse(n=>n.userData.objectId=object!.id);
    root.remove(...original);root.add(refined);root.userData.modelVariant='refined';
    this.mounted={root,original,refined};
   }else if(this.status==='idle')void this.load();
  }
  this.owner.updateLabelPositions();this.owner.atmosphere?.refresh();this.owner.invalidateShadows();this.owner.requestRender();this.changed();
 }
 private async load(){
  this.status='loading';this.changed();
  try{
   const {scene}=await new GLTFLoader().loadAsync(treehouseUrl);
   if(this.disposed){release(scene);return;}
   scene.traverse(n=>{if(n instanceof T.Mesh)for(const m of Array.isArray(n.material)?n.material:[n.material]){
    if(m.name.endsWith('_lamp'))m.userData.lightRole='lamp';
    if(m.name.endsWith('_window'))m.userData.lightRole='window';
    if(m.transparent){m.depthWrite=false;m.side=T.DoubleSide;m.forceSinglePass=true;}
   }});
   shadowSurfaces(scene);this.template=scene;this.status='ready';this.sync();
  }catch(error){if(!this.disposed){this.status='error';this.changed();console.warn('树屋精修模型加载失败。');this.owner.host.dispatchEvent(new CustomEvent('scene-error',{detail:'树屋精修模型加载失败，请刷新重试。'}));}}
 }
 retry(){if(this.status!=='error')return;this.status='idle';this.sync();}
 dispose(){this.disposed=true;this.restore();if(this.template)release(this.template);this.template=undefined;}
}

