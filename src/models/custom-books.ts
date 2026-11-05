import * as T from 'three';
import {loadAbortableGLB} from './loadAbortableGLB';
import b0 from '../assets/custom-nature/island-book-0.glb?url';
import b1 from '../assets/custom-nature/island-book-1.glb?url';
import b2 from '../assets/custom-nature/island-book-2.glb?url';
import type {InteriorRoom} from '../interiors/room-kit';
/** Replace individually named refined shelf books, preserving each book's slot. */
export class CustomBooks {
 private abort=new AbortController();private sources:T.Group[]=[];private group=new T.Group();private done=false;
 constructor(private room:InteriorRoom,private changed:()=>void){
  this.group.name='custom-shelf-books';this.group.userData.noCollision=true;
  void Promise.all([b0,b1,b2].map(u=>loadAbortableGLB(u,this.abort.signal))).then(assets=>{if(this.abort.signal.aborted)return;this.sources=assets.map(a=>a.scene);this.apply();}).catch(e=>{if(!this.abort.signal.aborted)console.warn('书籍模型加载失败',e);});
 }
 apply(){if(this.done||!this.sources.length)return;const slots=new Map<string,T.Mesh[]>();
  this.room.root.traverse(n=>{if(!(n instanceof T.Mesh))return;const m=n.name.match(/^(.*?书\d+-\d+|31_平放书册_\d+_\d+_\d+|42_柜顶书册_\d+)_/);if(!m)return;if(!slots.has(m[1]))slots.set(m[1],[]);slots.get(m[1])!.push(n);});if(!slots.size)return;
  this.room.root.updateWorldMatrix(true,true);const inv=this.room.root.matrixWorld.clone().invert();let i=0;
  for(const [slot,meshes] of slots){const bounds=new T.Box3();for(const n of meshes){n.geometry.computeBoundingBox();bounds.union(n.geometry.boundingBox!.clone().applyMatrix4(inv.clone().multiply(n.matrixWorld)));}const size=bounds.getSize(new T.Vector3());if(size.x<=0||size.y<=0||size.z<=0||size.y>.9)continue;
   const variant=Array.from(slot).reduce((a,c)=>(Math.imul(a,31)+c.charCodeAt(0))>>>0,19)%this.sources.length;i++;const book=this.sources[variant].clone(true),box=new T.Box3().setFromObject(book),source=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3());
   book.position.sub(center);const holder=new T.Group();holder.add(book);if(size.y<Math.min(size.x,size.z)*.6){holder.rotation.z=Math.PI/2;holder.scale.set(size.y/source.x,size.x/source.y,size.z/source.z);}else if(size.x>size.z){holder.rotation.y=Math.PI/2;holder.scale.set(size.z/source.x,size.y/source.y,size.x/source.z);}else holder.scale.set(size.x/source.x,size.y/source.y,size.z/source.z);
   holder.position.copy(bounds.getCenter(new T.Vector3()));holder.traverse(n=>{if(n instanceof T.Mesh){n.castShadow=true;n.receiveShadow=true;}});this.group.add(holder);meshes.forEach(n=>n.visible=false);
  }
  if(i){this.room.root.add(this.group);this.group.userData.bookCount=i;this.done=true;this.changed();}
 }
 dispose(){this.abort.abort();this.group.removeFromParent();for(const s of this.sources)s.traverse(n=>{if(n instanceof T.Mesh){n.geometry.dispose();for(const m of Array.isArray(n.material)?n.material:[n.material])m.dispose();}});}
}
