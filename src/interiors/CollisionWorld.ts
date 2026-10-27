import * as T from 'three';
import type {InteriorRoom} from './room-kit';

/** Immutable, world-space broad phase built once per loaded room, including instances. */
export class CollisionWorld {
 readonly boxes:T.Box3[]=[];
 private cells=new Map<string,number[]>();
 readonly cellSize=2;
 constructor(room?:InteriorRoom){
  if(!room)return;
  this.addObject(room.root,new Set([room.scenery,room.lid]));
 }
 addObject(root:T.Object3D,excluded=new Set<T.Object3D|undefined>(),bounds?:T.Box3){
  root.updateWorldMatrix(true,true);
  const instance=new T.Matrix4(),world=new T.Matrix4();
  const add=(box:T.Box3)=>{if(!bounds||bounds.intersectsBox(box))this.add(box);};
  const visit=(node:T.Object3D)=>{
   if(excluded.has(node)||node.userData.noCollision)return;
   if(node instanceof T.Mesh){
    node.geometry.computeBoundingBox();const bb=node.geometry.boundingBox!;
    if(node instanceof T.InstancedMesh){for(let i=0;i<node.count;i++){node.getMatrixAt(i,instance);world.multiplyMatrices(node.matrixWorld,instance);add(bb.clone().applyMatrix4(world));}}
    else add(bb.clone().applyMatrix4(node.matrixWorld));
   }
   node.children.forEach(visit);
  };visit(root);
 }
 add(box:T.Box3){
  if(box.isEmpty()||!Number.isFinite(box.min.x))return;
  // Ignore tiny painted details; substantial geometry still blocks movement.
  const s=box.getSize(new T.Vector3());if(Math.max(s.x,s.y,s.z)<.08)return;
  const id=this.boxes.push(box)-1;
  for(let x=Math.floor(box.min.x/2);x<=Math.floor(box.max.x/2);x++)for(let z=Math.floor(box.min.z/2);z<=Math.floor(box.max.z/2);z++){const key=x+','+z,list=this.cells.get(key)||[];list.push(id);this.cells.set(key,list);}
 }
 nearby(x:number,z:number,r:number){const ids=new Set<number>();for(let a=Math.floor((x-r)/2);a<=Math.floor((x+r)/2);a++)for(let b=Math.floor((z-r)/2);b<=Math.floor((z+r)/2);b++)for(const id of this.cells.get(a+','+b)||[])ids.add(id);return [...ids].map(id=>this.boxes[id]);}
 floor(x:number,z:number,feet:number,step=.38,drop=.6){
  let y=-Infinity;
  for(const b of this.nearby(x,z,.03))if(b.max.x-b.min.x>=.15&&b.max.z-b.min.z>=.15&&x>=b.min.x-.005&&x<=b.max.x+.005&&z>=b.min.z-.005&&z<=b.max.z+.005&&b.max.y<=feet+step+.005&&b.max.y>=feet-drop)y=Math.max(y,b.max.y);
  return Number.isFinite(y)?y:null;
 }
 clear(x:number,z:number,feet:number,radius:number,height:number,climb=0){
  for(const b of this.nearby(x,z,radius)){
   if(b.max.y<=feet+climb+.035||b.min.y>=feet+height)continue;
   const dx=x-Math.max(b.min.x,Math.min(b.max.x,x)),dz=z-Math.max(b.min.z,Math.min(b.max.z,z));
   if(dx*dx+dz*dz<radius*radius-.00001)return false;
  }return true;
 }
 step(position:T.Vector3,dx:number,dz:number,radius=.38,height=3.18,step=.38){
  const attempt=(x:number,z:number)=>{
   // The rear of the footprint may still be on a higher tread while descending.
   const drop=Math.max(step*3,radius*3);
   let top=this.floor(x,z,position.y,step,drop);if(top===null)return false;
   // Capsule footprint must have support, and stairs can raise it by only one riser.
   for(const [xx,zz] of [[x+radius*.75,z],[x-radius*.75,z],[x,z+radius*.75],[x,z-radius*.75]]){
    const y=this.floor(xx,zz,position.y,step,drop);if(y===null)return false;top=Math.max(top,y);
   }
   if(!this.clear(x,z,top,radius,height,step))return false;position.set(x,top,z);return true;
  };
  // Short sweeps prevent crossing a thin wall on a slow frame; slide along free axes.
  const n=Math.max(1,Math.ceil(Math.hypot(dx,dz)/Math.max(.06,radius*.45)));let moved=false;
  for(let i=0;i<n;i++){const x=dx/n,z=dz/n;if(attempt(position.x+x,position.z+z)){moved=true;continue;}if(x&&attempt(position.x+x,position.z))moved=true;if(z&&attempt(position.x,position.z+z))moved=true;}
  return moved;
 }
 spawn(wanted:T.Vector3,radius:number,height:number){
  for(let r=0;r<=5;r+=.4)for(let a=0;a<(r?16:1);a++){
   const x=wanted.x+Math.cos(a*Math.PI/8)*r,z=wanted.z+Math.sin(a*Math.PI/8)*r,y=this.floor(x,z,wanted.y,.4,2);
   if(y!==null&&this.clear(x,z,y,radius,height))return new T.Vector3(x,y,z);
  }return null;
 }
 visible(from:T.Vector3,to:T.Vector3){
  const delta=to.clone().sub(from),length=delta.length(),ray=new T.Ray(from,delta.normalize()),hit=new T.Vector3();
  const mid=from.clone().add(to).multiplyScalar(.5);
  for(const b of this.nearby(mid.x,mid.z,length/2+.1))if(ray.intersectBox(b,hit)&&from.distanceTo(hit)<length-.45&&!b.containsPoint(from))return false;
  return true;
 }
}
