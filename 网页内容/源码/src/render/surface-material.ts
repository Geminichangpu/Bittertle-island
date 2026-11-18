import * as T from 'three';

import timber from '../assets/textures/native-stock/timber.ts';
import plaster from '../assets/textures/native-stock/plaster.ts';
import fabric from '../assets/textures/native-stock/fabric.ts';

const stock={timber,plaster,fabric};
type Stock=keyof typeof stock;
const swatches=new Map<Stock,T.DataTexture>();
function swatch(kind:Stock){
 let texture=swatches.get(kind);
 if(!texture){
  const bytes=Uint8Array.from(atob(stock[kind]),v=>v.charCodeAt(0));
  texture=new T.DataTexture(bytes,128,128,T.RGFormat);
  texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.magFilter=T.LinearFilter;
  texture.minFilter=T.LinearMipmapLinearFilter;texture.generateMipmaps=true;
  texture.anisotropy=4;texture.needsUpdate=true;swatches.set(kind,texture);
 }
 return texture;
}
export function disposeSurfaceStock(){swatches.forEach(map=>map.dispose());swatches.clear();}

/** Project physical-scale grain onto native surfaces, including meshes without texture coordinates. */
export function surfaceMaterial(color:string,kind:'building'|'nature'='building'){
 const c=new T.Color(color),hsl={h:0,s:0,l:0};c.getHSL(hsl,T.SRGBColorSpace);
 const cool=hsl.h>.43&&hsl.h<.65&&hsl.s>.15;
 const gold=hsl.h>.09&&hsl.h<.16&&hsl.s>.42;
 const wood=hsl.h>.035&&hsl.h<.14&&hsl.s>.20&&!gold;
 const cloth=['#668998','#ede2c9','#f4f0df','#4489a7'].includes(color.toLowerCase());
 const stockKind:Stock=cloth?'fabric':wood?'timber':'plaster';
 const textured=kind==='building'||cloth;
 const m=new T.MeshStandardMaterial({color:c,roughness:kind==='nature'?.96:cool?.38:gold?.48:wood?.88:.78,metalness:kind==='nature'?0:gold?.32:cool?.12:0,flatShading:false});
 m.onBeforeCompile=shader=>{
  if(textured)shader.uniforms.stockMap={value:swatch(stockKind)};
  shader.uniforms.surfaceGrain={value:kind==='nature'?.018:wood?.045:.024};
  shader.uniforms.surfaceWood={value:kind==='building'&&wood?1:0};
  shader.vertexShader='varying vec3 stockPosition; varying vec3 finishPosition;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
   vec4 finishWorld=vec4(transformed,1.0);
   #ifdef USE_INSTANCING
    stockPosition=transformed*vec3(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz),length(instanceMatrix[2].xyz));
    stockPosition+=instanceMatrix[3].xyz*.37;
    finishWorld=instanceMatrix*finishWorld;
   #else
    stockPosition=transformed;
   #endif
   finishPosition=(modelMatrix*finishWorld).xyz;`);
  shader.fragmentShader=(textured?'uniform sampler2D stockMap;\n':'')+'varying vec3 stockPosition; varying vec3 finishPosition;\nuniform float surfaceGrain;\nuniform float surfaceWood;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   vec3 fp=finishPosition;
   float footprint=max(length(dFdx(fp)),length(dFdy(fp)));
   float nearGrain=1.0-smoothstep(.007,.04,footprint);
   float broad=sin(dot(fp,vec3(1.61,.63,2.04))+.8*sin(dot(fp,vec3(.53,2.8,.39))));
   float grainPhase=fp.y*58.0+fp.z*17.0+2.4*broad;
   float fibre=sin(grainPhase)+.31*sin(grainPhase*2.9);
   float mineral=sin(dot(fp,vec3(39.2,47.3,29.6)))*sin(dot(fp,vec3(19.7,31.7,43.1)));
   float finishDetail=mix(mineral,fibre,surfaceWood);
   ${textured?`
   vec3 face=abs(cross(dFdx(stockPosition),dFdy(stockPosition)));
   vec2 coords=face.y>max(face.x,face.z)?stockPosition.xz:face.x>face.z?stockPosition.zy:stockPosition.xy;
   vec2 finishUV=coords*${cloth?'2.8':wood?'1.05':'0.74'};
   vec2 stockSample=texture2D(stockMap,finishUV).rg-.5;
   diffuseColor.rgb*=1.0+stockSample.r*${cloth?'.32':wood?'.48':'.21'};
   `:''}
   diffuseColor.rgb*=1.0+surfaceGrain*(.38*broad+nearGrain*finishDetail);`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
   roughnessFactor=clamp(roughnessFactor+${textured?'stockSample.g*.24+':''}surfaceGrain*(.45*broad+nearGrain*finishDetail),.06,1.0);`);
  if(textured)shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
   vec3 dxView=dFdx(-vViewPosition),dyView=dFdy(-vViewPosition);
   vec3 r1=cross(dyView,normal),r2=cross(normal,dxView);
   float determinantStock=dot(dxView,r1);
   vec3 bumpStock=dFdx(stockSample.r)*r1+dFdy(stockSample.r)*r2;
   normal=normalize(max(abs(determinantStock),1.e-10)*normal-sign(determinantStock)*bumpStock*.0018);
  `);
 };
 m.customProgramCacheKey=()=>`island-finish-${kind}-${stockKind}`;
 return m;
}
