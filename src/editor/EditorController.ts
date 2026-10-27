import * as T from 'three';
import {TransformControls} from 'three/addons/controls/TransformControls.js';
import {SceneController} from '../scene/SceneController';
import type {Project} from '../data/model';
import {sampleHeight} from '../terrain/terrain';
import {TerrainInteraction} from './TerrainInteraction';
export class EditorController extends SceneController {
 transform:TransformControls;selectedId:string|null=null;box:T.BoxHelper|null=null;readOnly=false;terrainTool:TerrainInteraction;contours=new T.Group();
 onSelect:(id:string|null)=>void=()=>{};onTransform:(id:string,position:number[],rotation:number[],scale:number[])=>void=()=>{};
 private down=[0,0];private moved=false;
 constructor(host:HTMLElement,project:Project){super(host,project);this.transform=new TransformControls(this.camera,this.renderer.domElement);this.transform.setSize(.8);this.scene.add(this.transform.getHelper());
  this.transform.addEventListener('dragging-changed',e=>{this.controls.enabled=!e.value;this.moved=true;});
  this.transform.addEventListener('objectChange',()=>{const mesh=this.transform.object;if(mesh){this.box?.update();}this.updateLabelPositions();this.invalidateShadows();this.requestRender();});
  this.transform.addEventListener('mouseUp',()=>{const mesh=this.transform.object;if(mesh&&this.selectedId)this.onTransform(this.selectedId,mesh.position.toArray(),[mesh.rotation.x,mesh.rotation.y,mesh.rotation.z],mesh.scale.toArray());});
  this.renderer.domElement.addEventListener('pointerdown',this.pointerDown);this.renderer.domElement.addEventListener('pointerup',this.pointerUp);this.terrainTool=new TerrainInteraction(this);this.scene.add(this.contours);
 }
 pointerDown=(e:PointerEvent)=>{this.down=[e.clientX,e.clientY];this.moved=false;};
 pointerUp=(e:PointerEvent)=>{if(e.button!==0||this.moved||Math.hypot(e.clientX-this.down[0],e.clientY-this.down[1])>5||this.transform.axis)return;const r=this.renderer.domElement.getBoundingClientRect(),ray=new T.Raycaster();ray.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),this.camera);const hit=ray.intersectObjects([...this.objects.children,...this.labels.children],true)[0];this.onSelect(hit?.object.userData.objectId||hit?.object.userData.markerId||null);};
 select(id:string|null){this.selectedId=id;this.transform.detach();if(this.box){this.scene.remove(this.box);this.box.geometry.dispose();(this.box.material as T.Material).dispose();this.box=null;}const mesh=this.node(id);if(mesh&&!this.readOnly){this.box=new T.BoxHelper(mesh,'#fff4b2');this.scene.add(this.box);if(!this.project.objects.find(o=>o.id===id)?.locked)this.transform.attach(mesh);}this.requestRender();}
 setMode(mode:'translate'|'rotate'|'scale'){this.transform.setMode(mode);this.requestRender();}
 showContours(kind:'outer'|'bay'|'islet'|null,index=0){this.contours.traverse(n=>{if(n instanceof T.Mesh||n instanceof T.Line){n.geometry.dispose();(n.material as T.Material).dispose();}});this.contours.clear();if(kind){const points=this.project.terrain[kind].map(p=>new T.Vector3(p[0],2,p[1]));const LineType=this.project.terrain.topology==='open-bay'&&kind!=='islet'?T.Line:T.LineLoop;const line=new LineType(new T.BufferGeometry().setFromPoints(points),new T.LineBasicMaterial({color:'#447fa0',depthTest:false}));line.renderOrder=15;this.contours.add(line);points.forEach((p,i)=>{const dot=new T.Mesh(new T.SphereGeometry(i===index?2.5:1.3,8,5),new T.MeshBasicMaterial({color:i===index?'#fff1a5':'#446f8c',depthTest:false}));dot.position.copy(p);dot.renderOrder=16;this.contours.add(dot);});}this.requestRender();}
 override draw(){this.terrainTool?.flush();super.draw();}
 override toggleProjection(){super.toggleProjection();if(this.transform)this.transform.camera=this.camera;if(this.terrainTool?.enabled)this.controls.enabled=false;}
 override setProject(p:Project){super.setProject(p);this.select(this.selectedId);}
 override capturePNG(longEdge=1920,hideLabels=true){return super.capturePNG(longEdge,hideLabels,[this.transform.getHelper(),this.contours,this.terrainTool.cursor,...(this.box?[this.box]:[])]);}
 override dispose(){this.showContours(null);this.terrainTool.dispose();this.transform.dispose();if(this.box){this.box.geometry.dispose();(this.box.material as T.Material).dispose();}this.renderer.domElement.removeEventListener('pointerdown',this.pointerDown);this.renderer.domElement.removeEventListener('pointerup',this.pointerUp);super.dispose();}
}
