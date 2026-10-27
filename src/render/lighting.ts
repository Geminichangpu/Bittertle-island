import * as T from 'three';

/** Static daylight and a cached island-wide shadow map; camera changes reuse the map. */
export class IslandLighting {
 readonly sun=new T.DirectionalLight('#fff0d5',2.7);
 readonly sky=new T.HemisphereLight('#e9f4ff','#617660',1.5);
 shadowUpdates=0;
 private quality?:'low'|'standard';
 constructor(private renderer:T.WebGLRenderer,scene:T.Scene){
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;
  this.sun.position.set(-160,260,140);this.sun.castShadow=true;this.sun.shadow.autoUpdate=false;
  this.sun.shadow.bias=-.00035;this.sun.shadow.normalBias=.18;
  const cam=this.sun.shadow.camera;cam.left=-245;cam.right=245;cam.top=245;cam.bottom=-245;cam.near=10;cam.far=750;cam.updateProjectionMatrix();
  scene.add(this.sky,this.sun,this.sun.target);
 }
 setQuality(q:'low'|'standard'){
  if(q===this.quality)return false;this.quality=q;
  const size=Math.min(this.renderer.capabilities.maxTextureSize,q==='low'?1024:4096);
  this.sun.shadow.bias=q==='low'?-.0005:-.00035;
  this.sun.shadow.map?.dispose();this.sun.shadow.map=null;this.sun.shadow.mapSize.set(size,size);this.invalidate();return true;
 }
 invalidate(){this.renderer.shadowMap.needsUpdate=true;this.sun.shadow.needsUpdate=true;}
 beforeDraw(){if(this.renderer.shadowMap.needsUpdate)this.shadowUpdates++;}
 dispose(){this.sun.shadow.dispose();this.sun.removeFromParent();this.sun.target.removeFromParent();this.sky.removeFromParent();}
}

export function shadowSurfaces(root:T.Object3D){root.traverse(n=>{
 if(!(n instanceof T.Mesh))return;
 const materials=Array.isArray(n.material)?n.material:[n.material];
 if(materials.some(m=>m.transparent||m instanceof T.MeshBasicMaterial||m instanceof T.ShaderMaterial))return;
 n.receiveShadow=true;
 // Tiny grass blades and thin road ribbons only receive shadows; they need not populate the shadow pass.
 n.castShadow=n.geometry.userData.surfaceKind!=='grass'&&n.geometry.userData.surfaceKind!=='road';
});}
