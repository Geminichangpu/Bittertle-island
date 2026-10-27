import {TowerInteriorRefinement} from '../models/TowerInteriorRefinement';
import {InteractionManager} from '../interactions/InteractionManager';
import {interiorInteractions} from '../interactions/config';
import {expandRoomSpace} from './room-space';
import {CollisionWorld} from './CollisionWorld';
import {ExplorationController} from './ExplorationController';
import {explorationConfig} from './exploration-config';
import {refineInterior} from './refine';
import {openFeihuaDeskAccess} from './feihua-office-layout';
import {BedroomInteriorRefinement} from '../models/BedroomInteriorRefinement';
import {OfficeInteriorRefinement} from '../models/OfficeInteriorRefinement';
import {FeihuaInteriorRefinement} from '../models/FeihuaInteriorRefinement';
import {ResidenceInteriorRefinement} from '../models/ResidenceInteriorRefinement';
import {makeTowerInterior,type TowerFloor} from './tower';
import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {DemandRenderer} from '../render/DemandRenderer';
import {useEnvironment} from '../environment/time-state';
import {TIME_PRESETS} from '../environment/time-presets';
import type {IslandObject} from '../data/model';
import {makeOffice} from './office';
import {makeBedroom,makeResidence,makeFeihua} from './additional-rooms';
import type {InteriorRoom,RoomView} from './room-kit';

export class InteriorController{
 interactions!:InteractionManager;
 exploration!:ExplorationController;
 private orbitView='reference';
 private bedroom=false;
 bedroomRefinement?:BedroomInteriorRefinement;
 officeRefinement?:OfficeInteriorRefinement;
 feihuaInteriorRefinement?:FeihuaInteriorRefinement;
 residenceRefinement?:ResidenceInteriorRefinement;
 towerRefinement?:TowerInteriorRefinement;
 scene=new T.Scene();camera=new T.PerspectiveCamera(65,1,.05,150);renderer:T.WebGLRenderer;
 scheduler:DemandRenderer;controls:OrbitControls;room:InteriorRoom;views:RoomView[];private extraLights:T.PointLight[]=[];
 private resize:ResizeObserver;private unsubscribe:()=>void;
 private sun=new T.DirectionalLight();private ambient=new T.HemisphereLight();private fill=new T.AmbientLight(0xffffff,.6);private lamp=new T.PointLight('#ffd39a',0,22,2);
 constructor(public host:HTMLElement,office:IslandObject,quality:'low'|'standard',floor:TowerFloor='lobby'){
  this.bedroom=office.id==='base_bedroom';
  this.renderer=new T.WebGLRenderer({antialias:true,powerPreference:quality==='low'?'low-power':'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,quality==='low'?1:1.5));this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;this.renderer.shadowMap.autoUpdate=false;
  this.room=office.templateId==='landmark_liuli'?makeTowerInterior(floor):office.id==='base_bedroom'?makeBedroom(office):office.id==='shrine_residence'?makeResidence(office):office.id==='landmark_feihua'?makeFeihua(office):makeOffice(office);this.views=this.room.views||[{id:'reference',label:'参考视角',position:[3.8,3.25,5.3],target:[-.6,2.15,-2.52]},{id:'desk',label:'桌面近景',position:[2.7,2.8,3.3],target:[-.6,2.15,-2.52]},{id:'overview',label:'剖面总览',position:[11,12,14],target:[-.6,2.15,-2.52],cutaway:true}];if(!this.room.views){const {w,h,d}=this.room.dimensions;this.views=this.views.map(v=>({...v,position:[v.position[0]*w/9,v.position[1]*h/5,v.position[2]*d/12],target:[v.target[0],h*.43,-d*.21]}));}expandRoomSpace(this.room,office.id,floor);refineInterior(this.room);this.room.root.visible=false;this.scene.add(this.room.root,this.sun,this.sun.target,this.ambient,this.fill,this.lamp);host.append(this.renderer.domElement);
  this.sun.position.set(...(office.id==='base_bedroom'?[3,9,-15]:office.id==='shrine_residence'?[-12,9,15]:[-12,9,3]) as [number,number,number]);this.sun.castShadow=true;this.sun.shadow.mapSize.setScalar(quality==='low'?1024:2048);Object.assign(this.sun.shadow.camera,{left:-10,right:10,top:10,bottom:-10,near:.1,far:40});this.sun.shadow.bias=-.0003;this.sun.shadow.normalBias=.025;this.lamp.position.set(0,this.room.dimensions.h-.8,0);if(office.id==='landmark_feihua'){for(const at of [[-1,5.5,1],[-5.5,12,0],[4,12,6.5]]){const light=new T.PointLight('#ffd39a',0,24,2);light.position.fromArray(at).multiply(this.room.root.scale);this.scene.add(light);this.extraLights.push(light);}this.lamp.intensity=0;const radius=Math.max(this.room.dimensions.w,this.room.dimensions.d);Object.assign(this.sun.shadow.camera,{left:-radius,right:radius,top:radius,bottom:-radius,far:80});this.sun.position.set(-25,32,18);}
  if(office.templateId==='landmark_liuli'){
   this.camera.far=300;this.camera.updateProjectionMatrix();this.sun.position.set(-25,30,25);Object.assign(this.sun.shadow.camera,{left:-26,right:26,top:26,bottom:-26,far:100});
   for(const at of [[-5,4,2],[5,4,-3]]){const light=new T.PointLight('#dceaff',0,32,2);light.position.fromArray(at);this.scene.add(light);this.extraLights.push(light);}
  }
  if(this.bedroom){
   // Both sources coincide with visible fixtures. Only the window sun casts a cached shadow.
   this.lamp.position.set(2,4.15,-1).multiply(this.room.root.scale);
   const taskLight=new T.PointLight('#ffe2b4',0,9,2);taskLight.position.set(-5.68,1.92,-1.074).multiply(this.room.root.scale);this.scene.add(taskLight);this.extraLights.push(taskLight);
  }
  this.scheduler=new DemandRenderer(()=>{this.exploration?.update(performance.now());this.interactions?.update(performance.now());this.syncRefinedLighting();this.renderer.render(this.scene,this.camera);host.dataset.frames=String(this.scheduler.frames+1);if(this.exploration?.needsFrame||this.interactions?.animating)this.scheduler.requestRender();});
  this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.enableDamping=false;this.controls.enablePan=false;this.controls.minDistance=.8;this.controls.maxDistance=8;this.controls.addEventListener('change',this.scheduler.requestRender);
  if(office.id==='landmark_feihua')openFeihuaDeskAccess(this.room);
  const world=new CollisionWorld(this.room),config=explorationConfig(office.id,floor,this.room);
  this.exploration=new ExplorationController(this.renderer.domElement,this.camera,world,config,this.scheduler.requestRender,state=>{host.dataset.exploration=state.active?'walking':'orbit';host.dispatchEvent(new CustomEvent('exploration-state',{detail:state}));},point=>host.dispatchEvent(new CustomEvent('exploration-action',{detail:point})),()=>this.stopExploration());
  this.interactions=new InteractionManager(this.renderer.domElement,this.camera,this.scene,host,this.scheduler.requestRender,()=>!!this.exploration?.active,()=>{this.renderer.shadowMap.needsUpdate=true;},[{root:this.room.root,namespace:office.id+':'+floor,specs:interiorInteractions(office.id,floor)}],on=>{this.lamp.intensity=on?(useEnvironment.getState().mode==='day'?18:32):0;this.room.lampMaterial.emissiveIntensity=on?2:0;});
  this.resize=new ResizeObserver(()=>this.resizeViewport());this.resize.observe(host);document.addEventListener('visibilitychange',this.visibility);this.renderer.domElement.addEventListener('webglcontextlost',this.lost);
  this.unsubscribe=useEnvironment.subscribe(()=>this.applyEnvironment());this.applyEnvironment();this.view('reference');this.resizeViewport();
  if(this.bedroom){this.bedroomRefinement=new BedroomInteriorRefinement(this.room,()=>this.rebindRefinedInteractions('base_bedroom'));this.bedroomRefinement.start();}
  if(office.id==='base_office'){this.officeRefinement=new OfficeInteriorRefinement(this.room,()=>this.rebindRefinedInteractions('base_office'));this.officeRefinement.start();}
  if(office.id==='landmark_feihua'){this.feihuaInteriorRefinement=new FeihuaInteriorRefinement(this.room,()=>this.rebindRefinedInteractions('landmark_feihua'));this.feihuaInteriorRefinement.start();}
  if(office.templateId==='landmark_liuli'){this.towerRefinement=new TowerInteriorRefinement(this.room,floor,()=>this.rebindRefinedInteractions(office.id,floor));this.towerRefinement.start();}
  if(office.id==='shrine_residence'){this.residenceRefinement=new ResidenceInteriorRefinement(this.room,()=>this.rebindRefinedInteractions('shrine_residence'));this.residenceRefinement.start();}
 }
 private syncRefinedLighting(){for(const refinement of [this.bedroomRefinement,this.officeRefinement,this.feihuaInteriorRefinement,this.residenceRefinement,this.towerRefinement])refinement?.syncLighting();}
 private rebindRefinedInteractions(id:string,floor:TowerFloor='lobby'){
  const models=[this.bedroomRefinement,this.officeRefinement,this.feihuaInteriorRefinement,this.residenceRefinement,this.towerRefinement].filter(Boolean);
  if(models.some(model=>model?.status==='error')){this.host.dispatchEvent(new CustomEvent('interior-error',{detail:'精修室内加载失败，请返回并重试。'}));return;}
  this.room.root.visible=true;this.host.dispatchEvent(new Event('interior-model-ready'));
  const muted=this.interactions.audio.muted;this.interactions.dispose();
  this.interactions=new InteractionManager(this.renderer.domElement,this.camera,this.scene,this.host,this.scheduler.requestRender,()=>!!this.exploration?.active,()=>{this.renderer.shadowMap.needsUpdate=true;},[{root:this.room.root,namespace:id+':'+floor,specs:interiorInteractions(id,floor)}],on=>{this.lamp.intensity=on?(useEnvironment.getState().mode==='day'?18:32):0;this.room.lampMaterial.emissiveIntensity=on?2:0;});
  this.interactions.setMuted(muted);this.applyEnvironment();
 }
 lost=(e:Event)=>{e.preventDefault();this.interactions?.setActive(false);this.scheduler.setVisible(false);this.host.dispatchEvent(new CustomEvent('interior-error',{detail:'室内 WebGL 上下文丢失，请返回岛屿后重新进入。'}));};
 visibility=()=>{if(document.hidden)this.exploration?.pause();this.scheduler.setVisible(!document.hidden);};
 applyEnvironment(){const {mode,fps}=useEnvironment.getState(),p=TIME_PRESETS[mode];this.host.dataset.timeMode=mode;this.scene.background=new T.Color(p.sky);this.sun.color.set(p.sun);this.sun.intensity=mode==='day'?3.2:mode==='dusk'?2.3:.4;this.ambient.color.set(p.ambient);this.ambient.groundColor.set('#9a7c51');this.ambient.intensity=mode==='day'?1.3:mode==='dusk'?.9:.45;this.lamp.intensity=mode==='day'?0:mode==='dusk'?24:42;for(const light of this.extraLights)light.intensity=mode==='day'?8:mode==='dusk'?30:55;this.fill.intensity=mode==='day'?.5:.4;this.room.lampMaterial.emissiveIntensity=mode==='day'?0:2;this.room.glass.color.set(this.room.paperScreens?(mode==='night'?'#b9af94':'#eee4ce'):(mode==='night'?'#34496a':p.sky));this.room.glass.emissive.set(this.room.paperScreens?'#eee4ce':p.sky);this.room.glass.emissiveIntensity=this.room.paperScreens?(mode==='day'?.18:.04):(mode==='day'?.65:.22);if(this.bedroom){
   this.sun.position.set(...(mode==='dusk'?[8,7,-14]:[3,9,-15]) as [number,number,number]);this.sun.target.position.set(1,0,0);
   this.sun.color.set(mode==='day'?'#fff5e5':mode==='dusk'?'#ffbc7d':'#9ebde8');this.sun.intensity=mode==='day'?3.1:mode==='dusk'?2.15:.06;
   this.ambient.groundColor.set('#726b59');this.ambient.intensity=mode==='day'?1.25:mode==='dusk'?.75:.38;this.fill.intensity=mode==='day'?.45:mode==='dusk'?.25:.22;
   this.lamp.intensity=mode==='day'?0:mode==='dusk'?8:32;for(const light of this.extraLights)light.intensity=mode==='day'?0:mode==='dusk'?3:5;
   this.room.glass.emissiveIntensity=mode==='day'?.12:mode==='dusk'?.08:.015;
  }
  this.interactions?.environment();this.syncRefinedLighting();this.renderer.toneMappingExposure=p.exposure;this.renderer.shadowMap.needsUpdate=true;this.scheduler.setFrameLimit(fps);this.scheduler.requestRender();}
 startExploration(){
  this.orbitView=this.host.dataset.view||'reference';this.room.walls.visible=true;this.room.lid.visible=true;if(this.room.scenery)this.room.scenery.visible=true;this.renderer.clippingPlanes=[];
  this.controls.enabled=false;const ok=this.exploration.start();if(ok)void this.exploration.capturePointer();else this.controls.enabled=true;this.renderer.shadowMap.needsUpdate=true;
 }
 stopExploration(){this.exploration.stop();this.controls.enabled=true;this.view(this.orbitView);}
 view(name:string){
  if(this.exploration?.active){this.exploration.stop();this.controls.enabled=true;}

  const view=this.views.find(v=>v.id===name)||this.views[0],cutaway=!!view.cutaway;this.room.walls.visible=!cutaway;this.room.lid.visible=!cutaway;if(this.room.scenery)this.room.scenery.visible=!cutaway;
  this.renderer.clippingPlanes=view.clipHeight===undefined?[]:[new T.Plane(new T.Vector3(0,-1,0),view.clipHeight)];this.controls.maxDistance=Math.max(this.room.dimensions.w,this.room.dimensions.d)*4;this.camera.position.fromArray(view.position);this.controls.target.fromArray(view.target);this.controls.update();this.host.dataset.view=view.id;this.renderer.shadowMap.needsUpdate=true;this.scheduler.requestRender();
 }
 resizeViewport(){const w=this.host.clientWidth,h=this.host.clientHeight;if(!w||!h)return;this.renderer.setSize(w,h);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.scheduler.requestRender();}
 capture(){this.scheduler.renderNow();return this.renderer.domElement.toDataURL('image/png');}
 dispose(){this.interactions.dispose();this.bedroomRefinement?.dispose();this.officeRefinement?.dispose();this.feihuaInteriorRefinement?.dispose();this.residenceRefinement?.dispose();this.towerRefinement?.dispose();this.exploration.dispose();this.unsubscribe();this.resize.disconnect();document.removeEventListener('visibilitychange',this.visibility);this.renderer.domElement.removeEventListener('webglcontextlost',this.lost);this.controls.dispose();this.scheduler.dispose();this.room.dispose();this.sun.shadow.map?.dispose();this.renderer.dispose();this.renderer.forceContextLoss();this.renderer.domElement.remove();}
}



