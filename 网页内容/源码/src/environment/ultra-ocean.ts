import * as T from 'three';
import type {Project} from '../data/model';
import {coastDistance,isLand,mainCoast} from '../terrain/terrain';
import {Reflector} from 'three/addons/objects/Reflector.js';
// Original MIT-licensed Ultra-Water modules. See vendor/ultra-water/SOURCE.md.
// @ts-expect-error Upstream JavaScript has no type declarations.
import {OceanSim,defaultOceanParams} from '../vendor/ultra-water/water/OceanSim.js';
// @ts-expect-error Upstream JavaScript has no type declarations.
import {OceanSurface,WATER_GLSL} from '../vendor/ultra-water/water/OceanSurface.js';
// @ts-expect-error Upstream JavaScript has no type declarations.
import {bakeShoreMap} from '../vendor/ultra-water/water/shoreMap.js';

/** The island has no seabed: underwater heights are an approximate distance profile. */
export class UltraOcean {
 private sim:any;private surface:any;private shore:any;readonly mesh:T.Mesh;
 private material:T.ShaderMaterial;private camera?:T.Camera;private time=0;private reflector?:Reflector;private reflectionWanted=false;private nearby=false;private reflectionDirty=true;
 constructor(private renderer:T.WebGLRenderer,project:Project,colors:Record<string,T.IUniform>){
  const gl=renderer.getContext();if(!gl.getExtension('EXT_color_buffer_float')||!gl.getExtension('OES_texture_float_linear'))throw new Error('此设备不支持实验海浪所需的浮点纹理');
  const coast=[mainCoast(project.terrain),project.terrain.islet].flat();
  const extent=2*Math.max(...coast.flatMap(p=>[Math.abs(p[0]),Math.abs(p[1])]))+160;
  // 128² keeps first-use work bounded; no surveyed seabed is available.
  this.shore=bakeShoreMap((x:number,z:number)=>isLand(project.terrain,x,z)?1:-Math.max(.25,Math.min(18,coastDistance(project.terrain,[x,z])*.42)),extent,128);
  const previous=renderer.getRenderTarget();
  try{this.sim=new OceanSim(renderer,defaultOceanParams());}finally{renderer.setRenderTarget(previous);}
  this.surface=new OceanSurface(this.sim,this.shore,{cube:null,cubeSize:1,sunDir:new T.Vector3(),sunColor:new T.Color()},{});
  this.surface.material.dispose();
  const uniforms={...T.UniformsUtils.clone(T.UniformsLib.fog),...this.surface.uniforms,
   nearColor:colors.nearColor,farColor:colors.farColor,ultraSun:colors.ultraSun,ultraSunColor:colors.ultraSunColor,ultraSunStrength:colors.ultraSunStrength,
   islandReflection:{value:null},islandReflectionMatrix:{value:new T.Matrix4()},islandReflectionEnabled:{value:0}};
  this.material=new T.ShaderMaterial({glslVersion:T.GLSL3,fog:true,uniforms,side:T.DoubleSide,
   vertexShader:WATER_GLSL+`
    uniform float uGridScale; uniform float uCellStep;
    out vec2 vXZ; out vec3 vWorld;
    #include <fog_pars_vertex>
    void main(){
     vec2 local=position.xz;float r=length(local);float scale=r>6000.0?1.0:uGridScale;
     vec2 xz=cameraPosition.xz+local*scale;float cell=max(r,1.0)*uCellStep*scale;
     vec3 d=waterDisplacement(xz,log2(cell*N_TEX/uLength.xyz)+1.0);
     vec4 sh=shoreSample(xz);d.y=clamp(d.y,-1.0,.65);
     // Keep horizontal positions fixed over the approximate seabed so the
     // coarse shore field cannot fold the mesh into a visible seam.
     vXZ=xz;vWorld=vec3(xz.x,d.y-.12,xz.y);
     if(vWorld.y<-.12)vWorld.y=max(vWorld.y,min(sh.x+.04,-.12));
     vec4 mvPosition=viewMatrix*vec4(vWorld,1.0);gl_Position=projectionMatrix*mvPosition;
     #include <fog_vertex>
    }`,
   fragmentShader:WATER_GLSL+`
    in vec2 vXZ;in vec3 vWorld;out vec4 fragColor;
    #define gl_FragColor fragColor
    uniform vec3 nearColor,farColor,ultraSun,ultraSunColor;uniform float ultraSunStrength;uniform sampler2D islandReflection;uniform mat4 islandReflectionMatrix;uniform float islandReflectionEnabled;
    #include <fog_pars_fragment>
    void main(){
     vec4 sh=shoreSample(vXZ);float depth=max(0.0,-sh.x);float distance=max(sh.y,0.0);
     float fine=1.0-smoothstep(.6,3.0,max(length(dFdx(vXZ)),length(dFdy(vXZ))));
     vec2 slope=texture(uSlope0,vXZ/uLength.x).xy*.5+texture(uSlope1,vXZ/uLength.y).xy*mix(.3,1.0,fine)+texture(uSlope2,vXZ/uLength.z).xy*.45*fine;
     Shore shore=shoreWaves(vXZ,sh,max(length(dFdx(vXZ)),length(dFdy(vXZ))));slope+=shore.slope;
     vec3 n=normalize(vec3(-slope.x*1.8,1.0,-slope.y*1.8));
     float sun=pow(max(dot(n,normalize(ultraSun)),0.0),48.0);
     vec3 color=mix(nearColor*vec3(.81,1.08,.98),farColor,1.0-exp(-depth*.12));
     color*=1.0+clamp(dot(slope,vec2(.55,.32)),-.3,.3)*.7;
     color+=ultraSunColor*sun*.22*ultraSunStrength*mix(.3,1.0,fine);
     if(islandReflectionEnabled>.5){vec4 rp=islandReflectionMatrix*vec4(vWorld,1.0);vec2 uv=rp.xy/rp.w+slope*.002;if(rp.w>0.0&&all(greaterThan(uv,vec2(0.0)))&&all(lessThan(uv,vec2(1.0)))){float edge=smoothstep(0.0,.16,uv.x)*smoothstep(0.0,.16,uv.y)*smoothstep(0.0,.16,1.0-uv.x)*smoothstep(0.0,.16,1.0-uv.y);color=mix(color,texture(islandReflection,uv).rgb,.1*edge);}}
     float foam=clamp(shore.foam+shore.residual*.35,0.0,1.0)*(1.0-smoothstep(35.0,85.0,distance));
     color=mix(color,vec3(.78,.91,.88),foam*.8);
     gl_FragColor=vec4(color,1.0);
     #include <tonemapping_fragment>
     #include <colorspace_fragment>
     #include <fog_fragment>
    }`});
  this.mesh=this.surface.mesh;this.mesh.material=this.material;this.mesh.name='Ultra-Water 实验水面';
 }
 setCamera(camera:T.Camera,nearby:boolean){this.camera=camera;this.nearby=nearby;this.reflectionDirty=true;this.material.uniforms.islandReflectionEnabled.value=0;this.surface.update(camera,this.time);}
 setReflection(value:boolean){this.reflectionWanted=value;this.reflectionDirty=true;this.material.uniforms.islandReflectionEnabled.value=0;if(!value&&this.reflector){this.reflector.geometry.dispose();this.reflector.dispose();this.reflector=undefined;this.material.uniforms.islandReflection.value=null;}}
 invalidateReflection(){this.reflectionDirty=true;}
 beforeDraw(scene:T.Scene,camera:T.Camera,hidden:T.Object3D[]){
  if(!this.reflectionWanted||!this.nearby||!this.reflectionDirty)return;
  if(!this.reflector){this.reflector=new Reflector(new T.PlaneGeometry(1,1),{textureWidth:256,textureHeight:256,multisample:0});this.reflector.rotation.x=-Math.PI/2;this.reflector.position.y=-.12;this.reflector.updateMatrixWorld();}
  const visible=this.mesh.visible,states=hidden.map(x=>x.visible),target=this.renderer.getRenderTarget(),xr=this.renderer.xr.enabled,shadowAuto=this.renderer.shadowMap.autoUpdate;this.mesh.visible=false;hidden.forEach(x=>x.visible=false);
  try{this.reflector.onBeforeRender(this.renderer,scene,camera,this.reflector.geometry,this.reflector.material as T.Material,null as never);
   const m=this.reflector.material as T.ShaderMaterial;this.material.uniforms.islandReflection.value=this.reflector.getRenderTarget().texture;
   this.material.uniforms.islandReflectionMatrix.value.copy(m.uniforms.textureMatrix.value).multiply(this.reflector.matrixWorld.clone().invert());
   this.material.uniforms.islandReflectionEnabled.value=1;this.reflectionDirty=false;
  }finally{this.renderer.setRenderTarget(target);this.renderer.xr.enabled=xr;this.renderer.shadowMap.autoUpdate=shadowAuto;this.mesh.visible=visible;hidden.forEach((x,i)=>x.visible=states[i]);}
 }
 update(dt:number){const previous=this.renderer.getRenderTarget();try{this.sim.update(dt);}finally{this.renderer.setRenderTarget(previous);}this.time+=dt;if(this.camera)this.surface.update(this.camera,this.time);}
 get slope():T.Texture[]{return this.sim.slope;}
 dispose(){this.mesh.removeFromParent();this.reflector?.geometry.dispose();this.reflector?.dispose();this.material.dispose();this.surface.grids.forEach((g:T.BufferGeometry)=>g.dispose());for(const t of [this.shore.texture,this.shore.travel,this.shore.surf])t.dispose();const s=this.sim;for(const r of [s.h0RT,s.ping,s.pong,...s.out.flat()])r.dispose();for(const m of [s.initMat,s.evolveMat,s.fftMat,s.assembleMat])m.dispose();}
}
