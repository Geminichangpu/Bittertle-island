import * as T from 'three';
import {isLand,coastDistance} from '../terrain/terrain';
import type {Project} from '../data/model';
import {loadAbortableGLB} from './loadAbortableGLB';
import rowUrl from '../assets/cc0-test/watercraft/boat-row-small.glb?url';
import fishingUrl from '../assets/cc0-test/watercraft/boat-fishing-small.glb?url';
/** A pair of small watercraft on open water alongside the existing harbour. */
export class DockBoats{
 ready:Promise<void>;private abort=new AbortController();private templates:T.Group[]=[];private group=new T.Group();private project:Project;private pier?:T.Object3D;
 constructor(private scene:T.Scene,project:Project,pier:T.Object3D|undefined,private changed:()=>void){this.project=project;this.pier=pier;this.group.name='kenney-dock-boats';this.group.userData.noCollision=true;scene.add(this.group);
  this.ready=Promise.all([rowUrl,fishingUrl].map(u=>loadAbortableGLB(u,this.abort.signal))).then(assets=>{if(this.abort.signal.aborted)return;this.templates=assets.map(x=>x.scene);this.refresh(this.project,this.pier);}).catch(e=>{if(!this.abort.signal.aborted)console.warn('码头船只加载失败',e);});
 }
 refresh(project:Project,pier:T.Object3D|undefined){this.project=project;this.pier=pier;this.group.clear();if(!pier||!this.templates.length)return;pier.updateWorldMatrix(true,false);const quat=pier.getWorldQuaternion(new T.Quaternion()),slots=[[-4.5,9],[4.7,9],[-4.8,14],[5.1,14],[-5.5,19],[5.5,19]],used:T.Vector3[]=[];
  for(const [x,z] of slots){const at=pier.localToWorld(new T.Vector3(x,0,z));if(used.some(q=>q.distanceTo(at)<5))continue;let water=coastDistance(project.terrain,[at.x,at.z])>2.5;for(const [dx,dz] of [[0,0],[-.8,0],[.8,0],[0,-1.4],[0,1.4]])if(isLand(project.terrain,at.x+dx,at.z+dz))water=false;if(!water)continue;
   const n=this.templates[used.length].clone(true);n.name=used.length?'kenney-fishing-boat':'kenney-rowboat';n.position.set(at.x,-.13,at.z);n.quaternion.copy(quat);if(used.length)n.rotateY(.18);n.userData.noCollision=true;n.traverse(c=>{c.userData.noCollision=true;if(c instanceof T.Mesh){c.castShadow=true;c.receiveShadow=true;}});this.group.add(n);used.push(at);if(used.length===2)break;
  }this.group.userData.boatCount=used.length;this.changed();
 }
 dispose(){this.abort.abort();this.group.removeFromParent();for(const s of this.templates)s.traverse(n=>{if(n instanceof T.Mesh){n.geometry.dispose();for(const m of Array.isArray(n.material)?n.material:[n.material]){for(const v of Object.values(m))if(v instanceof T.Texture)v.dispose();m.dispose();}}});}
}
