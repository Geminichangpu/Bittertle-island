import * as T from 'three';
import {CollisionWorld} from './CollisionWorld';
import type {explorationConfig,Hotspot} from './exploration-config';
type Config=ReturnType<typeof explorationConfig>;
export type ExplorationState={active:boolean;locked:boolean;hint:string;target:string;message:string};
/** Input-driven movement: uses the room's DemandRenderer, never starts its own rAF. */
export class ExplorationController {
 active=false;private keys=new Set<string>();private touchKeys=new Set<string>();private drag:number|null=null;
 private yaw=0;private pitch=0;private last=0;private dirty=false;private moved=false;private message='';private lastState='';
 readonly feet=new T.Vector3();private nearest:Hotspot|null=null;private euler=new T.Euler(0,0,0,'YXZ');
 constructor(readonly canvas:HTMLCanvasElement,readonly camera:T.PerspectiveCamera,readonly world:CollisionWorld,readonly config:Config,
  private request:()=>void,private onState:(s:ExplorationState)=>void,private onAction:(h:Hotspot)=>void,private onStop:()=>void){
  canvas.tabIndex=0;canvas.style.touchAction='none';
  document.addEventListener('keydown',this.keydown);document.addEventListener('keyup',this.keyup);document.addEventListener('pointerlockchange',this.lockchange);document.addEventListener('pointerlockerror',this.lockerror);
  document.addEventListener('mousemove',this.mousemove);window.addEventListener('blur',this.pause);document.addEventListener('visibilitychange',this.visibility);
  canvas.addEventListener('pointerdown',this.pointerdown);canvas.addEventListener('pointermove',this.pointermove);canvas.addEventListener('pointerup',this.pointerup);canvas.addEventListener('pointercancel',this.pointerup);
 }
 get locked(){return document.pointerLockElement===this.canvas;}
 get needsFrame(){return this.active&&this.moved&&(this.keys.size>0||this.touchKeys.size>0);}
 start(){
  const spawn=this.world.spawn(this.config.spawn,this.config.radius,this.config.height);
  if(!spawn){this.message='这里没有足够的站立空间，请返回观察视角。';this.publish();return false;}
  this.feet.copy(spawn);this.active=true;this.camera.position.copy(spawn).y+=this.config.eye;
  this.camera.lookAt(this.config.target);this.euler.setFromQuaternion(this.camera.quaternion,'YXZ');this.yaw=this.euler.y;this.pitch=this.euler.x;this.last=0;this.dirty=true;this.request();this.publish();return true;
 }
 async capturePointer(){
  if(!this.active)return;
  this.canvas.focus();
  if(matchMedia('(pointer:coarse)').matches){this.message='拖动画面观察，使用方向按钮移动。';this.publish();return;}
  try{await this.canvas.requestPointerLock();this.message='';}catch{this.message='鼠标锁定不可用：按住画面拖动观察，WASD 移动。';this.publish();}
 }
 stop(){this.active=false;this.pause();if(this.locked)document.exitPointerLock();this.nearest=null;this.publish();}
 pause=()=>{this.keys.clear();this.touchKeys.clear();this.drag=null;this.moved=false;this.last=0;};
 visibility=()=>{if(document.hidden){this.pause();if(this.locked)document.exitPointerLock();}};
 lockchange=()=>{this.pause();this.publish();};
 lockerror=()=>{this.message='按住画面拖动观察，WASD 移动。';this.publish();};
 keydown=(e:KeyboardEvent)=>{
  if(!this.active||e.ctrlKey||e.metaKey||e.altKey)return;
  if(e.code!=='Escape'&&!this.locked&&document.activeElement!==this.canvas)return;
  if(e.target instanceof HTMLElement&&(e.target.closest('input,select,textarea')||e.target.isContentEditable))return;
  if(e.code==='Escape'){e.preventDefault();this.onStop();return;}
  if(e.code==='KeyE'){if(!e.repeat){e.preventDefault();this.interact();}return;}
  if(['KeyW','KeyA','KeyS','KeyD','ShiftLeft','ShiftRight'].includes(e.code)){e.preventDefault();if(!this.keys.has(e.code)){this.keys.add(e.code);this.last=0;this.request();}}
 };
 keyup=(e:KeyboardEvent)=>{this.keys.delete(e.code);if(!this.keys.size&&!this.touchKeys.size){this.moved=false;this.last=0;}};
 look(dx:number,dy:number){if(!this.active)return;this.yaw-=dx*.0023;this.pitch=T.MathUtils.clamp(this.pitch-dy*.0023,-1.4,1.4);this.dirty=true;this.request();}
 mousemove=(e:MouseEvent)=>{if(this.active&&this.locked)this.look(e.movementX,e.movementY);};
 pointerdown=(e:PointerEvent)=>{if(!this.active||e.button!==0)return;if(this.locked){this.interact();return;}this.canvas.focus();this.drag=e.pointerId;this.canvas.setPointerCapture(e.pointerId);};
 pointermove=(e:PointerEvent)=>{if(this.drag===e.pointerId&&!this.locked)this.look(e.movementX,e.movementY);};
 pointerup=(e:PointerEvent)=>{if(this.drag===e.pointerId)this.drag=null;};
 touch(code:string,pressed:boolean){if(!this.active)return;if(pressed)this.touchKeys.add(code);else this.touchKeys.delete(code);this.last=0;this.request();}
 update(time:number){
  if(!this.active)return;const dt=this.last?Math.min(.05,(time-this.last)/1000):1/60;this.last=time;
  const down=(k:string)=>this.keys.has(k)||this.touchKeys.has(k),x=Number(down('KeyD'))-Number(down('KeyA')),z=Number(down('KeyS'))-Number(down('KeyW'));
  this.moved=false;
  if(x||z){const len=Math.hypot(x,z),speed=this.config.speed*(down('ShiftLeft')||down('ShiftRight')?1.65:1)*dt;
   this.moved=this.world.step(this.feet,(x*Math.cos(this.yaw)+z*Math.sin(this.yaw))/len*speed,(-x*Math.sin(this.yaw)+z*Math.cos(this.yaw))/len*speed,this.config.radius,this.config.height,this.config.step);
  }
  if(this.dirty||this.moved){this.camera.position.copy(this.feet);this.camera.position.y+=this.config.eye;this.camera.quaternion.setFromEuler(this.euler.set(this.pitch,this.yaw,0,'YXZ'));this.dirty=false;}
  this.refreshHint();this.publish();
 }
 private refreshHint(){
  const forward=new T.Vector3(0,0,-1).applyQuaternion(this.camera.quaternion);let best=Infinity;this.nearest=null;
  for(const h of this.config.points){const delta=h.position.clone().sub(this.camera.position),distance=delta.length();if(distance>h.radius||forward.dot(delta.normalize())<.35||distance>=best)continue;
   if(!this.world.visible(this.camera.position,h.position))continue;this.nearest=h;best=distance;
  }
 }
 interact(){if(!this.active||!this.nearest)return;const h=this.nearest;this.pause();if(this.locked)document.exitPointerLock();this.onAction(h);}
 private publish(){const s:ExplorationState={active:this.active,locked:this.locked,hint:this.nearest?`E / 点击 · ${this.nearest.label}`:'',target:this.nearest?.id||'',message:this.message},key=JSON.stringify(s);if(key!==this.lastState){this.lastState=key;this.onState(s);}}
 dispose(){this.stop();document.removeEventListener('keydown',this.keydown);document.removeEventListener('keyup',this.keyup);document.removeEventListener('pointerlockchange',this.lockchange);document.removeEventListener('pointerlockerror',this.lockerror);document.removeEventListener('mousemove',this.mousemove);window.removeEventListener('blur',this.pause);document.removeEventListener('visibilitychange',this.visibility);this.canvas.removeEventListener('pointerdown',this.pointerdown);this.canvas.removeEventListener('pointermove',this.pointermove);this.canvas.removeEventListener('pointerup',this.pointerup);this.canvas.removeEventListener('pointercancel',this.pointerup);}
}
