import * as T from 'three';
import type {Project,IslandObject,LayoutGroup,GroundPad,Vec3} from '../data/model.ts';
import {makeMesh,disposeObjectInstances} from '../generators/objects.ts';
import {inside,isLand,coastDistance,sampleHeight} from './terrain.ts';
import {updateLandscapeGrade,groundBridge} from './landscape.ts';
import {syncFeihuaTerrain} from '../data/feihua-upgrade.ts';

const cachedBounds=new Map<string,T.Box3>();
const round=(n:number)=>Math.round(n*1e7)/1e7;
function localBounds(o:IslandObject,bearing=false){
 const key=JSON.stringify([o.templateId,o.params,bearing]);let box=cachedBounds.get(key);
 if(!box){const mesh=makeMesh(o);mesh.position.set(0,0,0);mesh.rotation.set(0,0,0);mesh.scale.set(1,1,1);mesh.updateMatrixWorld(true);box=new T.Box3();
  if(bearing)mesh.traverse(n=>{if(!(n instanceof T.Mesh))return;n.geometry.computeBoundingBox();const add=(m:T.Matrix4)=>{const bb=n.geometry.boundingBox!.clone().applyMatrix4(m);if(bb.min.y<=.8&&bb.max.y>=-.8)box!.union(bb);};if(n instanceof T.InstancedMesh){for(let i=0;i<n.count;i++){const m=new T.Matrix4();n.getMatrixAt(i,m);add(m.premultiply(n.matrixWorld));}}else add(n.matrixWorld);});
  if(box.isEmpty())box.setFromObject(mesh);disposeObjectInstances(mesh);cachedBounds.set(key,box);}
 return box;
}
export const transformMatrix=(o:IslandObject|LayoutGroup)=>new T.Matrix4().compose(new T.Vector3(...o.position),new T.Quaternion().setFromEuler(new T.Euler(...o.rotation)),new T.Vector3(...o.scale));
export function objectWorldBounds(p:Project,o:IslandObject,bearing=false){const m=transformMatrix(o),g=p.groups?.find(g=>g.id===o.parentId);if(g)m.premultiply(transformMatrix(g));return localBounds(o,bearing).clone().applyMatrix4(m);}

function footprintPoints(box:T.Box3){
 const result:[number,number][]=[];const nx=Math.max(1,Math.ceil((box.max.x-box.min.x)/3)),nz=Math.max(1,Math.ceil((box.max.z-box.min.z)/3));
 for(let i=0;i<=nx;i++)for(let j=0;j<=nz;j++)if(i===0||j===0||i===nx||j===nz||i%3===0&&j%3===0)result.push([box.min.x+(box.max.x-box.min.x)*i/nx,box.min.z+(box.max.z-box.min.z)*j/nz]);
 return result;
}
export function footprintOnLand(p:Project,box:T.Box3,islet?:boolean){
 for(const [x,z] of footprintPoints(box))if(!isLand(p.terrain,x,z)||(islet!==undefined&&inside([x,z],p.terrain.islet)!==islet))return false;
 for(const x of [box.min.x,box.max.x])for(const z of [box.min.z,box.max.z])if(coastDistance(p.terrain,[x,z])<1.25)return false;
 return true;
}

/** Preserve authored horizontal placement and scale. Existing scenes may also retain all heights. */
export function settleBuildings(p:Project,preserveHeights=true,fitBridge=false){
 if(p.terrain.heightmapRevision!==1)return p;
 const bridgePads=p.terrain.pads?.filter(a=>a.ownerId.includes(':'))||[];
 p.terrain.pads=[];
 updateLandscapeGrade(p);
 const units:(IslandObject|LayoutGroup)[]=[...(p.groups||[]),...p.objects.filter(o=>!o.parentId&&o.templateId!=='island_bridge')];
 const pads:GroundPad[]=[];
 for(const unit of units){
  if(unit.id==='feihua_group'){syncFeihuaTerrain(p);continue;}
  const members='templateId' in unit?[unit]:p.objects.filter(o=>o.parentId===unit.id);if(!members.length)continue;
  const bounds=()=>members.map(o=>objectWorldBounds(p,o));
  // A common terrace for each authored group, individual terraces for standalone landmarks.
  const boxes=bounds(),samples=boxes.flatMap(b=>{const c=b.getCenter(new T.Vector3());return [sampleHeight(p.terrain,c.x,c.z),sampleHeight(p.terrain,b.min.x,b.min.z),sampleHeight(p.terrain,b.max.x,b.max.z)];}).sort((a,b)=>a-b);
  updateLandscapeGrade(p);
  const grade=p.terrain.grading;
  const level=round(grade&&members.every(o=>o.templateId.startsWith('base_'))?grade.baseLevel:grade&&members.every(o=>o.templateId.startsWith('shrine_'))?grade.hillLevel:samples[Math.floor(samples.length/2)]);
  const group='templateId' in unit?undefined:unit;
  if(group&&!preserveHeights){group.position[1]=level;}
  for(const o of members){
   // Local Y=0 is the authored ground plane; stone/footing tips may deliberately enter soil.
   let b=objectWorldBounds(p,o);const worldOrigin=new T.Vector3().applyMatrix4(group?transformMatrix(group).multiply(transformMatrix(o)):transformMatrix(o));const delta=level-worldOrigin.y;
   if(!preserveHeights&&group){const inverse=transformMatrix(group).invert();const a=new T.Vector3(0,delta,0).applyMatrix4(inverse).sub(new T.Vector3().applyMatrix4(inverse));o.position=o.position.map((v,i)=>round(v+a.getComponent(i))) as Vec3;}
   else if(!preserveHeights)o.position[1]=round(o.position[1]+delta);
   const padLevel=preserveHeights?worldOrigin.y:level;
   if(!preserveHeights)o.snapToGround=false;b=objectWorldBounds(p,o,!!p.terrain.landscapeRevision);
   pads.push({ownerId:o.id,minX:round(b.min.x-.05),maxX:round(b.max.x+.05),minZ:round(b.min.z-.05),maxZ:round(b.max.z+.05),level:padLevel,feather:p.terrain.landscapeRevision&&(o.templateId.startsWith('shrine_')||o.templateId.startsWith('base_'))?24:5});
  }
 }
 p.terrain.pads=[...pads,...bridgePads];if(fitBridge)groundBridge(p);return p;
}
