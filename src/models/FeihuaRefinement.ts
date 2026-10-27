import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import mainUrl from '../assets/models/landmark_feihua-refined-v1.glb?url';
import annexUrl from '../assets/models/feihua_annex-refined-v1.glb?url';
import onsenUrl from '../assets/models/feihua_onsen-refined-v1.glb?url';
import terraceUrl from '../assets/models/feihua_terrace-refined-v1.glb?url';
import bridgeUrl from '../assets/models/feihua_bridge-refined-v1.glb?url';
import type {IslandObject} from '../data/model';
import type {SceneController} from '../scene/SceneController';
import {shadowSurfaces} from '../render/lighting';
import {finishFeihuaMaterial,makeFeihuaJoinery} from './feihua-art';

const assets:Record<string,string>={landmark_feihua:mainUrl,feihua_annex:annexUrl,feihua_onsen:onsenUrl,feihua_terrace:terraceUrl,feihua_bridge:bridgeUrl};
function supports(o:IslandObject){
 const p=o.params;
 return Object.hasOwn(assets,o.id)&&o.templateId===o.id&&p.width===26&&p.depth===16&&p.wallHeight===21&&p.wallColor.toLowerCase()==='#e5d4b5'&&p.roofColor.toLowerCase()==='#525d77';
}
function release(root:T.Object3D){
 const geometry=new Set<T.BufferGeometry>(),materials=new Set<T.Material>(),textures=new Set<T.Texture>();
 root.traverse(n=>{if(n instanceof T.Mesh){geometry.add(n.geometry);for(const m of Array.isArray(n.material)?n.material:[n.material])materials.add(m);}});
 materials.forEach(m=>{for(const v of Object.values(m))if(v instanceof T.Texture)textures.add(v);m.dispose();});
 geometry.forEach(g=>g.dispose());textures.forEach(t=>t.dispose());
}

/** Local-space Blender exteriors retain the five existing editable object roots. */
export class FeihuaRefinement extends EventTarget {
 enabled=new URLSearchParams(location.search).get('models')!=='original';
 status:'idle'|'loading'|'ready'|'error'='idle';
 private templates=new Map<string,T.Group>();private disposed=false;
 private mounted:{root:T.Object3D;original:T.Object3D[];refined:T.Group}[]=[];
 constructor(private owner:SceneController){super();}
 get compatible(){return this.owner.project.objects.some(supports);}
 get active(){return this.mounted.length>0;}
 private changed(){this.dispatchEvent(new Event('change'));}
 restore(){
  for(const {root,original,refined} of this.mounted){refined.removeFromParent();root.add(...original);root.userData.modelVariant='original';}
  this.mounted=[];
 }
 sync(){
  if(this.disposed)return;
  this.restore();
  if(this.enabled&&this.compatible){
   if(this.status==='ready')for(const o of this.owner.project.objects){
    if(!supports(o))continue;
    const root=this.owner.node(o.id),template=this.templates.get(o.id);if(!root||!template)continue;
    const refined=template.clone(true),original=[...root.children];refined.name=o.id+'-blender-v1';
    refined.traverse(n=>n.userData.objectId=o.id);
    root.remove(...original);root.add(refined);root.userData.modelVariant='refined';this.mounted.push({root,original,refined});
   }
   else if(this.status==='idle')void this.load();
  }
  this.owner.updateLabelPositions();this.owner.atmosphere?.refresh();this.owner.invalidateShadows();this.owner.requestRender();this.changed();
 }
 private async load(){
  this.status='loading';this.changed();const loader=new GLTFLoader(),ids=Object.keys(assets);
  const results=await Promise.allSettled(ids.map(id=>loader.loadAsync(assets[id])));
  if(this.disposed||results.some(r=>r.status==='rejected')){
   for(const result of results)if(result.status==='fulfilled')release(result.value.scene);
   if(!this.disposed){this.status='error';this.changed();console.warn('绯华楼精修模型未完整载入，继续显示原版。');}
   return;
  }
  results.forEach((result,i)=>{
   if(result.status!=='fulfilled')return;
   const scene=result.value.scene;
   scene.traverse(n=>{if(n instanceof T.Mesh)for(const m of Array.isArray(n.material)?n.material:[n.material]){
    finishFeihuaMaterial(m);
    if(m.name.endsWith('_lamp'))m.userData.lightRole='lamp';
    if(m.name.endsWith('_window'))m.userData.lightRole='window';
    if(m.transparent){m.depthWrite=false;m.side=T.DoubleSide;m.forceSinglePass=true;}
   }});
   if(ids[i]==='landmark_feihua')scene.add(makeFeihuaJoinery());
   shadowSurfaces(scene);this.templates.set(ids[i],scene);
  });
  this.status='ready';this.sync();
 }
 setEnabled(enabled:boolean){if(this.disposed)return;this.enabled=enabled;this.sync();}
 retry(){if(this.status!=='error')return;this.status='idle';this.sync();}
 dispose(){this.disposed=true;this.restore();this.templates.forEach(release);this.templates.clear();}
}
