import * as T from 'three';
import {TIME_PRESETS,type TimeMode} from './time-presets';
import {useEnvironment} from './time-state';
import type {SceneController} from '../scene/SceneController';
import {NightMeteors} from './NightMeteors';

/** Reuses the existing scene, sun and materials. Switching costs one requested frame. */
export class EnvironmentManager {
 readonly meteors:NightMeteors;
 mode:TimeMode=useEnvironment.getState().mode;
 readonly lamps=Array.from({length:6},()=>{const l=new T.PointLight('#ffb566',0,16,2);l.castShadow=false;return l;});
 private stop:()=>void;
 constructor(private owner:SceneController){
  this.meteors=new NightMeteors(owner.host);
  owner.scene.add(...this.lamps);this.apply(this.mode);owner.scheduler.setFrameLimit(useEnvironment.getState().fps);
  this.stop=useEnvironment.subscribe((s,old)=>{if(s.mode!==old.mode)this.apply(s.mode);if(s.fps!==old.fps)owner.scheduler.setFrameLimit(s.fps);});
 }
 apply(mode:TimeMode){
  this.mode=mode;const p=TIME_PRESETS[mode],s=this.owner;s.host.dataset.timeMode=mode;
  this.meteors.setNight(mode==='night');
  s.scene.background=new T.Color(p.sky);s.scene.fog=new T.Fog(p.fog,p.fogNear,p.fogFar);
  s.lighting.sun.color.set(p.sun);s.lighting.sun.intensity=p.sunIntensity;s.lighting.sun.position.fromArray(p.sunPosition);
  s.lighting.sky.color.set(p.ambient);s.lighting.sky.groundColor.set(p.ground);s.lighting.sky.intensity=p.ambientIntensity;s.renderer.toneMappingExposure=p.exposure;
  this.refresh();s.invalidateShadows();s.requestRender();
 }
 refresh(){
  const p=TIME_PRESETS[this.mode],materials=new Set<T.Material>();
  this.owner.scene.traverse(n=>{if(n instanceof T.Mesh)for(const m of Array.isArray(n.material)?n.material:[n.material])materials.add(m);});
  for(const m of materials){
   if(m instanceof T.MeshStandardMaterial&&m.userData.lightRole){const lamp=m.userData.lightRole==='lamp';m.emissive.set(lamp?p.lampColor:p.windowColor);m.emissiveIntensity=lamp?p.lampIntensity:p.windowIntensity;}
   if(m instanceof T.MeshBasicMaterial&&m.userData.shore)m.color.set(p.shoreTint);
   if(m instanceof T.ShaderMaterial&&m.userData.sea){m.uniforms.nearColor.value.set(p.seaNear);m.uniforms.farColor.value.set(p.seaFar);m.uniforms.detailStrength.value=p.seaDetail;}
  }
  this.updateLights();
 }
 updateLights(){
  const p=TIME_PRESETS[this.mode];this.lamps.forEach(l=>l.intensity=0);let slot=0;
  // Bounded local lighting. All other windows/lamps use instanced emissive surfaces.
  for(const id of ['shrine_court','shrine_garden','landmark_feihua','layout_lighthouse','layout_shopping']){
   const root=this.owner.node(id);if(!root)continue;root.updateWorldMatrix(true,true);let chosen:T.Mesh|undefined;
   root.traverse(n=>{if(!chosen&&n instanceof T.Mesh&&!Array.isArray(n.material)&&n.material.userData.lightRole==='lamp')chosen=n;});
   if(!chosen)continue;
   const count=id==='shrine_court'&&chosen instanceof T.InstancedMesh?Math.min(2,chosen.count):1;
   for(let i=0;i<count&&slot<this.lamps.length;i++){
    const l=this.lamps[slot++];chosen.geometry.computeBoundingBox();chosen.geometry.boundingBox!.getCenter(l.position);if(chosen instanceof T.InstancedMesh){const matrix=new T.Matrix4();chosen.getMatrixAt(i,matrix);l.position.applyMatrix4(matrix);}l.position.applyMatrix4(chosen.matrixWorld);l.position.y+=.25;l.color.set(p.lampColor);l.intensity=p.localIntensity;
   }
  }
 }
 dispose(){this.stop();this.meteors.dispose();this.lamps.forEach(l=>{l.removeFromParent();l.dispose();});}
}
