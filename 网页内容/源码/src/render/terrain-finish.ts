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
  this.neutral.needsUpdate=this.neutralNormal.needsUpdate=true;this.material.map=this.neutral;this.material.normalMap=this.neutralNormal;this.material.roughnessMap=this.neutral;this.material.name='沿海草甸、沙滩与露岩';
  this.material.customProgramCacheKey=()=> 'bittertle-ground-coastal-relief-v2';
  this.material.onBeforeCompile=shader=>{
   Object.assign(shader.uniforms,this.uniforms);
   shader.vertexShader='attribute float terrainShore; varying float vLandShore; varying vec3 vLandPosition;varying vec3 vLandNormal;\n'+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvLandPosition=(modelMatrix*vec4(transformed,1.)).xyz;vLandNormal=normalize(mat3(modelMatrix)*objectNormal);vLandShore=terrainShore;');
   shader.fragmentShader=`varying float vLandShore;varying vec3 vLandPosition;varying vec3 vLandNormal;
    uniform float landReady;uniform vec2 landCenter;uniform sampler2D landField;uniform sampler2D landSoil;uniform sampler2D landSoilNormal;uniform sampler2D landSoilRough;uniform sampler2D landRock;uniform sampler2D landRockNormal;uniform sampler2D landRockRough;uniform sampler2D landPeak;uniform sampler2D landPeakNormal;uniform sampler2D landPeakRough;
    float landRegion;float mountainRegion;float bedrockBlend;float landFine;float landSoilWeight;float landRockWeight;vec2 landUV;vec3 landAxis;
    float landHash(vec2 cell){vec3 p=fract(vec3(cell.xyx)*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
    float landNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(landHash(i),landHash(i+vec2(1,0)),f.x),mix(landHash(i+vec2(0,1)),landHash(i+vec2(1)),f.x),f.y);}
    vec3 triplanar(sampler2D tex,vec3 p,vec3 w){return texture2D(tex,p.zy*.18).rgb*w.x+texture2D(tex,p.xz*.18).rgb*w.y+texture2D(tex,p.xy*.18).rgb*w.z;}
    vec3 blendedBedrock(sampler2D coast,sampler2D ridge,vec3 p,vec3 w){
     if(bedrockBlend<=0.)return triplanar(coast,p,w);
     if(bedrockBlend>=1.)return triplanar(ridge,p,w);
     return mix(triplanar(coast,p,w),triplanar(ridge,p,w),bedrockBlend);
    }
    vec3 bedrockNormalAt(vec2 uv){
     if(bedrockBlend<=0.)return texture2D(landRockNormal,uv).xyz*2.-1.;
     if(bedrockBlend>=1.)return texture2D(landPeakNormal,uv).xyz*2.-1.;
     return mix(texture2D(landRockNormal,uv).xyz,texture2D(landPeakNormal,uv).xyz,bedrockBlend)*2.-1.;
    }
   `+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','');
   shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
    float slope=1.-abs(normalize(vLandNormal).y);
    float lowShore=(1.-smoothstep(1.,8.,vLandShore))*(1.-smoothstep(2.,6.,vLandPosition.y));
    landRegion=landReady*(.30+.63*smoothstep(.7,5.,vLandPosition.y))*(1.-.81*lowShore);
    mountainRegion=landReady*smoothstep(9.,32.,vLandPosition.y)*(.55+.45*smoothstep(.09,.30,slope));
    float footprint=max(length(dFdx(vLandPosition)),length(dFdy(vLandPosition)));
    landFine=1.-smoothstep(.09,.65,footprint);
    float macro=.60*landNoise(vLandPosition.xz*.036+vec2(5.2,-2.3))+.29*landNoise(vLandPosition.xz*.102)+.11*landNoise(vLandPosition.xz*.3);
    bedrockBlend=smoothstep(.15,.83,mountainRegion+(macro-.5)*.38);
    landUV=vLandPosition.xz*.18+vec2(sin(vLandPosition.z*.035),cos(vLandPosition.x*.04))*.2;
    vec2 fieldUV=(vLandPosition.xz-landCenter)/240.+.5;
    vec2 field=texture2D(landField,fieldUV).rg*float(all(greaterThanEqual(fieldUV,vec2(0.))) && all(lessThanEqual(fieldUV,vec2(1.))));
    landSoilWeight=clamp(max(field.r*.62,field.g*.38)+smoothstep(.52,.83,macro)*.23+smoothstep(.07,.36,slope)*.25,0.,.8);
    landRockWeight=smoothstep(.12,.46,slope+(macro-.5)*.20);
    float mountainStone=max(smoothstep(24.,44.,vLandPosition.y+(macro-.5)*15.),smoothstep(.17,.48,slope)*.82);
    float cover=smoothstep(.38,.70,macro)*(1.-smoothstep(.20,.53,slope));
    landRockWeight=mix(landRockWeight,mountainStone,mountainRegion)*(1.-.40*cover);
    landAxis=pow(abs(normalize(vLandNormal)),vec3(4.));landAxis/=max(dot(landAxis,vec3(1.)),.0001);
    if(landRegion>.001){
     vec3 grassA=texture2D(map,landUV).rgb,grassB=texture2D(map,mat2(.8,-.6,.6,.8)*landUV*.73+vec2(.37,.61)).rgb;
     vec3 grass=mix(diffuseColor.rgb,mix(grassA,grassB,macro)*vec3(.88,.99,.72),.19+landFine*.35)*(.84+macro*.28);
     vec3 soil=texture2D(landSoil,landUV*.72+vec2(.3)).rgb*vec3(.95,.82,.62);
     vec3 rock=blendedBedrock(landRock,landPeak,vLandPosition,landAxis)*vec3(.91,.94,.90);
     float granite=dot(rock,vec3(.2126,.7152,.0722));
     rock=mix(vec3(granite*.98,granite,granite*.96),rock,.57+.14*bedrockBlend);
     // Thin bedding follows height on exposed faces; flatter pockets retain moss.
     float strata=.5+.5*sin(vLandPosition.y*.34+vLandPosition.x*.065+sin(vLandPosition.z*.06)*1.2+macro*2.3);
     float moss=mountainRegion*(1.-smoothstep(.16,.46,slope))*(1.-smoothstep(28.,54.,vLandPosition.y))*(.08+.13*macro);
     rock*=mix(1.0,.87+.17*strata,max(mountainRegion,.5*smoothstep(.15,.4,slope)));
     rock=mix(rock,grass*vec3(.79,.91,.74),moss);
     diffuseColor.rgb=mix(diffuseColor.rgb,mix(mix(grass,soil,landSoilWeight),rock,landRockWeight),landRegion);
    }`);
   shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
    if(landRegion>.001){
     float grassRough=texture2D(roughnessMap,landUV).g,soilRough=texture2D(landSoilRough,landUV*.72+vec2(.3)).g;
     float rockRough=blendedBedrock(landRockRough,landPeakRough,vLandPosition,landAxis).g;
     roughnessFactor=mix(roughnessFactor,max(.68,mix(.92,mix(mix(grassRough,soilRough,landSoilWeight),rockRough,landRockWeight),landFine)),landRegion);
    }`);
   shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`
    if(landRegion>.001&&landFine>.01){
     vec3 gn=texture2D(normalMap,landUV).xyz*2.-1.,sn=texture2D(landSoilNormal,landUV*.72+vec2(.3)).xyz*2.-1.;
     vec3 nm=mix(gn,sn,landSoilWeight);nm.xy*=.36;vec3 groundNormal=normalize(tbn*nm);
     vec3 nx=bedrockNormalAt(vLandPosition.zy*.18),ny=bedrockNormalAt(vLandPosition.xz*.18),nz=bedrockNormalAt(vLandPosition.xy*.18);
     nx.xy*=.25;ny.xy*=.25;nz.xy*=.25;
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
