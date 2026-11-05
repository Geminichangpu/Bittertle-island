import {addAboCollisions,removeReplacedNativeProps} from '../models/abo-collision';
import * as T from 'three';
import {maskTrialTrees} from '../environment/vegetation-trial';
import {clearTreesNear} from '../scene/sakura';
import {CompoundWorld} from './CompoundWorld';
import {entrance} from '../environment/paths';
import {ExplorationController,type ExplorationState} from '../interiors/ExplorationController';
import {DemandRenderer} from '../render/DemandRenderer';
import {IslandLighting} from '../render/lighting';
import {TIME_PRESETS} from '../environment/time-presets';
import {useEnvironment} from '../environment/time-state';
import {makeMesh,disposeObjectInstances} from '../generators/objects';
import type {SceneController} from '../scene/SceneController';

/** A separate camera and renderer keep the editor's view and controls untouched. */
export class IslandWalkController {
 readonly scene=new T.Scene();readonly camera=new T.PerspectiveCamera(70,1,.05,1800);
 readonly renderer:T.WebGLRenderer;readonly scheduler:DemandRenderer;readonly exploration:ExplorationController;readonly world:CompoundWorld;
 private walkDetails:{node:T.Object3D;center:T.Vector3;range:number}[]=[];private walkGrass?:T.Object3D;private grassUpdateX=Infinity;private grassUpdateZ=Infinity;private lighting:IslandLighting;private resize:ResizeObserver;private unsubscribe:()=>void;private active=true;private waterMaterial?:T.ShaderMaterial;private feihuaInverse?:T.Matrix4;private feihuaUnit=1;
 constructor(readonly host:HTMLElement,readonly island:SceneController,onState:(state:ExplorationState)=>void,onExit:()=>void){
  const group=island.node('feihua_group');if(group){group.updateWorldMatrix(true,false);this.feihuaInverse=group.matrixWorld.clone().invert();const scale=group.getWorldScale(new T.Vector3());this.feihuaUnit=Math.min(Math.abs(scale.x),Math.abs(scale.y),Math.abs(scale.z));}
  const size=island.project.terrain.size,bounds=new T.Box3(new T.Vector3(-size,-1000,-size),new T.Vector3(size,1000,size));
  this.world=new CompoundWorld(island.terrain,bounds,false,true);
  // Authored low-cost proxies preserve doors, posts, walkable bridges and existing building locations.
  for(const object of island.project.objects){const node=island.node(object.id);if(!node)continue;node.updateWorldMatrix(true,true);const proxy=makeMesh(object);removeReplacedNativeProps(proxy,node);proxy.matrixAutoUpdate=false;proxy.matrix.copy(node.matrixWorld);proxy.matrixWorldNeedsUpdate=true;this.world.addObject(proxy,new Set(),bounds);disposeObjectInstances(proxy);}
  addAboCollisions(this.world,island.objects);addAboCollisions(this.world,island.environment);
  const focus=island.controls.target.clone(),base=island.node('base_office'),entry=entrance(island.project,'base_office'),fallback=entry?new T.Vector3(entry[0],0,entry[1]):base?.getWorldPosition(new T.Vector3())||new T.Vector3(116,0,100);
  const overview=island.camera instanceof T.OrthographicCamera&&island.camera.zoom<1.3;
  const spawn=this.world.spawn(overview?fallback:focus,.36,2.1)||this.world.spawn(fallback,.36,2.1);if(!spawn)throw new Error('附近没有找到可站立的位置，请先将沙盘视角移到陆地后重试。');
  this.renderer=new T.WebGLRenderer({antialias:true,powerPreference:island.project.settings.quality==='low'?'low-power':'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,island.project.settings.quality==='low'?1:1.5));this.renderer.outputColorSpace=T.SRGBColorSpace;host.append(this.renderer.domElement);
  const walkEnvironment=island.environment.clone(true),walkObjects=island.objects.clone(true);this.scene.add(island.terrain.clone(),walkObjects,walkEnvironment);const boats=island.scene.getObjectByName('kenney-dock-boats');if(boats)this.scene.add(boats.clone(true));this.walkGrass=walkEnvironment.getObjectByName('island-fine-grass');if(this.walkGrass)this.walkGrass.visible=!this.walkGrass.userData.vegetationReplacement;
  // The FFT render targets belong to the editor renderer's WebGL context. Use an
  // independent static fallback in this renderer, even when the editor uses Ultra-Water.
  const water=island.water.mesh.clone();this.waterMaterial=island.water.material.clone();this.waterMaterial.uniforms.depthMap.value=island.water.material.uniforms.depthMap.value;this.waterMaterial.uniforms.ultraEnabled.value=0;this.waterMaterial.uniforms.waveTime.value=0;water.material=this.waterMaterial;water.visible=true;this.scene.add(water);
  this.lighting=new IslandLighting(this.renderer,this.scene);this.lighting.setQuality(island.project.settings.quality);
  const pending=island.environment.userData.vegetationTrialPromise as Promise<void>|undefined;
  void pending?.then(()=>{if(!this.active||walkEnvironment.getObjectByName('vegetation-pilot'))return;const trial=island.environment.getObjectByName('vegetation-pilot');const roots=island.environment.userData.vegetationTrialRoots as [number,number,number][]|undefined;if(trial&&roots){maskTrialTrees(walkEnvironment,roots);walkEnvironment.add(trial.clone(true));this.collectWalkDetails();this.lighting.invalidate();this.scheduler.requestRender();}});
  void island.sakuraReady?.then(()=>{if(!this.active)return;const mature=island.node('scenic_sakura')?.getObjectByName('sakura-mature-new'),young=island.objects.getObjectByName('sakura-young-new');if(!mature||!young)return;const vegetation=walkEnvironment.getObjectByName('vegetation-pilot'),gate=island.node('shrine_torii');if(vegetation){young.updateWorldMatrix(true,false);gate?.updateWorldMatrix(true,false);clearTreesNear(vegetation,young.getWorldPosition(new T.Vector3()),7.5,gate?.getWorldPosition(new T.Vector3()));}if(walkObjects.getObjectByName('sakura-mature-new')){this.lighting.invalidate();this.scheduler.requestRender();return;}walkObjects.traverse(n=>{if(n instanceof T.Mesh&&n.userData.objectId==='scenic_sakura'){const key=String(n.geometry.userData.sourceKey||n.userData.feature||'');if(key==='scenic:blossom'||key==='scenic:continuous-branch:scenic_sakura')n.visible=false;}});for(const source of [mature,young]){source.updateWorldMatrix(true,false);const clone=source.clone(true);clone.matrixAutoUpdate=false;clone.matrix.copy(source.matrixWorld);walkObjects.add(clone);}this.lighting.invalidate();this.scheduler.requestRender();});
  this.scheduler=new DemandRenderer(()=>{this.updateAvatar();this.exploration?.update(performance.now());this.updateWalkGrass();this.lighting.beforeDraw();this.renderer.render(this.scene,this.camera);if(this.exploration?.needsFrame)this.scheduler.requestRender();});
  const look=island.camera.getWorldDirection(new T.Vector3());look.y=0;if(look.lengthSq()<.001)look.set(0,0,-1);look.normalize();
  this.exploration=new ExplorationController(this.renderer.domElement,this.camera,this.world,{spawn,target:spawn.clone().add(look).add(new T.Vector3(0,1.8,0)),radius:.36,height:2.1,eye:1.8,step:.55,speed:7,points:[]},this.scheduler.requestRender,onState,()=>{},onExit);
  this.collectWalkDetails();
  this.resize=new ResizeObserver(()=>this.resizeViewport());this.resize.observe(host);document.addEventListener('visibilitychange',this.visibility);this.renderer.domElement.addEventListener('webglcontextlost',this.lost);
  this.unsubscribe=useEnvironment.subscribe(()=>this.environment());this.environment();this.resizeViewport();this.exploration.start();
 }
 private collectWalkDetails(){
  for(const detail of this.walkDetails)detail.node.visible=true;
  this.walkDetails=[];this.scene.updateMatrixWorld(true);
  this.scene.traverse(n=>{
   if(!n.visible)return;
   if(n.userData.aboAsset){this.walkDetails.push({node:n,center:n.getWorldPosition(new T.Vector3()),range:115});return;}
   const range=n.userData.walkDetailRange;
   if(typeof range==='number'&&n instanceof T.InstancedMesh){if(!n.boundingSphere)n.computeBoundingSphere();const sphere=n.boundingSphere?.clone().applyMatrix4(n.matrixWorld);if(sphere)this.walkDetails.push({node:n,center:sphere.center,range:range+sphere.radius});}
  });
  this.grassUpdateX=Infinity;this.grassUpdateZ=Infinity;
 }
 private updateWalkGrass(){if(!this.exploration)return;const p=this.exploration.feet;if(Math.hypot(p.x-this.grassUpdateX,p.z-this.grassUpdateZ)<8)return;this.grassUpdateX=p.x;this.grassUpdateZ=p.z;for(const chunk of this.walkGrass?.children||[]){const center=chunk.userData.grassCenter as number[]|undefined;if(center)chunk.visible=Math.hypot(center[0]-p.x,center[1]-p.z)<64;}for(const detail of this.walkDetails)detail.node.visible=Math.hypot(detail.center.x-p.x,detail.center.z-p.z)<detail.range;}
 private updateAvatar(){if(!this.exploration||!this.feihuaInverse)return;const p=this.exploration.feet.clone().applyMatrix4(this.feihuaInverse),inside=p.x>-38&&p.x<24&&p.z>-42&&p.z<45,person=this.feihuaUnit*.76,c=this.exploration.config;
  c.radius=inside?.36*person:.36;c.height=inside?3.1*person:2.1;c.step=inside?.55*this.feihuaUnit:.55;c.eye=T.MathUtils.lerp(c.eye,inside?2.9*person:1.8,.18);
 }
 environment(){const {mode,fps}=useEnvironment.getState(),p=TIME_PRESETS[mode];this.scene.background=new T.Color(p.sky);this.scene.fog=new T.Fog(p.fog,p.fogNear,p.fogFar);this.lighting.sun.color.set(p.sun);this.lighting.sun.intensity=p.sunIntensity;this.lighting.sun.position.fromArray(p.sunPosition);this.lighting.sky.color.set(p.ambient);this.lighting.sky.groundColor.set(p.ground);this.lighting.sky.intensity=p.ambientIntensity;this.renderer.toneMappingExposure=p.exposure;this.lighting.invalidate();this.scheduler.setFrameLimit(fps);this.scheduler.requestRender();}
 resizeViewport(){const w=this.host.clientWidth,h=this.host.clientHeight;if(!w||!h)return;this.renderer.setSize(w,h);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.scheduler.requestRender();}
 visibility=()=>{if(document.hidden)this.exploration.pause();this.scheduler.setVisible(this.active&&!document.hidden);};
 lost=(e:Event)=>{e.preventDefault();this.active=false;this.exploration.stop();this.scheduler.setVisible(false);this.host.dispatchEvent(new CustomEvent('island-walk-error',{detail:'漫游画面中断，请返回沙盘后重试。'}));};
 dispose(){this.active=false;this.exploration.dispose();this.scheduler.dispose();this.unsubscribe();this.resize.disconnect();document.removeEventListener('visibilitychange',this.visibility);this.renderer.domElement.removeEventListener('webglcontextlost',this.lost);this.lighting.dispose();this.waterMaterial?.dispose();this.scene.traverse(n=>{if(n instanceof T.InstancedMesh)n.dispose();});this.renderer.dispose();this.renderer.domElement.remove();}
}
