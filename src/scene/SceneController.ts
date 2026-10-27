import {RefinementManager} from '../models/RefinementManager';
import {EnvironmentManager} from '../environment/EnvironmentManager';
import {makeEnvironment,disposeEnvironment,seaMaterial,finishAuthoredNature} from '../environment/environment';
import {markerTargetId} from '../data/marker-target';
import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {DemandRenderer} from '../render/DemandRenderer';
import {IslandLighting,shadowSurfaces} from '../render/lighting';
import type {Project,CameraPreset,Marker} from '../data/model';
import {terrainGeometry,sampleHeight,updateTerrainHeights} from '../terrain/terrain';
import type {Terrain} from '../data/model';
import {makeMesh,disposeObjectCaches,pruneMaterials,disposeObjectInstances} from '../generators/objects';
export class SceneController {
 refinement!:RefinementManager;
 private overview=false;
 private removeDiagnostics?:()=>void;private disposed=false;
 scene=new T.Scene(); renderer:T.WebGLRenderer; camera:T.OrthographicCamera|T.PerspectiveCamera; controls:OrbitControls; scheduler:DemandRenderer;
 atmosphere:EnvironmentManager;lighting:IslandLighting;private quality?:'low'|'standard';private objectSignature='';
 environment=new T.Group();private environmentSignature='';
 terrain:T.Mesh; objectNodes=new Map<string,T.Object3D>(); groupNodes=new Map<string,T.Group>(); objects=new T.Group(); labels=new T.Group(); regions=new T.Group(); project:Project; private resize:ResizeObserver; private intersection:IntersectionObserver; private inViewport=true; private active=true; private lastFrame=0; stats={frames:0,calls:0,triangles:0,geometries:0,textures:0,fps:0,pending:false};
 onStats:(s:SceneController['stats'])=>void=()=>{};
 constructor(public host:HTMLElement,project:Project){
  this.project=project;this.scene.background=new T.Color('#b8d9df');this.camera=new T.OrthographicCamera(-200,200,150,-150,.1,2000);
  this.renderer=new T.WebGLRenderer({antialias:true,powerPreference:project.settings.quality==='low'?'low-power':'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));this.renderer.outputColorSpace=T.SRGBColorSpace;host.append(this.renderer.domElement);
  this.lighting=new IslandLighting(this.renderer,this.scene);this.lighting.setQuality(project.settings.quality);
  const water=new T.Mesh(new T.PlaneGeometry(2400,2400),seaMaterial());water.rotation.x=-Math.PI/2;water.position.y=-.12;this.scene.add(water);
  this.terrain=new T.Mesh(terrainGeometry(project.terrain,!!project.environment),new T.MeshStandardMaterial({vertexColors:true,flatShading:false,side:T.DoubleSide}));this.terrain.castShadow=true;this.terrain.receiveShadow=true;this.scene.add(this.terrain,this.objects,this.labels);
  this.scene.add(this.regions);this.scheduler=new DemandRenderer(()=>this.draw());this.controls=this.newControls();this.syncObjects();this.syncEnvironment();this.syncLabels();this.syncRegions();this.preset('all');
  this.resize=new ResizeObserver(()=>this.resizeViewport());this.resize.observe(host);this.intersection=new IntersectionObserver(entries=>{this.inViewport=entries[0].isIntersecting;this.updateVisibility();});this.intersection.observe(host);document.addEventListener('visibilitychange',this.updateVisibility);this.setQuality(project.settings.quality);
  this.renderer.domElement.addEventListener('webglcontextlost',this.contextLost);this.atmosphere=new EnvironmentManager(this);this.updateMeteorView();this.refinement=new RefinementManager(this);this.refinement.refresh();
  if(import.meta.env.DEV&&new URLSearchParams(location.search).has('diagnostics'))void import('../dev/diagnostics').then(({installDiagnostics})=>{if(!this.disposed)this.removeDiagnostics=installDiagnostics(this);});
 }
 contextLost=(e:Event)=>{e.preventDefault();this.scheduler.setVisible(false);this.atmosphere.meteors.setVisible(false);this.host.dispatchEvent(new CustomEvent('scene-error',{detail:'WebGL 上下文已丢失。请刷新页面重试；本地存档仍保留。'}));};
 newControls(){const c=new OrbitControls(this.camera,this.renderer.domElement);c.enableDamping=false;c.minDistance=30;c.maxDistance=650;c.minZoom=.45;c.maxZoom=8;c.maxTargetRadius=this.project.terrain.size*.6;c.maxPolarAngle=Math.PI/2-.06;c.addEventListener('change',()=>{this.updateMeteorView();this.refinement?.refresh();this.requestRender();});return c;}
 private updateMeteorView(){
  if(!this.controls)return;
  const size=this.project.terrain.size,target=this.controls.target,offset=this.camera.position.clone().sub(target);
  const wide=this.camera instanceof T.OrthographicCamera?this.camera.zoom<=320/size*1.15:offset.length()/this.camera.zoom>=size*.9;
  const centered=Math.hypot(target.x,target.z)<=size*.15;
  const angled=Math.hypot(offset.x,offset.z)>Math.abs(offset.y)*.25;
  this.atmosphere?.meteors.setOverview(this.overview&&wide&&centered&&angled);
 }
 requestRender=()=>this.scheduler.requestRender();
 invalidateShadows(){this.lighting.invalidate();this.atmosphere?.updateLights();}
 setActive(active:boolean){this.active=active;this.controls.enabled=active;this.refinement?.setSuspended(!active);this.updateVisibility();}
 updateVisibility=()=>{const visible=this.active&&!document.hidden&&this.inViewport;this.scheduler.setVisible(visible);this.atmosphere?.meteors.setVisible(visible);};
 resizeViewport(){const w=this.host.clientWidth,h=this.host.clientHeight;if(!w||!h)return;this.renderer.setSize(w,h);if(this.camera instanceof T.OrthographicCamera){const extent=Math.max(180,170*h/w);this.camera.left=-extent*w/h;this.camera.right=extent*w/h;this.camera.top=extent;this.camera.bottom=-extent;}else this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.requestRender();}
 draw(){this.lighting.beforeDraw();this.renderer.render(this.scene,this.camera);const now=performance.now(),delta=now-this.lastFrame;this.lastFrame=now;this.stats={frames:this.scheduler.frames+1,calls:this.renderer.info.render.calls,triangles:this.renderer.info.render.triangles,geometries:this.renderer.info.memory.geometries,textures:this.renderer.info.memory.textures,fps:delta<250?Math.round(1000/delta):0,pending:false};this.onStats({...this.stats});}
 node(id:string|null){return id?(this.objectNodes.get(id)||this.groupNodes.get(id)):undefined;}
 markerBounds(m:Marker){const id=markerTargetId(this.project,m),node=this.node(id||null);if(!node)return null;node.updateWorldMatrix(true,true);const bounds=new T.Box3().setFromObject(node);return bounds.isEmpty()?null:bounds;}
 markerPosition(m:Marker){const bounds=this.markerBounds(m);if(bounds)return bounds.getCenter(new T.Vector3()).toArray();const p=new T.Vector3(...m.position);if(m.parentId){const group=this.groupNodes.get(m.parentId);group?.updateWorldMatrix(true,false);group?.localToWorld(p);}return p.toArray();}
 updateLabelPositions(){for(const sprite of this.labels.children){const marker=this.project.markers.find(m=>m.id===sprite.userData.markerId);if(!marker)continue;const bounds=this.markerBounds(marker);if(bounds){const center=bounds.getCenter(new T.Vector3());sprite.position.set(center.x,bounds.max.y+5,center.z);}else{const at=this.markerPosition(marker);sprite.position.set(at[0],Math.max(at[1],sampleHeight(this.project.terrain,at[0],at[2]))+14,at[2]);}}}
 syncObjects(){
  this.refinement?.restore();
  const signature=JSON.stringify([this.project.objects,this.project.groups]);if(signature!==this.objectSignature){this.objectSignature=signature;this.invalidateShadows();}
  const removed=new Map(this.objectNodes),oldGroups=this.groupNodes;this.groupNodes=new Map();
  for(const g of this.project.groups||[]){const root=oldGroups.get(g.id)||new T.Group();root.userData.groupId=g.id;root.position.fromArray(g.position);root.rotation.set(...g.rotation);root.scale.fromArray(g.scale);this.groupNodes.set(g.id,root);this.objects.add(root);}
  for(const o of this.project.objects){let mesh=this.objectNodes.get(o.id);const signature=JSON.stringify([o.templateId,o.params]);
   if(!mesh||mesh.userData.signature!==signature){if(mesh){mesh.removeFromParent();disposeObjectInstances(mesh);}mesh=makeMesh(o);mesh.userData.objectId=o.id;shadowSurfaces(mesh);mesh.userData.signature=signature;this.objectNodes.set(o.id,mesh);}
   (o.parentId?this.groupNodes.get(o.parentId)!:this.objects).add(mesh);mesh.position.fromArray(o.position);mesh.rotation.set(...o.rotation);mesh.scale.fromArray(o.scale);
   removed.delete(o.id);
  }
  removed.forEach((mesh,id)=>{mesh.removeFromParent();disposeObjectInstances(mesh);this.objectNodes.delete(id);});oldGroups.forEach((g,id)=>{if(!this.groupNodes.has(id))g.removeFromParent();});this.objects.updateMatrixWorld(true);pruneMaterials(this.objects);this.atmosphere?.refresh();this.refinement?.refresh();this.requestRender();
 }
 syncEnvironment(){const signature=JSON.stringify([this.project.environment,this.project.terrain,this.project.objects,this.project.groups]);if(signature===this.environmentSignature)return;this.environmentSignature=signature;disposeEnvironment(this.environment);this.environment=makeEnvironment(this.project,this.terrain.geometry,()=>{this.invalidateShadows();this.requestRender();});finishAuthoredNature(this.objects,this.environment);shadowSurfaces(this.environment);this.scene.add(this.environment);this.atmosphere?.refresh();this.invalidateShadows();}
 clearLabels(){this.labels.traverse(n=>{if(n instanceof T.Sprite){n.material.map?.dispose();n.material.dispose();}});this.labels.clear();}
 syncLabels(){this.clearLabels();if(!this.project.settings.labels)return;for(const m of this.project.markers){if(!m.visible)continue;const canvas=document.createElement('canvas');canvas.width=384;canvas.height=96;const ctx=canvas.getContext('2d')!;ctx.fillStyle='#397da2';ctx.beginPath();ctx.roundRect(2,2,380,80,18);ctx.fill();ctx.fillStyle='#f5fbff';ctx.font='38px Microsoft YaHei, sans-serif';ctx.textAlign='center';ctx.fillText('⌖ '+m.name,192,55,350);const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;const sprite=new T.Sprite(new T.SpriteMaterial({map:texture,depthTest:false,toneMapped:false}));const at=this.markerPosition(m);sprite.position.set(at[0],Math.max(at[1],sampleHeight(this.project.terrain,at[0],at[2]))+14,at[2]);sprite.scale.set(48,12,1);sprite.userData.markerId=m.id;this.labels.add(sprite);}this.updateLabelPositions();this.requestRender();}
 clearRegions(){this.regions.traverse(n=>{if(n instanceof T.Line){n.geometry.dispose();(n.material as T.Material).dispose();}});this.regions.clear();}
 syncRegions(){this.clearRegions();for(const r of this.project.regions){if(!r.visible)continue;const points:T.Vector3[]=[];r.points.forEach((a,i)=>{const b=r.points[(i+1)%r.points.length],steps=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/3);for(let j=0;j<steps;j++){const x=a[0]+(b[0]-a[0])*j/steps,z=a[1]+(b[1]-a[1])*j/steps;points.push(new T.Vector3(x,sampleHeight(this.project.terrain,x,z)+.6,z));}});const line=new T.LineLoop(new T.BufferGeometry().setFromPoints(points),new T.LineBasicMaterial({color:r.color,depthTest:false}));line.renderOrder=5;this.regions.add(line);}this.requestRender();}
 previewTerrain(t:Terrain){this.invalidateShadows();updateTerrainHeights(this.terrain.geometry,t);for(const mesh of this.objects.children){const o=this.project.objects.find(o=>o.id===mesh.userData.objectId);if(o?.snapToGround)mesh.position.y=sampleHeight(t,mesh.position.x,mesh.position.z);}this.requestRender();}
 setProject(p:Project){const terrainChanged=JSON.stringify([p.terrain,p.environment])!==JSON.stringify([this.project.terrain,this.project.environment]),labelsChanged=terrainChanged||JSON.stringify(p.markers)!==JSON.stringify(this.project.markers)||p.settings.labels!==this.project.settings.labels,regionsChanged=terrainChanged||JSON.stringify(p.regions)!==JSON.stringify(this.project.regions);this.project=p;if(terrainChanged){this.terrain.geometry.dispose();this.terrain.geometry=terrainGeometry(p.terrain,!!p.environment);}this.syncObjects();this.syncEnvironment();if(labelsChanged)this.syncLabels();this.updateLabelPositions();if(regionsChanged)this.syncRegions();this.setQuality(p.settings.quality);this.requestRender();}
 preset(name:'all'|'top'){this.overview=name==='all';this.controls.target.set(0,0,0);this.camera.position.set(...(name==='top'?[0,350,.01]:[0,265,340]) as [number,number,number]);this.camera.zoom=320/this.project.terrain.size;this.camera.updateProjectionMatrix();this.controls.update();this.updateMeteorView();this.requestRender();}
 toggleProjection(){const pos=this.camera.position.clone(),target=this.controls.target.clone();this.controls.dispose();this.camera=this.camera instanceof T.OrthographicCamera?new T.PerspectiveCamera(45,1,.1,2000):new T.OrthographicCamera(-180,180,180,-180,.1,2000);this.camera.position.copy(pos);this.controls=this.newControls();this.controls.target.copy(target);this.controls.update();this.resizeViewport();}
 focusObject(id:string){const node=this.node(id);if(!node)return;node.updateWorldMatrix(true,true);const bounds=new T.Box3().setFromObject(node);this.focus((bounds.isEmpty()?node.getWorldPosition(new T.Vector3()):bounds.getCenter(new T.Vector3())).toArray());}
 /** Frame the compound from its authored front, with room for roof and surroundings. */
 showFeihua(){const node=this.node('feihua_group');if(!node)return;node.updateWorldMatrix(true,true);const box=new T.Box3().setFromObject(node);if(box.isEmpty())return;
  const center=box.getCenter(new T.Vector3()),size=box.getSize(new T.Vector3());this.overview=false;this.atmosphere?.meteors.setOverview(false);
  const direction=new T.Vector3(.48,0,1).transformDirection(node.matrixWorld);direction.y=Math.hypot(direction.x,direction.z);direction.normalize();
  this.controls.target.copy(center);this.camera.position.copy(center).addScaledVector(direction,Math.max(size.length()*2,80));
  const aspect=Math.max(.2,this.host.clientWidth/Math.max(1,this.host.clientHeight)),span=Math.max(size.x*1.35/aspect,(size.y+Math.hypot(size.x,size.z)*.7)*1.3,50);
  if(this.camera instanceof T.OrthographicCamera)this.camera.zoom=Math.min(8,(this.camera.top-this.camera.bottom)/span);else {this.camera.zoom=1;this.camera.position.copy(center).addScaledVector(direction,span/(2*Math.tan(T.MathUtils.degToRad(this.camera.fov/2)))*1.25);}
  this.camera.updateProjectionMatrix();this.controls.update();this.requestRender();}
 focus(position:number[]){this.overview=false;this.atmosphere?.meteors.setOverview(false);this.controls.target.fromArray(position);this.camera.position.copy(this.controls.target).add(new T.Vector3(65,80,90));this.camera.zoom=this.camera instanceof T.OrthographicCamera?2.5:1;this.camera.updateProjectionMatrix();this.controls.update();this.requestRender();}
 getView(name:string):CameraPreset{return {id:crypto.randomUUID(),name,position:this.camera.position.toArray() as [number,number,number],target:this.controls.target.toArray() as [number,number,number],zoom:this.camera.zoom,perspective:this.camera instanceof T.PerspectiveCamera};}
 restoreView(v:CameraPreset){this.overview=false;this.atmosphere?.meteors.setOverview(false);if(v.perspective!==(this.camera instanceof T.PerspectiveCamera))this.toggleProjection();this.camera.position.fromArray(v.position);this.controls.target.fromArray(v.target);this.camera.zoom=v.zoom;this.camera.updateProjectionMatrix();this.overview=true;this.controls.update();this.updateMeteorView();this.requestRender();}
 setQuality(q:'low'|'standard'){if(this.quality===q)return;this.quality=q;this.lighting.setQuality(q);this.renderer.setPixelRatio(Math.min(devicePixelRatio,q==='low'?1:1.5));this.resizeViewport();}
 capturePNG(longEdge=1920,hideLabels=true,helpers:T.Object3D[]=[]){const ratio=this.host.clientWidth/this.host.clientHeight,w=ratio>=1?longEdge:Math.round(longEdge*ratio),h=ratio>=1?Math.round(longEdge/ratio):longEdge;const pixelRatio=this.renderer.getPixelRatio(),hidden=[...helpers,this.regions,...(hideLabels?[this.labels]:[])],states=hidden.map(n=>n.visible);try{hidden.forEach(n=>n.visible=false);this.renderer.setPixelRatio(1);this.renderer.setSize(w,h,false);this.scheduler.renderNow();return this.renderer.domElement.toDataURL('image/png');}finally{hidden.forEach((n,i)=>n.visible=states[i]);this.renderer.setPixelRatio(pixelRatio);this.resizeViewport();}}
 dispose(){this.disposed=true;this.removeDiagnostics?.();this.refinement.dispose();this.atmosphere.dispose();this.scheduler.dispose();this.lighting.dispose();this.resize.disconnect();this.intersection.disconnect();document.removeEventListener('visibilitychange',this.updateVisibility);this.controls.dispose();disposeEnvironment(this.environment);this.clearLabels();this.clearRegions();this.scene.traverse(n=>{if(n instanceof T.Mesh&&!n.userData.objectId){n.geometry.dispose();if(Array.isArray(n.material))n.material.forEach(m=>m.dispose());else n.material.dispose();}});disposeObjectInstances(this.objects);disposeObjectCaches();this.renderer.dispose();this.renderer.domElement.remove();}
}





