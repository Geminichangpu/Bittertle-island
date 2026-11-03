import * as T from 'three';
import type {Project} from '../data/model';
import {mainCoast,isLand} from '../terrain/terrain';
import type {Point} from '../data/model';
import type {UltraOcean} from './ultra-ocean';
import {useEnvironment} from './time-state';

/** Full-island coast-distance depth proxy, without reflection or a depth prepass. */
export class SampleWater {
 readonly material=new T.ShaderMaterial({fog:true,
  uniforms:T.UniformsUtils.merge([T.UniformsLib.fog,{nearColor:{value:new T.Color('#269fca')},farColor:{value:new T.Color('#0869a6')},detailStrength:{value:.035},depthMap:{value:null},sampleCenter:{value:new T.Vector2()},sampleExtent:{value:240},hasSample:{value:0},waveTime:{value:0},pilotCenter:{value:new T.Vector2()},pilotStrength:{value:1},ultraEnabled:{value:0},ultraSlope0:{value:null},ultraSlope1:{value:null},ultraSlope2:{value:null},ultraSun:{value:new T.Vector3(-.45,1,.4).normalize()},ultraSunColor:{value:new T.Color('#fff0d5')},ultraSunStrength:{value:1}}]),
  vertexShader:`#include <fog_pars_vertex>
   varying vec2 worldXZ;void main(){vec4 world=modelMatrix*vec4(position,1.0);worldXZ=world.xz;vec4 mvPosition=viewMatrix*world;gl_Position=projectionMatrix*mvPosition;
   #include <fog_vertex>
   }`,
  fragmentShader:`#include <fog_pars_fragment>
   varying vec2 worldXZ;uniform vec3 nearColor;uniform vec3 farColor;uniform float detailStrength;uniform sampler2D depthMap;uniform vec2 sampleCenter;uniform float sampleExtent;uniform float hasSample;uniform float waveTime;uniform vec2 pilotCenter;uniform float pilotStrength;uniform float ultraEnabled;uniform sampler2D ultraSlope0;uniform sampler2D ultraSlope1;uniform sampler2D ultraSlope2;uniform vec3 ultraSun;uniform vec3 ultraSunColor;uniform float ultraSunStrength;
   void main(){
    vec2 uv=(worldXZ-sampleCenter)/sampleExtent+.5;
    float coastalDepth=texture2D(depthMap,clamp(uv,0.0,1.0)).r*64.0;
    float depth=1.0-exp(-coastalDepth*.052);
    float patches=sin(worldXZ.x*.018+sin(worldXZ.y*.025))*sin(worldXZ.y*.021)*detailStrength*.25;
    float ripple=sin(worldXZ.x*.8+worldXZ.y*.31-waveTime*.7)*sin(worldXZ.y*1.1-worldXZ.x*.23+waveTime*.46);
    float shore=(1.0-smoothstep(.7,3.2,coastalDepth));
    float broken=smoothstep(.62,.86,.5+.5*sin(worldXZ.x*.19+sin(worldXZ.y*.12))*sin(worldXZ.y*.31));
    float foam=pow(.5+.5*sin(coastalDepth*3.2-waveTime*.6+sin(worldXZ.x*.4+worldXZ.y*.3)),10.0)*shore*broken*.11;
    float fine=1.0-smoothstep(.15,.8,max(length(dFdx(worldXZ)),length(dFdy(worldXZ))));
    vec3 color=mix(nearColor*vec3(.81,1.08,.98),farColor,depth)+patches+ripple*.003*fine;
    color=mix(color,vec3(.77,.91,.85),foam);
    // A restrained shallows finish only around the existing shrine/coast pilot.
    // Set pilotStrength to zero to restore the original water appearance.
    float pilot=(1.0-smoothstep(75.0,115.0,length(worldXZ-pilotCenter)))*pilotStrength;
    float shallow=(1.0-smoothstep(2.0,18.0,coastalDepth))*pilot;
    float wash=sin(worldXZ.x*.23+sin(worldXZ.y*.11)*1.7+waveTime*.16)*sin(worldXZ.y*.19-worldXZ.x*.07-waveTime*.12);
    color=mix(color,color*vec3(.91,1.035,.99)+vec3(.016,.025,.012),shallow*.38);
    color+=wash*shallow*.025;
    float glint=pow(max(0.0,.5+.5*sin(worldXZ.x*.35+worldXZ.y*.22+wash*1.4-waveTime*.35)),8.0);
    color+=vec3(.045,.055,.045)*glint*shallow*fine;
    if(ultraEnabled>.5){
      // FFT slope maps come from Ultra-Water OceanSim; the two shoreline
      // trains adapt its shoreWaves wavelength/dispersion and crest profile
      // to this island's coast-distance proxy instead of its bathymetry map.
      float pixelSize=max(length(dFdx(worldXZ)),length(dFdy(worldXZ)));
      float nearDetail=1.0-smoothstep(.6,3.0,pixelSize);
      vec2 slope=texture2D(ultraSlope0,worldXZ/600.0).xy*.5+texture2D(ultraSlope1,worldXZ/85.0).xy*mix(.3,1.0,nearDetail)+texture2D(ultraSlope2,worldXZ/12.0).xy*.45*nearDetail;
      vec3 n=normalize(vec3(-slope.x*1.8,1.0,-slope.y*1.8));
      float sun=pow(max(dot(n,normalize(ultraSun)),0.0),48.0);
      float swell=clamp(dot(slope,vec2(.55,.32)),-.3,.3);
      color=color*(1.0+swell*.7)+ultraSunColor*sun*.22*ultraSunStrength*mix(.3,1.0,nearDetail);
      float surf=1.0-smoothstep(1.0,15.0,coastalDepth);
      float phase=coastalDepth*.65-waveTime*1.15+sin(worldXZ.x*.07+worldXZ.y*.05)*.7;
      float crest=pow(max(.5+.5*cos(phase),0.0),3.0);
      float breakup=smoothstep(.12,.75,.5+.5*sin(worldXZ.x*.19+sin(worldXZ.y*.15))*sin(worldXZ.y*.23));
      color=mix(color,vec3(.78,.91,.88),surf*crest*breakup*.58);
    }
    gl_FragColor=vec4(color,1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>
   }`
 });
 readonly mesh=new T.Mesh(new T.PlaneGeometry(2400,2400),this.material);
 private depth?:T.DataTexture;private signature='';private center=new T.Vector2();private coasts:Point[][]=[];
 private animated=false;private visible=true;private nearby=false;private disposed=false;private ultraWanted=false;private reflectionWanted=false;private ultra?:UltraOcean;private ultraLoading?:Promise<boolean>;private lastTick=0;private camera?:T.Camera;private project:Project;
 private timer:ReturnType<typeof setTimeout>|undefined;
 private motion=matchMedia('(prefers-reduced-motion: reduce)');
 constructor(project:Project,private request:()=>void,private renderer:T.WebGLRenderer){this.project=project;this.material.userData.sea=true;this.mesh.name='全岛真实岸线深浅水';this.mesh.rotation.x=-Math.PI/2;this.mesh.position.y=-.12;this.setProject(project);this.motion.addEventListener('change',this.motionChanged);}
 setProject(p:Project){
  this.project=p;
  const shrine=p.groups?.find(g=>g.id==='shrine_group');this.material.uniforms.pilotCenter.value.set(shrine?.position[0]??139,shrine?.position[2]??-21);
  const signature=JSON.stringify([p.terrain.outer,p.terrain.bay,p.terrain.islet,p.terrain.topology]);if(signature===this.signature)return;this.signature=signature;
  if(this.ultra){this.ultra.dispose();this.ultra=undefined;this.mesh.visible=true;if(this.ultraWanted)void this.setUltra(true);}
  this.coasts=[mainCoast(p.terrain),p.terrain.islet];const bounds=new T.Box2();for(const loop of this.coasts)for(const q of loop)bounds.expandByPoint(new T.Vector2(...q));bounds.getCenter(this.center);const size=bounds.getSize(new T.Vector2()),extent=Math.max(size.x,size.y)+144;this.material.uniforms.sampleCenter.value.copy(this.center);this.material.uniforms.sampleExtent.value=extent;this.material.uniforms.hasSample.value=1;
  const n=256,bytes=new Uint8Array(n*n*4);
  for(let z=0;z<n;z++)for(let x=0;x<n;x++){const wx=this.center.x+((x+.5)/n-.5)*extent,wz=this.center.y+((z+.5)/n-.5)*extent,d=isLand(p.terrain,wx,wz)?0:Math.min(1,this.coastDistance(wx,wz)/64),i=(z*n+x)*4;bytes.set([Math.round(d*255),0,0,255],i);}
  this.depth?.dispose();this.depth=new T.DataTexture(bytes,n,n);this.depth.magFilter=this.depth.minFilter=T.LinearFilter;this.depth.needsUpdate=true;this.material.uniforms.depthMap.value=this.depth;
 }
 private coastDistance(x:number,z:number){let best=Infinity;for(const loop of this.coasts)for(let i=0;i<loop.length;i++){const a=loop[i],b=loop[(i+1)%loop.length],dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1)));best=Math.min(best,(x-a[0]-dx*t)**2+(z-a[1]-dz*t)**2);}return Math.sqrt(best);}
 setView(camera:T.Camera,target:T.Vector3){this.camera=camera;const close=camera instanceof T.OrthographicCamera?camera.zoom>1.15:camera.position.distanceTo(target)<230;const nearby=close&&this.coastDistance(target.x,target.z)<100;this.ultra?.setCamera(camera,nearby);if(nearby!==this.nearby){this.nearby=nearby;this.restart();}}
 setReflection(value:boolean){this.reflectionWanted=value;this.ultra?.setReflection(value);this.request();}
 invalidateReflection(){this.ultra?.invalidateReflection();}
 beforeDraw(scene:T.Scene,camera:T.Camera,hidden:T.Object3D[]){if(!this.ultraWanted||!this.ultra)return;try{this.ultra.beforeDraw(scene,camera,hidden);}catch(error){console.error('近岸倒影不可用',error);this.setReflection(false);useEnvironment.getState().setWaterReflection(false);this.renderer.domElement.dispatchEvent(new CustomEvent('scene-error',{bubbles:true,detail:'近岸倒影不可用，已关闭倒影。'}));}}
 setAnimated(value:boolean){this.animated=value;this.material.uniforms.waveTime.value=0;this.restart();this.request();}
 async setUltra(value:boolean):Promise<boolean>{this.ultraWanted=value;if(!value){this.material.uniforms.ultraEnabled.value=0;this.mesh.visible=true;if(this.ultra)this.ultra.mesh.visible=false;this.request();return true;}
  if(this.ultraLoading){const ok=await this.ultraLoading;if(!ok||!this.ultraWanted||this.disposed)return ok;if(!this.ultra)return this.setUltra(true);this.bindUltra();this.mesh.visible=false;this.ultra.mesh.visible=true;this.request();return true;}
  const load=(async()=>{try{if(!this.ultra){const {UltraOcean}=await import('./ultra-ocean');if(this.disposed||!this.ultraWanted)return true;this.ultra=new UltraOcean(this.renderer,this.project,this.material.uniforms);if(this.camera)this.ultra.setCamera(this.camera,this.nearby);this.ultra.setReflection(this.reflectionWanted);this.ultra.update(0.05);this.mesh.parent?.add(this.ultra.mesh);}
   if(!this.ultraWanted||this.disposed)return true;this.bindUltra();this.mesh.visible=false;this.ultra.mesh.visible=true;this.request();return true;
  }catch(error){this.ultraWanted=false;this.material.uniforms.ultraEnabled.value=0;this.ultra?.dispose();this.ultra=undefined;this.mesh.visible=true;console.error('水面效果初始化失败，已回退原水面',error);return false;}})();
  this.ultraLoading=load.finally(()=>{this.ultraLoading=undefined;});return this.ultraLoading;}
 private bindUltra(){if(!this.ultra)return;const u=this.material.uniforms,s=this.ultra.slope;u.ultraSlope0.value=s[0];u.ultraSlope1.value=s[1];u.ultraSlope2.value=s[2];u.ultraEnabled.value=1;}
 setVisible(value:boolean){if(value!==this.visible){this.visible=value;this.restart();}}
 get running(){return this.animated&&this.visible&&!this.motion.matches&&!this.disposed;}
 private motionChanged=()=>this.restart();
 private restart(){clearTimeout(this.timer);this.timer=undefined;this.lastTick=0;if(this.running)this.tick();}
 private tick=()=>{if(!this.running)return;const now=performance.now();this.material.uniforms.waveTime.value=now/1000;if(this.ultraWanted&&this.ultra){try{this.ultra.update(this.lastTick?Math.min(.1,(now-this.lastTick)/1000):.05);this.bindUltra();}catch(error){console.error('水面效果更新失败，已回退原水面',error);this.ultra.dispose();this.ultra=undefined;this.ultraWanted=false;this.material.uniforms.ultraEnabled.value=0;this.mesh.visible=true;useEnvironment.getState().setWaterEffect(false);this.renderer.domElement.dispatchEvent(new CustomEvent('scene-error',{bubbles:true,detail:'水面效果运行失败，已回退原水面。'}));}}this.lastTick=now;this.request();if(this.running)this.timer=setTimeout(this.tick,50);};
 dispose(){this.disposed=true;clearTimeout(this.timer);this.motion.removeEventListener('change',this.motionChanged);this.ultra?.dispose();this.depth?.dispose();this.material.dispose();this.mesh.geometry.dispose();this.mesh.removeFromParent();}
}
