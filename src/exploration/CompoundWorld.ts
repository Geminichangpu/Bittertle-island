import * as T from 'three';
import {CollisionWorld} from '../interiors/CollisionWorld';
import {OBB} from 'three/addons/math/OBB.js';

type GroundTriangle={ax:number;az:number;ay:number;bx:number;bz:number;by:number;cx:number;cz:number;cy:number;det:number};
/** Terrain support comes from the rendered triangles, not an invisible replacement plane. */
export class CompoundWorld extends CollisionWorld{
 private triangles=new Map<string,GroundTriangle[]>();
 private oriented=new Map<T.Box3,{local:T.Box3;inverse:T.Matrix4;matrix:T.Matrix4;obb:OBB}>();
 constructor(terrain:T.Mesh,readonly bounds:T.Box3,private elevated=false){
  super();terrain.updateWorldMatrix(true,false);const g=terrain.geometry,p=g.getAttribute('position'),index=g.index;
  const a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),count=index?index.count:p.count;
  for(let i=0;i<count;i+=3){a.fromBufferAttribute(p,index?index.getX(i):i).applyMatrix4(terrain.matrixWorld);b.fromBufferAttribute(p,index?index.getX(i+1):i+1).applyMatrix4(terrain.matrixWorld);c.fromBufferAttribute(p,index?index.getX(i+2):i+2).applyMatrix4(terrain.matrixWorld);
   const minX=Math.min(a.x,b.x,c.x),maxX=Math.max(a.x,b.x,c.x),minZ=Math.min(a.z,b.z,c.z),maxZ=Math.max(a.z,b.z,c.z);
   if(maxX<bounds.min.x||minX>bounds.max.x||maxZ<bounds.min.z||minZ>bounds.max.z)continue;
   const det=(b.z-c.z)*(a.x-c.x)+(c.x-b.x)*(a.z-c.z);if(Math.abs(det)<1e-9)continue;
   const tri={ax:a.x,az:a.z,ay:a.y,bx:b.x,bz:b.z,by:b.y,cx:c.x,cz:c.z,cy:c.y,det};
   for(let x=Math.floor(Math.max(minX,bounds.min.x)/2);x<=Math.floor(Math.min(maxX,bounds.max.x)/2);x++)for(let z=Math.floor(Math.max(minZ,bounds.min.z)/2);z<=Math.floor(Math.min(maxZ,bounds.max.z)/2);z++){const key=x+','+z,list=this.triangles.get(key)||[];list.push(tri);this.triangles.set(key,list);}
  }
 }
 override addObject(root:T.Object3D,excluded=new Set<T.Object3D|undefined>(),bounds?:T.Box3){
  root.updateWorldMatrix(true,true);const instance=new T.Matrix4();
  const record=(local:T.Box3,matrix:T.Matrix4)=>{const box=local.clone().applyMatrix4(matrix);if(bounds&&!bounds.intersectsBox(box))return;this.add(box);const obb=new OBB().fromBox3(local).applyMatrix4(matrix);obb.center.copy(local.getCenter(new T.Vector3()).applyMatrix4(matrix));this.oriented.set(box,{local:local.clone(),matrix:matrix.clone(),inverse:matrix.clone().invert(),obb});};
  const visit=(node:T.Object3D)=>{if(excluded.has(node)||node.userData.noCollision)return;if(node instanceof T.Mesh){node.geometry.computeBoundingBox();const box=node.geometry.boundingBox!;if(node instanceof T.InstancedMesh){for(let i=0;i<node.count;i++){node.getMatrixAt(i,instance);record(box,node.matrixWorld.clone().multiply(instance));}}else record(box,node.matrixWorld);}node.children.forEach(visit);};visit(root);
 }
 override clear(x:number,z:number,feet:number,radius:number,height:number,climb=0){
  const body=new OBB().fromBox3(new T.Box3(new T.Vector3(x-radius,feet+climb+.035,z-radius),new T.Vector3(x+radius,feet+height,z+radius)));
  for(const box of this.nearby(x,z,radius)){if(box.max.y<=feet+climb+.035||box.min.y>=feet+height)continue;if(body.intersectsOBB(this.oriented.get(box)?.obb||new OBB().fromBox3(box)))return false;}return true;
 }
 ground(x:number,z:number){
  if(x<this.bounds.min.x||x>this.bounds.max.x||z<this.bounds.min.z||z>this.bounds.max.z)return null;
  for(const t of this.triangles.get(Math.floor(x/2)+','+Math.floor(z/2))||[]){const u=((t.bz-t.cz)*(x-t.cx)+(t.cx-t.bx)*(z-t.cz))/t.det,v=((t.cz-t.az)*(x-t.cx)+(t.ax-t.cx)*(z-t.cz))/t.det,w=1-u-v;if(u>=-1e-6&&v>=-1e-6&&w>=-1e-6)return u*t.ay+v*t.by+w*t.cy;}
  return null;
 }
 override floor(x:number,z:number,feet:number,step=.38,drop=.6){
  const ground=this.ground(x,z);if(ground===null)return null;
  let support=-Infinity;const origin=new T.Vector3(x,feet+step+.006,z),hit=new T.Vector3();
  for(const box of this.nearby(x,z,.03)){const ob=this.oriented.get(box),ray=new T.Ray(origin.clone(),new T.Vector3(0,-1,0));if(ob)ray.applyMatrix4(ob.inverse);const result=ray.intersectBox(ob?.local||box,hit);if(!result)continue;if(ob)hit.applyMatrix4(ob.matrix);if(hit.y<=feet+step+.005&&hit.y>=feet-drop)support=Math.max(support,hit.y);}
  if(ground<=feet+step+.005&&ground>=feet-drop)support=Math.max(ground,support);
  return Number.isFinite(support)?support:null;
 }
 override visible(from:T.Vector3,to:T.Vector3){
  const length=from.distanceTo(to),mid=from.clone().add(to).multiplyScalar(.5),hit=new T.Vector3();
  for(const box of this.nearby(mid.x,mid.z,length/2+.1)){const ob=this.oriented.get(box),ray=new T.Ray(from.clone(),to.clone().sub(from).normalize());if(ob)ray.applyMatrix4(ob.inverse);if((ob?.local||box).containsPoint(ray.origin))continue;if(ray.intersectBox(ob?.local||box,hit)){if(ob)hit.applyMatrix4(ob.matrix);if(from.distanceTo(hit)<length-.45)return false;}}return true;
 }
 override spawn(wanted:T.Vector3,radius:number,height:number){
  // Feihua's bridge and terrace sit above a ravine. Prefer their authored deck
  // elevation; terrain-first spawning would place the visitor below the bridge.
  if(this.elevated)for(let r=0;r<=6;r+=.4)for(let i=0;i<(r?24:1);i++){
   const x=wanted.x+Math.cos(i*Math.PI/12)*r,z=wanted.z+Math.sin(i*Math.PI/12)*r;
   const y=this.floor(x,z,wanted.y,.45,1.2);
   if(y!==null&&this.clear(x,z,y,radius,height))return new T.Vector3(x,y,z);
  }
  // Search on the ground near the authored entrance, never on a roof.
  for(let r=0;r<=18;r+=.5)for(let i=0;i<(r?32:1);i++){
   const x=wanted.x+Math.cos(i*Math.PI/16)*r,z=wanted.z+Math.sin(i*Math.PI/16)*r,g=this.ground(x,z);if(g===null)continue;
   const y=this.floor(x,z,g,.65,1);if(y!==null&&this.clear(x,z,y,radius,height))return new T.Vector3(x,y,z);
  }return null;
 }
}

