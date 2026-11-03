import * as T from 'three';
import type {Project} from '../data/model';
import {coastDistance,isLand} from '../terrain/terrain';

/** Coast-distance depth proxy: the project has no underwater bathymetry.
 * One 128² mask, one shader pass, no reflection camera/depth prepass. */
export class SampleWater {
 readonly material=new T.ShaderMaterial({fog:true,
  uniforms:T.UniformsUtils.merge([T.UniformsLib.fog,{nearColor:{value:new T.Color('#269fca')},farColor:{value:new T.Color('#0869a6')},detailStrength:{value:.035},depthMap:{value:null},sampleCenter:{value:new T.Vector2()},sampleExtent:{value:240},hasSample:{value:0},waveTime:{value:0}}]),
  vertexShader:`#include <fog_pars_vertex>
   varying vec2 worldXZ;void main(){vec4 world=modelMatrix*vec4(position,1.0);worldXZ=world.xz;vec4 mvPosition=viewMatrix*world;gl_Position=projectionMatrix*mvPosition;
   #include <fog_vertex>
   }`,
  fragmentShader:`#include <fog_pars_fragment>
   varying vec2 worldXZ;uniform vec3 nearColor;uniform vec3 farColor;uniform float detailStrength;uniform sampler2D depthMap;uniform vec2 sampleCenter;uniform float sampleExtent;uniform float hasSample;uniform float waveTime;
   void main(){
    vec2 uv=(worldXZ-sampleCenter)/sampleExtent+.5;
    float region=(1.0-smoothstep(.25,1.0,length((uv-.5)*2.0)))*hasSample;
    float coastalDepth=texture2D(depthMap,clamp(uv,0.0,1.0)).r;
    float oldDepth=clamp(length(worldXZ)/650.0,0.0,1.0);
    float depth=mix(oldDepth,smoothstep(0.0,.86,coastalDepth),region);
    float patches=(sin(worldXZ.x*.018+sin(worldXZ.y*.025))*sin(worldXZ.y*.021)+.24*sin(worldXZ.x*.21+worldXZ.y*.13)*sin(worldXZ.y*.17-worldXZ.x*.09))*detailStrength;
    float ripple=sin(worldXZ.x*.8+worldXZ.y*.31-waveTime*.7)*sin(worldXZ.y*1.1-worldXZ.x*.23+waveTime*.46);
    float shore=(1.0-smoothstep(.012,.11,coastalDepth))*region;
    float foam=pow(.5+.5*sin(coastalDepth*180.0-waveTime*.6+sin(worldXZ.x*.4+worldXZ.y*.3)),12.0)*shore*.12;
    vec3 color=mix(nearColor,farColor,depth)+patches*mix(1.0,.35,region)+ripple*.004*region;
    color=mix(color,vec3(.77,.91,.85),foam);
    gl_FragColor=vec4(color,1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>
   }`
 });
 readonly mesh=new T.Mesh(new T.PlaneGeometry(2400,2400),this.material);
 private depth?:T.DataTexture;private signature='';private center=new T.Vector2();
 private animated=false;private visible=true;private nearby=false;private disposed=false;
 private timer:ReturnType<typeof setTimeout>|undefined;
 private motion=matchMedia('(prefers-reduced-motion: reduce)');
 constructor(project:Project,private request:()=>void){this.material.userData.sea=true;this.mesh.name='海面（神社样板深浅水）';this.mesh.rotation.x=-Math.PI/2;this.mesh.position.y=-.12;this.setProject(project);this.motion.addEventListener('change',this.motionChanged);}
 setProject(p:Project){
  const group=p.groups?.find(g=>g.id==='shrine_group'),signature=JSON.stringify([p.terrain.outer,p.terrain.bay,p.terrain.islet,p.terrain.topology,group?.position]);if(signature===this.signature)return;this.signature=signature;
  this.center.set(group?.position[0]??0,group?.position[2]??0);this.material.uniforms.sampleCenter.value.copy(this.center);this.material.uniforms.hasSample.value=group?1:0;
  const n=128,bytes=new Uint8Array(n*n*4),extent=this.material.uniforms.sampleExtent.value;
  for(let z=0;z<n;z++)for(let x=0;x<n;x++){const wx=this.center.x+((x+.5)/n-.5)*extent,wz=this.center.y+((z+.5)/n-.5)*extent,d=isLand(p.terrain,wx,wz)?0:Math.min(1,coastDistance(p.terrain,[wx,wz])/48),i=(z*n+x)*4;bytes.set([Math.round(d*255),0,0,255],i);}
  this.depth?.dispose();this.depth=new T.DataTexture(bytes,n,n);this.depth.magFilter=this.depth.minFilter=T.LinearFilter;this.depth.needsUpdate=true;this.material.uniforms.depthMap.value=this.depth;
 }
 setView(camera:T.Camera,target:T.Vector3){const close=camera instanceof T.OrthographicCamera?camera.zoom>1.15:camera.position.distanceTo(target)<230;const nearby=close&&Math.hypot(target.x-this.center.x,target.z-this.center.y)<115;if(nearby!==this.nearby){this.nearby=nearby;this.restart();}}
 setAnimated(value:boolean){this.animated=value;this.material.uniforms.waveTime.value=0;this.restart();this.request();}
 setVisible(value:boolean){if(value!==this.visible){this.visible=value;this.restart();}}
 get running(){return this.animated&&this.visible&&this.nearby&&!this.motion.matches&&!this.disposed;}
 private motionChanged=()=>this.restart();
 private restart(){clearTimeout(this.timer);this.timer=undefined;if(this.running)this.tick();}
 private tick=()=>{if(!this.running)return;this.material.uniforms.waveTime.value=performance.now()/1000;this.request();this.timer=setTimeout(this.tick,50);};
 dispose(){this.disposed=true;clearTimeout(this.timer);this.motion.removeEventListener('change',this.motionChanged);this.depth?.dispose();this.material.dispose();this.mesh.geometry.dispose();this.mesh.removeFromParent();}
}
