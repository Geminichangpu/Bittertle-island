import * as T from 'three';
import type {Project} from '../data/model';
import type {Route} from '../environment/paths';
import type {createNatureMaterials} from '../environment/nature-materials';
import {pilotCenter} from '../environment/nature-pilot';

export function prepareTerrainUv(g:T.BufferGeometry){const pos=g.getAttribute('position'),uv=new Float32Array(pos.count*2);for(let i=0;i<pos.count;i++){uv[i*2]=pos.getX(i)*.18;uv[i*2+1]=pos.getZ(i)*.18;}g.setAttribute('uv',new T.BufferAttribute(uv,2));return g;}

/** One PBR material on the existing terrain. All image maps share the environment library. */
export class TerrainFinish {
 private neutral=new T.DataTexture(new Uint8Array([255,255,255,255]),1,1);
 private neutralNormal=new T.DataTexture(new Uint8Array([128,128,255,255]),1,1);
 private field?:T.CanvasTexture;
 readonly material=new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:.96});
 private uniforms={landReady:{value:0},landCenter:{value:new T.Vector2()},landField:{value:this.neutral as T.Texture},landSoil:{value:this.neutral as T.Texture},landSoilNormal:{value:this.neutralNormal as T.Texture},landSoilRough:{value:this.neutral as T.Texture},landRock:{value:this.neutral as T.Texture},landRockNormal:{value:this.neutralNormal as T.Texture},landRockRough:{value:this.neutral as T.Texture},landPeak:{value:this.neutral as T.Texture},landPeakNormal:{value:this.neutralNormal as T.Texture},landPeakRough:{value:this.neutral as T.Texture}};
 constructor(){
  this.neutral.needsUpdate=this.neutralNormal.needsUpdate=true;this.material.map=this.neutral;this.material.normalMap=this.neutralNormal;this.material.roughnessMap=this.neutral;this.material.name='样板草土碎石混合地表';
  this.material.customProgramCacheKey=()=> 'nature-pilot-ground-v2-mountain';
  this.material.onBeforeCompile=shader=>{
   Object.assign(shader.uniforms,this.uniforms);
   shader.vertexShader='varying vec3 vLandPosition;varying vec3 vLandNormal;\n'+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvLandPosition=(modelMatrix*vec4(transformed,1.)).xyz;vLandNormal=normalize(mat3(modelMatrix)*objectNormal);');
   shader.fragmentShader=`varying vec3 vLandPosition;varying vec3 vLandNormal;
    uniform float landReady;uniform vec2 landCenter;uniform sampler2D landField;uniform sampler2D landSoil;uniform sampler2D landSoilNormal;uniform sampler2D landSoilRough;uniform sampler2D landRock;uniform sampler2D landRockNormal;uniform sampler2D landRockRough;uniform sampler2D landPeak;uniform sampler2D landPeakNormal;uniform sampler2D landPeakRough;
    float landRegion;float mountainRegion;float landFine;float landSoilWeight;float landRockWeight;vec2 landUV;vec3 landAxis;
    vec3 triplanar(sampler2D tex,vec3 p,vec3 w){return texture2D(tex,p.zy*.18).rgb*w.x+texture2D(tex,p.xz*.18).rgb*w.y+texture2D(tex,p.xy*.18).rgb*w.z;}
   `+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','');
   shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
    landRegion=(1.-smoothstep(.72,1.,length((vLandPosition.xz-landCenter)/vec2(105.,120.))))*landReady*smoothstep(.8,2.8,vLandPosition.y);
    mountainRegion=(1.-smoothstep(.65,1.,length((vLandPosition.xz-vec2(-129.,21.))/vec2(38.,43.))))*smoothstep(6.,18.,vLandPosition.y)*landReady;
    landRegion=max(landRegion,mountainRegion);
    float footprint=max(length(dFdx(vLandPosition)),length(dFdy(vLandPosition)));
    landFine=1.-smoothstep(.09,.65,footprint);
    float macro=.5+.5*sin(vLandPosition.x*.09+sin(vLandPosition.z*.055)*1.7)*cos(vLandPosition.z*.075-vLandPosition.x*.025);
    landUV=vLandPosition.xz*.18+vec2(sin(vLandPosition.z*.035),cos(vLandPosition.x*.04))*.2;
    vec2 field=texture2D(landField,(vLandPosition.xz-landCenter)/240.+.5).rg;
    float slope=1.-abs(normalize(vLandNormal).y);
    landSoilWeight=clamp(max(field.r*.62,field.g*.38)+pow(macro,5.)*.2+smoothstep(.07,.36,slope)*.28,0.,.8);
    landRockWeight=smoothstep(.25,.64,slope);
    float mountainStone=max(smoothstep(24.,55.,vLandPosition.y+(macro-.5)*9.),smoothstep(.17,.48,slope)*.82);
    landRockWeight=mix(landRockWeight,mountainStone,mountainRegion);
    landAxis=pow(abs(normalize(vLandNormal)),vec3(4.));landAxis/=max(dot(landAxis,vec3(1.)),.0001);
    if(landRegion>.001){
     vec3 grassA=texture2D(map,landUV).rgb,grassB=texture2D(map,mat2(.8,-.6,.6,.8)*landUV*.73+vec2(.37,.61)).rgb;
     vec3 grass=mix(diffuseColor.rgb,mix(grassA,grassB,macro)*vec3(.77,1.,.64),.22+landFine*.35)*( .91+macro*.15);
     vec3 soil=texture2D(landSoil,landUV*.72+vec2(.3)).rgb*vec3(.95,.82,.62);
     vec3 rock=(mountainRegion>.001?triplanar(landPeak,vLandPosition,landAxis):triplanar(landRock,vLandPosition,landAxis))*vec3(.91,.92,.87);
     diffuseColor.rgb=mix(diffuseColor.rgb,mix(mix(grass,soil,landSoilWeight),rock,landRockWeight),landRegion);
    }`);
   shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
    if(landRegion>.001){
     float grassRough=texture2D(roughnessMap,landUV).g,soilRough=texture2D(landSoilRough,landUV*.72+vec2(.3)).g;
     float rockRough=mountainRegion>.001?triplanar(landPeakRough,vLandPosition,landAxis).g:triplanar(landRockRough,vLandPosition,landAxis).g;
     roughnessFactor=mix(roughnessFactor,max(.68,mix(.92,mix(mix(grassRough,soilRough,landSoilWeight),rockRough,landRockWeight),landFine)),landRegion);
    }`);
   shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`
    if(landRegion>.001&&landFine>.01){
     vec3 gn=texture2D(normalMap,landUV).xyz*2.-1.,sn=texture2D(landSoilNormal,landUV*.72+vec2(.3)).xyz*2.-1.;
     vec3 nm=mix(gn,sn,landSoilWeight);nm.xy*=.36;vec3 groundNormal=normalize(tbn*nm);
     vec3 nx=texture2D(landRockNormal,vLandPosition.zy*.18).xyz*2.-1.,ny=texture2D(landRockNormal,vLandPosition.xz*.18).xyz*2.-1.,nz=texture2D(landRockNormal,vLandPosition.xy*.18).xyz*2.-1.;nx.xy*=.28;ny.xy*=.28;nz.xy*=.28;
     if(mountainRegion>.001){nx=texture2D(landPeakNormal,vLandPosition.zy*.18).xyz*2.-1.;ny=texture2D(landPeakNormal,vLandPosition.xz*.18).xyz*2.-1.;nz=texture2D(landPeakNormal,vLandPosition.xy*.18).xyz*2.-1.;nx.xy*=.28;ny.xy*=.28;nz.xy*=.28;}
     vec3 rockNormal=normalize(getTangentFrame(-vViewPosition,normal,vLandPosition.zy*.18)*nx*landAxis.x+getTangentFrame(-vViewPosition,normal,vLandPosition.xz*.18)*ny*landAxis.y+getTangentFrame(-vViewPosition,normal,vLandPosition.xy*.18)*nz*landAxis.z);
     normal=normalize(mix(normal,mix(groundNormal,rockNormal,landRockWeight),landRegion*landFine));
    }`);
  };
 }
 setEnvironment(p:Project,library:ReturnType<typeof createNatureMaterials>,routes:Route[],roots:number[][]){
  const grass=library.material('coast-ground'),soil=library.material('gravel'),rock=library.material('cliff'),peak=library.material('rock');this.material.map=grass.map;this.material.normalMap=grass.normalMap;this.material.roughnessMap=grass.roughnessMap;
  this.uniforms.landPeak.value=peak.map!;this.uniforms.landPeakNormal.value=peak.normalMap!;this.uniforms.landPeakRough.value=peak.roughnessMap!;
  this.uniforms.landSoil.value=soil.map!;this.uniforms.landSoilNormal.value=soil.normalMap!;this.uniforms.landSoilRough.value=soil.roughnessMap!;this.uniforms.landRock.value=rock.map!;this.uniforms.landRockNormal.value=rock.normalMap!;this.uniforms.landRockRough.value=rock.roughnessMap!;this.uniforms.landCenter.value.copy(pilotCenter(p));this.uniforms.landReady.value=1;
  const n=512,canvas=document.createElement('canvas');canvas.width=canvas.height=n;const ctx=canvas.getContext('2d')!,c=pilotCenter(p),at=(x:number,z:number)=>[(x-c.x)/240*n+n/2,(z-c.y)/240*n+n/2];ctx.fillStyle='black';ctx.fillRect(0,0,n,n);
  ctx.strokeStyle='rgb(255,0,0)';ctx.lineCap=ctx.lineJoin='round';ctx.shadowColor='red';ctx.shadowBlur=2.5;
  for(const r of routes){if(r.status!=='connected'||!r.points.length)continue;ctx.lineWidth=(r.width+2.3)/240*n;ctx.beginPath();r.points.forEach(([x,z],i)=>{const [u,v]=at(x,z);if(i===0)ctx.moveTo(u,v);else ctx.lineTo(u,v);});ctx.stroke();}
  ctx.shadowBlur=0;for(const [x,,z] of roots){const [u,v]=at(x,z),r=1.25/240*n,gradient=ctx.createRadialGradient(u,v,0,u,v,r);gradient.addColorStop(0,'rgb(0,255,0)');gradient.addColorStop(1,'rgba(0,255,0,0)');ctx.fillStyle=gradient;ctx.fillRect(u-r,v-r,r*2,r*2);}
  this.field?.dispose();this.field=new T.CanvasTexture(canvas);this.field.flipY=false;this.field.generateMipmaps=false;this.field.minFilter=this.field.magFilter=T.LinearFilter;this.uniforms.landField.value=this.field;this.material.needsUpdate=true;
 }
 clearEnvironment(){this.field?.dispose();this.field=undefined;this.uniforms.landReady.value=0;this.uniforms.landField.value=this.neutral;this.material.map=this.neutral;this.material.normalMap=this.neutralNormal;this.material.roughnessMap=this.neutral;for(const key of ['landSoil','landRock','landPeak','landSoilRough','landRockRough','landPeakRough'] as const)this.uniforms[key].value=this.neutral;this.uniforms.landSoilNormal.value=this.uniforms.landRockNormal.value=this.uniforms.landPeakNormal.value=this.neutralNormal;this.material.needsUpdate=true;}
 dispose(){this.field?.dispose();this.neutral.dispose();this.neutralNormal.dispose();this.material.dispose();}
}
