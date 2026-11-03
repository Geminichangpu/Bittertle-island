import * as T from 'three';
import type {Project} from '../data/model';
import {mainCoast,isLand} from '../terrain/terrain';
import type {Point} from '../data/model';

/** Full-island coast-distance depth proxy, without reflection or a depth prepass. */
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
    gl_FragColor=vec4(color,1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>
   }`
 });
 readonly mesh=new T.Mesh(new T.PlaneGeometry(2400,2400),this.material);
 private depth?:T.DataTexture;private signature='';private center=new T.Vector2();private coasts:Point[][]=[];
 private animated=false;private visible=true;private nearby=false;private disposed=false;
 private timer:ReturnType<typeof setTimeout>|undefined;
 private motion=matchMedia('(prefers-reduced-motion: reduce)');
 constructor(project:Project,private request:()=>void){this.material.userData.sea=true;this.mesh.name='全岛真实岸线深浅水';this.mesh.rotation.x=-Math.PI/2;this.mesh.position.y=-.12;this.setProject(project);this.motion.addEventListener('change',this.motionChanged);}
 setProject(p:Project){
  const signature=JSON.stringify([p.terrain.outer,p.terrain.bay,p.terrain.islet,p.terrain.topology]);if(signature===this.signature)return;this.signature=signature;
  this.coasts=[mainCoast(p.terrain),p.terrain.islet];const bounds=new T.Box2();for(const loop of this.coasts)for(const q of loop)bounds.expandByPoint(new T.Vector2(...q));bounds.getCenter(this.center);const size=bounds.getSize(new T.Vector2()),extent=Math.max(size.x,size.y)+144;this.material.uniforms.sampleCenter.value.copy(this.center);this.material.uniforms.sampleExtent.value=extent;this.material.uniforms.hasSample.value=1;
  const n=256,bytes=new Uint8Array(n*n*4);
  for(let z=0;z<n;z++)for(let x=0;x<n;x++){const wx=this.center.x+((x+.5)/n-.5)*extent,wz=this.center.y+((z+.5)/n-.5)*extent,d=isLand(p.terrain,wx,wz)?0:Math.min(1,this.coastDistance(wx,wz)/64),i=(z*n+x)*4;bytes.set([Math.round(d*255),0,0,255],i);}
  this.depth?.dispose();this.depth=new T.DataTexture(bytes,n,n);this.depth.magFilter=this.depth.minFilter=T.LinearFilter;this.depth.needsUpdate=true;this.material.uniforms.depthMap.value=this.depth;
 }
 private coastDistance(x:number,z:number){let best=Infinity;for(const loop of this.coasts)for(let i=0;i<loop.length;i++){const a=loop[i],b=loop[(i+1)%loop.length],dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1)));best=Math.min(best,(x-a[0]-dx*t)**2+(z-a[1]-dz*t)**2);}return Math.sqrt(best);}
 setView(camera:T.Camera,target:T.Vector3){const close=camera instanceof T.OrthographicCamera?camera.zoom>1.15:camera.position.distanceTo(target)<230;const nearby=close&&this.coastDistance(target.x,target.z)<100;if(nearby!==this.nearby){this.nearby=nearby;this.restart();}}
 setAnimated(value:boolean){this.animated=value;this.material.uniforms.waveTime.value=0;this.restart();this.request();}
 setVisible(value:boolean){if(value!==this.visible){this.visible=value;this.restart();}}
 get running(){return this.animated&&this.visible&&this.nearby&&!this.motion.matches&&!this.disposed;}
 private motionChanged=()=>this.restart();
 private restart(){clearTimeout(this.timer);this.timer=undefined;if(this.running)this.tick();}
 private tick=()=>{if(!this.running)return;this.material.uniforms.waveTime.value=performance.now()/1000;this.request();this.timer=setTimeout(this.tick,50);};
 dispose(){this.disposed=true;clearTimeout(this.timer);this.motion.removeEventListener('change',this.motionChanged);this.depth?.dispose();this.material.dispose();this.mesh.geometry.dispose();this.mesh.removeFromParent();}
}
