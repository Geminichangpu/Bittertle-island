import * as T from 'three';
import type {EditorController} from './EditorController';
import type {Point,Terrain} from '../data/model';
import {applyBrush,type BrushMode} from '../terrain/editing';
import {sampleHeight} from '../terrain/terrain';
/** Pointer-driven only. Uses the scene scheduler's before-draw hook, never a second rAF loop. */
export class TerrainInteraction {
 enabled=false;mode:BrushMode='raise';radius=16;strength=2;level=8;draft:Terrain|null=null;private pending:Point|null=null;private last:Point|null=null;private pointerId:number|null=null;
 cursor:T.LineLoop;onCommit:(t:Terrain)=>void=()=>{};
 constructor(private s:EditorController){const p=Array.from({length:48},(_,i)=>new T.Vector3(Math.cos(i/48*Math.PI*2),0,Math.sin(i/48*Math.PI*2)));this.cursor=new T.LineLoop(new T.BufferGeometry().setFromPoints(p),new T.LineBasicMaterial({color:'#fff4c3',depthTest:false}));this.cursor.visible=false;this.cursor.renderOrder=10;s.scene.add(this.cursor);const el=s.renderer.domElement;el.addEventListener('pointerdown',this.down,true);el.addEventListener('pointermove',this.move,true);el.addEventListener('pointerup',this.up,true);el.addEventListener('pointercancel',this.cancel,true);window.addEventListener('blur',this.cancel);}
 setEnabled(v:boolean){if(!v)this.cancel();this.enabled=v;this.s.controls.enabled=!v;this.s.transform.enabled=!v;this.s.select(v?null:this.s.selectedId);this.cursor.visible=false;this.s.requestRender();}
 hit(e:PointerEvent):Point|null{const rect=this.s.renderer.domElement.getBoundingClientRect(),ray=new T.Raycaster();ray.setFromCamera(new T.Vector2((e.clientX-rect.left)/rect.width*2-1,1-(e.clientY-rect.top)/rect.height*2),this.s.camera);const hit=ray.intersectObject(this.s.terrain)[0];return hit?[hit.point.x,hit.point.z]:null;}
 down=(e:PointerEvent)=>{if(!this.enabled||e.button!==0)return;e.stopImmediatePropagation();const p=this.hit(e);if(!p)return;this.draft=structuredClone(this.s.project.terrain);this.pending=p;this.last=null;this.pointerId=e.pointerId;this.s.renderer.domElement.setPointerCapture(e.pointerId);this.s.requestRender();};
 move=(e:PointerEvent)=>{if(!this.enabled)return;e.stopImmediatePropagation();const p=this.hit(e);this.cursor.visible=!!p;if(p){this.cursor.position.set(p[0],sampleHeight(this.draft||this.s.project.terrain,...p)+.8,p[1]);this.cursor.scale.set(this.radius,1,this.radius);if(this.draft)this.pending=p;}this.s.requestRender();};
 flush(){if(!this.draft||!this.pending)return;const p=this.pending;this.pending=null;const steps=this.last?Math.min(50,Math.max(1,Math.ceil(Math.hypot(p[0]-this.last[0],p[1]-this.last[1])/(this.radius/3)))):1;for(let i=1;i<=steps;i++){const center:Point=this.last?[this.last[0]+(p[0]-this.last[0])*i/steps,this.last[1]+(p[1]-this.last[1])*i/steps]:p;applyBrush(this.draft,center,this.mode,this.radius,this.strength,this.level);}this.last=p;this.s.previewTerrain(this.draft);}
 up=(e:PointerEvent)=>{if(!this.enabled)return;e.stopImmediatePropagation();if(!this.draft)return;this.flush();const t=this.draft;this.draft=null;this.last=null;this.release();this.onCommit(t);this.s.requestRender();};
 release(){if(this.pointerId!==null&&this.s.renderer.domElement.hasPointerCapture(this.pointerId))this.s.renderer.domElement.releasePointerCapture(this.pointerId);this.pointerId=null;}
 cancel=()=>{if(this.draft)this.s.previewTerrain(this.s.project.terrain);this.draft=null;this.pending=null;this.last=null;this.release();this.cursor.visible=false;};
 dispose(){this.cancel();const el=this.s.renderer.domElement;el.removeEventListener('pointerdown',this.down,true);el.removeEventListener('pointermove',this.move,true);el.removeEventListener('pointerup',this.up,true);el.removeEventListener('pointercancel',this.cancel,true);window.removeEventListener('blur',this.cancel);this.cursor.geometry.dispose();(this.cursor.material as T.Material).dispose();this.s.scene.remove(this.cursor);}
}
