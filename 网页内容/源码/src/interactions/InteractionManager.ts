import * as T from 'three';
import {InteractionAudio} from './audio';
import type {InteractionSpec} from './config';
import {useEnvironment} from '../environment/time-state';

type Part={mesh:T.Mesh;index:number|undefined;base:T.Matrix4;toLocal:T.Matrix4;toMesh:T.Matrix4;autoUpdate:boolean};
function setPart(part:Part,matrix:T.Matrix4,restore=false){
 if(part.mesh instanceof T.InstancedMesh){part.mesh.setMatrixAt(part.index!,matrix);part.mesh.instanceMatrix.needsUpdate=true;}
 else {part.mesh.matrix.copy(matrix);matrix.decompose(part.mesh.position,part.mesh.quaternion,part.mesh.scale);part.mesh.matrixAutoUpdate=restore?part.autoUpdate:false;part.mesh.matrixWorldNeedsUpdate=true;}
}
type Entry={spec:InteractionSpec;key:string;anchor:T.Object3D;parts:Part[];group:T.Group;material:T.MeshBasicMaterial;light?:T.PointLight;start:number;last:number};
const lightState=new Map<string,boolean>(); // Visitor state, independent of environment presets and project layout.
export type InteractionStatus={hint:string;message:string;muted:boolean;lights:boolean};
export class InteractionManager {
 readonly audio=new InteractionAudio();readonly entries:Entry[]=[];
 private lookup=new Map<string,Entry>();private ray=new T.Raycaster();private mouse=new T.Vector2(2,2);
 private down:{x:number;y:number}|null=null;private enabled=true;private disposed=false;private lastStatus='';private message='';
 private sphere=new T.SphereGeometry(1,8,6);private ring=new T.RingGeometry(.85,1,32);private glow=new T.SphereGeometry(.12,12,8);
 private beforeKey=(e:KeyboardEvent)=>{if(e.code!=='KeyE'||e.repeat||!this.walking()||(!this.locked&&document.activeElement!==this.canvas))return;if(this.triggerPicked()){e.preventDefault();e.stopImmediatePropagation();}};
 constructor(readonly canvas:HTMLCanvasElement,readonly camera:T.PerspectiveCamera,readonly scene:T.Scene,
  readonly host:HTMLElement,private request:()=>void,private walking:()=>boolean,private shadows:()=>void,
  sources:{root:T.Object3D;namespace:string;specs:InteractionSpec[]}[],private lampSwitch?:(on:boolean)=>void){
  scene.updateMatrixWorld(true);
  for(const source of sources){
   const inverse=source.root.matrixWorld.clone().invert();
   for(const spec of source.specs){
    const entry:Entry={spec,key:source.namespace+':'+spec.id,anchor:source.root,parts:[],group:new T.Group(),material:new T.MeshBasicMaterial({color:spec.effect==='steam'?'#e9f5f3':spec.effect==='ripple'?'#c2f4ec':'#ffe9a0',transparent:true,opacity:0,depthWrite:false,side:T.DoubleSide}),start:-1,last:-Infinity};
    const at=new T.Vector3(...spec.at),half=new T.Vector3(...spec.size).multiplyScalar(.5),bounds=new T.Box3(at.clone().sub(half),at.clone().add(half));
    source.root.traverse(node=>{
     if(!(node instanceof T.Mesh)||node.userData.noCollision||node.userData.interactionEffect)return;
     const instanced=node instanceof T.InstancedMesh;
     const toLocal=inverse.clone().multiply(instanced?node.matrixWorld:node.parent!.matrixWorld),toMesh=toLocal.clone().invert();
     for(let i=0;i<(instanced?node.count:1);i++){
      const base=new T.Matrix4();if(instanced)(node as T.InstancedMesh).getMatrixAt(i,base);else base.copy(node.matrix);const authored=toLocal.clone().multiply(base);node.geometry.computeBoundingBox();const box=node.geometry.boundingBox!.clone().applyMatrix4(authored),p=box.getCenter(new T.Vector3()),scale=box.getSize(new T.Vector3());
      if(!bounds.containsPoint(p)||Math.abs(scale.x)>spec.size[0]*1.8||Math.abs(scale.y)>spec.size[1]*1.8||Math.abs(scale.z)>spec.size[2]*1.8)continue;
      const index=instanced?i:undefined;entry.parts.push({mesh:node,index,base,toLocal,toMesh,autoUpdate:node.matrixAutoUpdate});this.lookup.set(node.uuid+':'+index,entry);
     }
    });
    // Targets refer to existing instances, never invisible hit boxes through walls.
    if(!entry.parts.length){entry.material.dispose();continue;}
    entry.group.name='interaction:'+entry.key;entry.group.userData.noCollision=true;entry.group.userData.interactionEffect=true;entry.group.position.fromArray(spec.at);source.root.add(entry.group);
    if(spec.effect==='light'){
     const scale=source.root.getWorldScale(new T.Vector3()).length()/Math.sqrt(3);
     entry.light=new T.PointLight('#ffe0a4',0,7*scale,2);entry.light.castShadow=false;entry.group.add(entry.light,new T.Mesh(this.glow,entry.material));
    }else if(['steam','ripple','fireflies'].includes(spec.effect)){
     for(let i=0;i<(spec.effect==='ripple'?3:9);i++){const n=new T.Mesh(spec.effect==='ripple'?this.ring:this.sphere,entry.material);n.visible=false;if(spec.effect==='ripple')n.rotation.x=-Math.PI/2;entry.group.add(n);}
    }
    this.entries.push(entry);
   }
  }
  canvas.addEventListener('pointerdown',this.pointerdown,true);canvas.addEventListener('pointermove',this.pointermove);canvas.addEventListener('pointerup',this.pointerup);canvas.addEventListener('pointercancel',this.cancel);
  document.addEventListener('keydown',this.beforeKey,true);document.addEventListener('visibilitychange',this.visibility);this.environment();
 }
 private get locked(){return document.pointerLockElement===this.canvas;}
 private active(){return this.enabled&&!this.disposed&&!document.hidden&&!this.host.closest('[inert]');}
 private pointerdown=(e:PointerEvent)=>{if(e.button!==0||!this.active())return;if(this.locked){if(this.triggerPicked()){e.preventDefault();e.stopImmediatePropagation();}return;}this.down={x:e.clientX,y:e.clientY};this.setMouse(e);};
 private pointermove=(e:PointerEvent)=>{if(!this.active()||this.locked)return;this.setMouse(e);if(this.down&&Math.hypot(e.clientX-this.down.x,e.clientY-this.down.y)>5)this.down=null;this.publish();};
 private pointerup=(e:PointerEvent)=>{const down=this.down;this.down=null;if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<=5){this.setMouse(e);this.triggerPicked(false);}};
 private cancel=()=>{this.down=null;};
 private setMouse(e:PointerEvent){const r=this.canvas.getBoundingClientRect();this.mouse.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);}
 private pick(center=this.locked||this.walking()){
  if(!this.active())return null;
  this.scene.updateMatrixWorld(true);this.ray.setFromCamera(center?new T.Vector2():this.mouse,this.camera);
  const hits=this.ray.intersectObjects(this.scene.children,true);
  for(const hit of hits){
   let n:T.Object3D|null=hit.object,visible=true,ignore=false;while(n){if(!n.visible)visible=false;if(n.userData.interactionEffect||n.userData.noCollision)ignore=true;n=n.parent;}
   if(!visible||ignore)continue;
   const entry=this.lookup.get(hit.object.uuid+':'+hit.instanceId);
   if(!entry)return null;
   const unit=entry.anchor.getWorldScale(new T.Vector3());if(this.walking()&&hit.distance>5.5*Math.min(Math.abs(unit.x),Math.abs(unit.y),Math.abs(unit.z)))return null;
   return entry;
  }return null;
 }
 private triggerPicked(center=this.locked||this.walking()){const target=this.pick(center);if(!target)return false;this.trigger(target.key);return true;}
 interactFocused(){return this.triggerPicked();}
 trigger(key:string){
  const entry=this.entries.find(e=>e.key===key);if(!entry||!this.active())return false;
  const now=performance.now(),spec=entry.spec;
  if(spec.night&&useEnvironment.getState().mode!=='night'){this.message='天黑后，这里也许会有一点不同。';this.publish();return false;}
  if(entry.start>=0||now-entry.last<350)return false;
  entry.last=now;this.message=spec.message;
  if(spec.effect==='light'){
   const on=!(lightState.get(entry.key)??useEnvironment.getState().mode!=='day');lightState.set(entry.key,on);this.message=spec.label+(on?'亮了。':'熄灭了。');this.applyLight(entry);
  }else entry.start=now;
  void this.audio.play(spec.sound).then(()=>{if(this.audio.lastError){this.message='声音暂不可用，仍可继续观看互动。';this.publish();}});
  this.publish();this.shadows();this.request();return true;
 }
 private applyLight(entry:Entry){if(!entry.light)return;const on=lightState.get(entry.key)??useEnvironment.getState().mode!=='day',scale=entry.anchor.getWorldScale(new T.Vector3()).lengthSq()/3;entry.light.intensity=on?12*scale:0;entry.material.opacity=on?.9:0;this.lampSwitch?.(on);}
 resetLights(){for(const e of this.entries)lightState.delete(e.key);this.environment();this.message='灯具已恢复随昼夜变化。';this.publish();this.request();}
 setMuted(value:boolean){this.audio.setMuted(value);this.publish();}
 environment(){for(const e of this.entries){this.applyLight(e);if(e.spec.night&&useEnvironment.getState().mode!=='night')this.restore(e);}this.publish();}
 get animating(){return this.entries.some(e=>e.start>=0);}
 update(time:number){
  for(const entry of this.entries){
   if(entry.start<0)continue;const {spec}=entry,u=Math.min(1,(time-entry.start)/(spec.duration??1400));
   if(u>=1){this.restore(entry);continue;}
   const amount=Math.sin(Math.PI*u),pivot=new T.Vector3(...spec.at),motion=new T.Matrix4();
   if(spec.effect==='slide')motion.makeTranslation(...(spec.delta??[0,0,.18]).map(v=>v*amount) as [number,number,number]);
   else if(spec.effect==='sway'||spec.effect==='turn'){
    const rotation=new T.Matrix4();if(spec.effect==='turn')rotation.makeRotationY(Math.PI*2*(u*u*(3-2*u)));else rotation.makeRotationZ(Math.sin(u*Math.PI*6)*.08*(1-u));
    motion.makeTranslation(...pivot.toArray()).multiply(rotation).multiply(new T.Matrix4().makeTranslation(...pivot.clone().negate().toArray()));
   }
   if(['slide','sway','turn'].includes(spec.effect)){const changed=new Set<T.InstancedMesh>();for(const p of entry.parts){setPart(p,p.toMesh.clone().multiply(motion).multiply(p.toLocal).multiply(p.base));if(p.mesh instanceof T.InstancedMesh)changed.add(p.mesh);}for(const mesh of changed)mesh.computeBoundingSphere();}
   const fx=entry.group.children.filter(n=>n instanceof T.Mesh);entry.material.opacity=amount*(spec.effect==='steam'?.35:.8);
   fx.forEach((node,i)=>{
    node.visible=true;const a=i*2.4;
    if(spec.effect==='ripple'){const r=.2+((u+i/3)%1)*1.7;node.position.set(0,.08+i*.004,0);node.scale.setScalar(r);}
    else if(spec.effect==='steam'){node.position.set(Math.sin(u*4+a)*.13,.15+((u+i/9)%1)*.8,Math.cos(a)*.12);node.scale.set(.06,.11,.06);}
    else{node.position.set(Math.sin(a+u*3)*(.5+u*.6),Math.sin(i+u*4)*.35+.3+u*.5,Math.cos(a+u*2)*.6);node.scale.setScalar(.025+.015*Math.sin(u*9+i)**2);}
   });
  }
  if(this.animating)this.shadows();this.publish();
 }
 private restore(entry:Entry){
  if(entry.start<0)return;entry.start=-1;
  const changed=new Set<T.InstancedMesh>();for(const p of entry.parts){setPart(p,p.base,true);if(p.mesh instanceof T.InstancedMesh)changed.add(p.mesh);}for(const mesh of changed)mesh.computeBoundingSphere();
  entry.group.children.forEach(n=>{if(n instanceof T.Mesh)n.visible=false;});entry.material.opacity=0;this.shadows();
 }
 private publish(){const target=this.pick(),hint=target?(target.spec.night&&useEnvironment.getState().mode!=='night'?'':`点击 / E · ${target.spec.label}`):'',state:InteractionStatus={hint,message:this.message,muted:this.audio.muted,lights:this.entries.some(e=>e.spec.effect==='light')},key=JSON.stringify(state);if(key!==this.lastStatus){this.lastStatus=key;this.host.dispatchEvent(new CustomEvent('island-interaction',{detail:state}));}}
 setActive(value:boolean){this.enabled=value;if(!value)this.pause();else this.environment();}
 pause(){this.cancel();for(const e of this.entries)this.restore(e);this.audio.suspend();}
 private visibility=()=>{if(document.hidden)this.pause();};
 dispose(){this.disposed=true;this.pause();this.canvas.removeEventListener('pointerdown',this.pointerdown,true);this.canvas.removeEventListener('pointermove',this.pointermove);this.canvas.removeEventListener('pointerup',this.pointerup);this.canvas.removeEventListener('pointercancel',this.cancel);document.removeEventListener('keydown',this.beforeKey,true);document.removeEventListener('visibilitychange',this.visibility);for(const e of this.entries){e.group.removeFromParent();e.material.dispose();}this.sphere.dispose();this.ring.dispose();this.glow.dispose();this.audio.dispose();this.lookup.clear();}
}
