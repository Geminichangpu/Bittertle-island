import * as T from 'three';
import {loadAbortableGLB} from './loadAbortableGLB';
import c0 from '../assets/custom-nature/island-cloud-0.glb?url';
import c1 from '../assets/custom-nature/island-cloud-1.glb?url';
import c2 from '../assets/custom-nature/island-cloud-2.glb?url';
import s0 from '../assets/custom-nature/island-shrub-0.glb?url';
import s1 from '../assets/custom-nature/island-shrub-1.glb?url';
import s2 from '../assets/custom-nature/island-shrub-2.glb?url';
import type {InteriorRoom} from '../interiors/room-kit';
type Kind='cloud'|'shrub';
const colors:Record<string,Kind>={f7faf3:'cloud',f2f8ff:'cloud',edf7ff:'cloud','779b56':'shrub','95b96a':'shrub','6a8c56':'shrub','8ca86a':'shrub','365b3d':'shrub','527147':'shrub'};
const urls:Record<Kind,string[]>={cloud:[c0,c1,c2],shrub:[s0,s1,s2]};
/** The originals are captured before refined background meshes replace them. */
export function captureNature(room:InteriorRoom){
 const result:{kind:Kind;color:string;matrix:T.Matrix4}[]=[];if(!room.scenery)return result;
 room.scenery.updateWorldMatrix(true,true);const inv=room.scenery.matrixWorld.clone().invert(),tmp=new T.Matrix4();
 room.scenery.traverse(n=>{if(!(n instanceof T.InstancedMesh)||n.geometry.userData.sourceKey!=='shrine:stone'||Array.isArray(n.material))return;const color=(n.material as T.MeshStandardMaterial).color.getHexString(),kind=colors[color];if(!kind)return;
  for(let i=0;i<n.count;i++){n.getMatrixAt(i,tmp);const matrix=inv.clone().multiply(n.matrixWorld).multiply(tmp);if(kind==='cloud'&&color==='f7faf3'&&i%2===1)continue;if(kind==='cloud'){const pos=new T.Vector3(),rot=new T.Quaternion(),scale=new T.Vector3();matrix.decompose(pos,rot,scale);const random=(k:number)=>{const v=Math.sin((i+1)*127.1+pos.x*31.7+pos.z*17.3+k*91.9)*43758.5453;return v-Math.floor(v);};scale.y*=1.45+random(1)*.5;scale.x*=.75+random(2)*.45;scale.z*=.8+random(3)*.35;if(color!=='f7faf3'){pos.x+=(random(4)-.5)*3;pos.y+=(random(5)-.5)*5;pos.z+=(random(6)-.5)*5;}matrix.compose(pos,rot,scale);}result.push({kind,color,matrix});}
 });return result;
}
export async function natureGeometries(kind:Kind,signal:AbortSignal){return Promise.all(urls[kind].map(async url=>{
 const gltf=await loadAbortableGLB(url,signal);gltf.scene.updateMatrixWorld(true);let mesh:T.Mesh|undefined;gltf.scene.traverse(n=>{if(n instanceof T.Mesh&&!mesh)mesh=n;});if(!mesh)throw Error('Nature asset has no mesh');
 const m=mesh as T.Mesh,g=m.geometry.clone().applyMatrix4(m.matrixWorld);g.computeBoundingBox();const box=g.boundingBox!,size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3());g.translate(-center.x,-center.y,-center.z);g.scale(2/size.x,2/size.y,2/size.z);g.computeBoundingSphere();g.userData.customNature=kind;
 if(!g.getAttribute('color')){const values=new Float32Array(g.getAttribute('position').count*3).fill(1);g.setAttribute('color',new T.BufferAttribute(values,3));}
 gltf.scene.traverse(n=>{if(n instanceof T.Mesh){n.geometry.dispose();for(const mat of Array.isArray(n.material)?n.material:[n.material])mat.dispose();}});return g;
 }));}
export class InteriorNature{
 private abort=new AbortController();private group=new T.Group();private ready=new Set<Kind>();private gs:T.BufferGeometry[]=[];private ms:T.Material[]=[];
 constructor(private room:InteriorRoom,placements:ReturnType<typeof captureNature>,private changed:()=>void){
  this.group.name='custom-interior-nature';this.group.userData.noCollision=true;room.root.add(this.group);
  for(const kind of ['cloud','shrub'] as const){const list=placements.filter(p=>p.kind===kind);if(!list.length)continue;
   void natureGeometries(kind,this.abort.signal).then(gs=>{if(this.abort.signal.aborted){gs.forEach(g=>g.dispose());return;}this.gs.push(...gs);
    const groups=new Map<string,typeof list>();list.forEach((p,i)=>{const pos=new T.Vector3().setFromMatrixPosition(p.matrix),variant=(Math.abs(Math.floor(pos.x*971+pos.z*179+pos.y*313+i*37))%3),key=p.color+':'+variant;if(!groups.has(key))groups.set(key,[]);groups.get(key)!.push(p);});
    for(const [key,items] of groups){const [color,v]=key.split(':'),material=new T.MeshStandardMaterial({color:kind==='cloud'?'#f2f6f3':'#'+color,roughness:1,side:T.DoubleSide});this.ms.push(material);const mesh=new T.InstancedMesh(gs[+v],material,items.length);items.forEach((p,i)=>mesh.setMatrixAt(i,p.matrix));mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=false;mesh.receiveShadow=false;mesh.frustumCulled=false;this.group.add(mesh);}
    this.ready.add(kind);this.applyMask();this.changed();
   }).catch(e=>{if(!this.abort.signal.aborted)console.warn('自然模型加载失败',e);});
  }
 }
 applyMask(){this.room.scenery?.traverse(n=>{if(!(n instanceof T.Mesh))return;let kind:Kind|undefined;
  if(n instanceof T.InstancedMesh&&n.geometry.userData.sourceKey==='shrine:stone'&&!Array.isArray(n.material))kind=colors[(n.material as T.MeshStandardMaterial).color.getHexString()];
  else {const match=n.name.match(/_SR_([0-9a-f]{6})_plain_surface/i);if(match)kind=colors[match[1].toLowerCase()];}
  if(kind&&this.ready.has(kind))n.visible=false;
 });}
 setVisible(visible:boolean){this.group.visible=visible;}
 dispose(){this.abort.abort();this.group.removeFromParent();this.group.traverse(n=>{if(n instanceof T.InstancedMesh)n.dispose();});this.gs.forEach(g=>g.dispose());this.ms.forEach(m=>m.dispose());}
}
