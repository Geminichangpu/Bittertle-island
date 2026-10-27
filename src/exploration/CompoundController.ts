import {InteractionManager} from '../interactions/InteractionManager';
import {outdoorInteractions} from '../interactions/config';
import * as T from 'three';
import type {SceneController} from '../scene/SceneController';
import {DemandRenderer} from '../render/DemandRenderer';
import {IslandLighting} from '../render/lighting';
import {ExplorationController,type ExplorationState} from '../interiors/ExplorationController';
import {INTERIORS,interiorEntrance,type InteriorId} from '../interiors/registry';
import type {Hotspot} from '../interiors/exploration-config';
import {useEnvironment} from '../environment/time-state';
import {TIME_PRESETS} from '../environment/time-presets';
import {CompoundWorld} from './CompoundWorld';
import {compoundMembers,type CompoundId} from './registry';
import {makeMesh,disposeObjectInstances} from '../generators/objects';

function feihuaVisitPoint(id:string,w:number,d:number):[number,number,number]|undefined{
 if(id==='feihua_bridge')return [0,2.45,d*1.35-1.4];
 if(id==='landmark_feihua')return [0,2.48,d*.82];
 if(id==='feihua_annex')return [0,2.48,d*.36+3.4];
 if(id==='feihua_onsen')return [0,2.48,d*.49+1.2];
 return undefined;
}

export class CompoundController{
 interactions!:InteractionManager;
 readonly scene=new T.Scene();readonly camera=new T.PerspectiveCamera(70,1,.05,1800);
 readonly renderer:T.WebGLRenderer;readonly scheduler:DemandRenderer;readonly exploration:ExplorationController;readonly world:CompoundWorld;
 readonly bounds=new T.Box3();readonly locations:{id:string;name:string;at:T.Vector3;target:T.Vector3}[]=[];
 private lighting:IslandLighting;private resize:ResizeObserver;private unsubscribe:()=>void;private active=true;private stopRefinementVisit?:()=>void;private startRefinementVisit?:()=>void;
 constructor(readonly host:HTMLElement,readonly island:SceneController,readonly id:CompoundId,onState:(s:ExplorationState)=>void,onAction:(h:Hotspot)=>void,onExit:()=>void){
  const members=compoundMembers(island.project,id);if(!members.length)throw new Error('当前布局没有这个建筑群');
  for(const o of members){const node=island.node(o.id);if(node){node.updateWorldMatrix(true,true);this.bounds.union(new T.Box3().setFromObject(node));}}
  if(this.bounds.isEmpty())throw new Error('建筑群模型尚未加载');
  this.bounds.expandByVector(new T.Vector3(12,0,12));this.bounds.min.y=-1000;this.bounds.max.y=1000;
  this.renderer=new T.WebGLRenderer({antialias:true,powerPreference:island.project.settings.quality==='low'?'low-power':'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,island.project.settings.quality==='low'?1:1.5));this.renderer.outputColorSpace=T.SRGBColorSpace;host.append(this.renderer.domElement);
  // Clone object transforms/instances only. Shared source geometry and materials stay owned by the island.
  this.scene.add(island.terrain.clone(),island.objects.clone(true),island.environment.clone(true));
  for(const node of island.scene.children)if(node instanceof T.Mesh&&node!==island.terrain&&((node.material as T.Material).userData?.sea))this.scene.add(node.clone());
  this.lighting=new IslandLighting(this.renderer,this.scene);this.lighting.setQuality(island.project.settings.quality);
  this.world=new CompoundWorld(island.terrain,this.bounds,id==='feihua_group');
  // Collision uses the authored individual planks, walls and rail posts. The
  // refined GLB merges materials, whose bounding boxes would close open paths.
  for(const object of island.project.objects){
   const node=island.node(object.id);if(!node||!this.bounds.intersectsBox(new T.Box3().setFromObject(node)))continue;
   const proxy=makeMesh(object);proxy.matrixAutoUpdate=false;proxy.matrix.copy(node.matrixWorld);
   this.world.addObject(proxy,new Set(),this.bounds);disposeObjectInstances(proxy);
  }
  // The water in the decorative pond is not a walkable floor.
  for(const o of members.filter(o=>o.templateId==='base_pond')){const node=island.node(o.id)!;const box=new T.Box3().setFromObject(node);box.max.y+=6;this.world.add(box);}
  const anchorId=id==='shrine_group'?'shrine_torii':id==='feihua_group'?'feihua_bridge':id==='coast_group'?'scenic_cliff':'base_office';
  const anchor=island.node(anchorId)||island.node(members[0].id)!;
  const scale=anchor.getWorldScale(new T.Vector3()),unit=Math.max(.25,Math.min(Math.abs(scale.x),Math.abs(scale.y),Math.abs(scale.z)));
  // Human-sized viewpoint: the same authored compound feels about 30% larger.
  const person=unit*.76;
  const points:Hotspot[]=[];
  for(const o of members){const node=island.node(o.id);if(!node||['shrine_court','shrine_path','shrine_garden','feihua_terrace','scenic_north_rock'].includes(o.templateId))continue;
   const definition=INTERIORS.find(i=>i.id===o.id),local=new T.Vector3(0,0,o.params.depth/2+2.8);
   const authored=o.id==='scenic_cliff'?[-12,0,13] as [number,number,number]:o.id==='scenic_sakura'?[0,0,10] as [number,number,number]:o.id==='scenic_north_rock'?[0,0,6] as [number,number,number]:id==='feihua_group'?feihuaVisitPoint(o.id,o.params.width,o.params.depth):undefined;
   const at=authored?node.localToWorld(new T.Vector3(...authored)):definition?interiorEntrance(node,o):node.localToWorld(local),target=node.getWorldPosition(new T.Vector3());
   if(id==='feihua_group'){
    const focus=o.id==='feihua_annex'||o.id==='feihua_onsen'?[0,4,0]:[0,5,0];target.copy(node.localToWorld(new T.Vector3(...focus as [number,number,number])));
   }else if(o.id==='scenic_cliff'){target.copy(node.localToWorld(new T.Vector3(0,2,-8)));}else target.y+=2.8*unit;
   const safe=this.world.spawn(at,.36*person,3.1*person);if(!safe)continue;
   this.locations.push({id:o.id,name:o.name,at:safe,target});
   const point=at.clone();point.y=(id==='feihua_group'?safe.y:(this.world.ground(point.x,point.z)??target.y-2.8*unit))+2.1*unit;
   points.push({id:o.id,label:definition?definition.entry:o.name,description:definition?'进入室内，返回后继续建筑群漫游。':o.templateId==='base_pond'?'基地鱼塘，可沿塘边观赏。':'沿现有建筑群布局自由观察。',position:point,action:'inspect',radius:4.5*unit});
  }
  const first=this.locations.find(l=>l.id===anchorId)||this.locations[0];
  if(!first)throw new Error('建筑群周围没有可站立的陆地');
  // Start the base visit in the yard, with room to see the whole facade.
  const start=first.at.clone();if(id==='base_group'){const outward=start.clone().sub(first.target);outward.y=0;outward.normalize().multiplyScalar(5*unit);const yard=this.world.spawn(start.clone().add(outward),.36*person,3.1*person);if(yard)start.copy(yard);}
  this.scheduler=new DemandRenderer(()=>{this.exploration?.update(performance.now());this.interactions?.update(performance.now());this.lighting.beforeDraw();this.renderer.render(this.scene,this.camera);host.dataset.frames=String(this.scheduler.frames+1);if(this.exploration?.needsFrame||this.interactions?.animating)this.scheduler.requestRender();});
  this.exploration=new ExplorationController(this.renderer.domElement,this.camera,this.world,{spawn:start,target:first.target.clone(),radius:.36*person,height:3.1*person,eye:2.9*person,step:.55*unit,speed:4.2*person,points},this.scheduler.requestRender,onState,onAction,onExit);
  const findClone=(objectId:string)=>{let root:T.Object3D|undefined;this.scene.traverse(n=>{if(n.userData.objectId===objectId&&n.parent?.userData.objectId!==objectId)root=n;});return root;};
  const bindInteractions=(muted?:boolean)=>{const sources=members.flatMap(o=>{const root=findClone(o.id);return root?[{root,namespace:'outside:'+o.id,specs:outdoorInteractions(o.templateId,o.params.width,o.params.depth,o.params.wallHeight)}]:[];});this.interactions=new InteractionManager(this.renderer.domElement,this.camera,this.scene,host,this.scheduler.requestRender,()=>this.exploration.active,()=>this.lighting.invalidate(),sources);if(muted!==undefined)this.interactions.setMuted(muted);};
  bindInteractions();
  const onRefined=(objectId:string)=>{if(!this.active)return;const root=findClone(objectId),source=island.node(objectId),object=members.find(o=>o.id===objectId);if(!root||!source||!object)return;const rebind=outdoorInteractions(object.templateId,object.params.width,object.params.depth,object.params.wallHeight).length>0,muted=this.interactions.audio.muted;if(rebind)this.interactions.dispose();for(const child of [...root.children]){child.traverse(n=>{if(n instanceof T.InstancedMesh)n.dispose();});child.removeFromParent();}for(const child of source.children)root.add(child.clone(true));if(rebind)bindInteractions(muted);this.lighting.invalidate();this.scheduler.requestRender();};
  this.startRefinementVisit=()=>{this.stopRefinementVisit=island.refinement.startVisit(members.map(o=>o.id),onRefined);};this.startRefinementVisit();
  this.resize=new ResizeObserver(()=>this.resizeViewport());this.resize.observe(host);document.addEventListener('visibilitychange',this.visibility);this.renderer.domElement.addEventListener('webglcontextlost',this.lost);
  this.unsubscribe=useEnvironment.subscribe(()=>this.environment());this.environment();this.resizeViewport();this.exploration.start();
 }
 environment(){const {mode,fps}=useEnvironment.getState(),p=TIME_PRESETS[mode];this.scene.background=new T.Color(p.sky);this.scene.fog=new T.Fog(p.fog,p.fogNear,p.fogFar);this.lighting.sun.color.set(p.sun);this.lighting.sun.intensity=p.sunIntensity;this.lighting.sun.position.fromArray(p.sunPosition);this.lighting.sky.color.set(p.ambient);this.lighting.sky.groundColor.set(p.ground);this.lighting.sky.intensity=p.ambientIntensity;this.renderer.toneMappingExposure=p.exposure;this.interactions?.environment();this.lighting.invalidate();this.scheduler.setFrameLimit(fps);this.scheduler.requestRender();}
 resizeViewport(){const w=this.host.clientWidth,h=this.host.clientHeight;if(!w||!h)return;this.renderer.setSize(w,h);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.scheduler.requestRender();}
 visibility=()=>{if(document.hidden)this.exploration.pause();this.scheduler.setVisible(this.active&&!document.hidden);};
 lost=(e:Event)=>{e.preventDefault();this.setActive(false);this.host.dispatchEvent(new CustomEvent('compound-error',{detail:'漫游画面已中断，请返回沙盘后重新进入。'}));};
 setActive(value:boolean){this.active=value;this.interactions?.setActive(value);this.exploration.pause();if(!value&&this.exploration.locked)document.exitPointerLock();this.exploration.active=value;if(value){this.startRefinementVisit?.();this.scheduler.requestRender();}else{this.stopRefinementVisit?.();this.stopRefinementVisit=undefined;}this.visibility();}
 moveTo(id:string){const place=this.locations.find(l=>l.id===id);if(!place)return;this.exploration.stop();this.exploration.config.spawn.copy(place.at);this.exploration.config.target.copy(place.target);this.exploration.start();void this.exploration.capturePointer();}
 interiorFor(id:string){return INTERIORS.find(i=>i.id===id)?.id as InteriorId|undefined;}
 dispose(){this.active=false;this.stopRefinementVisit?.();this.interactions.dispose();this.exploration.dispose();this.scheduler.dispose();this.unsubscribe();this.resize.disconnect();document.removeEventListener('visibilitychange',this.visibility);this.renderer.domElement.removeEventListener('webglcontextlost',this.lost);this.lighting.dispose();this.scene.traverse(n=>{if(n instanceof T.InstancedMesh)n.dispose();});this.renderer.dispose();this.renderer.forceContextLoss();this.renderer.domElement.remove();}
}


