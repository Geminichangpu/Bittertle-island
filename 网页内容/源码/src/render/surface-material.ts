import * as T from 'three';

/** Shared procedural finish. No textures, external assets, animation or vertex displacement. */
export function surfaceMaterial(color:string,kind:'building'|'nature'='building'){
 const c=new T.Color(color),hsl={h:0,s:0,l:0};c.getHSL(hsl,T.SRGBColorSpace);
 const cool=hsl.h>.43&&hsl.h<.65&&hsl.s>.15;
 const gold=hsl.h>.09&&hsl.h<.16&&hsl.s>.42;
 const wood=hsl.h>.035&&hsl.h<.14&&hsl.s>.20&&!gold;
 const m=new T.MeshStandardMaterial({color:c,roughness:kind==='nature'?.96:cool?.38:gold?.48:wood?.88:.78,metalness:kind==='nature'?0:gold?.32:cool?.12:0,flatShading:kind==='building'});
 m.onBeforeCompile=shader=>{
  shader.uniforms.surfaceGrain={value:kind==='nature'?.018:wood?.045:.024};
  shader.uniforms.surfaceWood={value:kind==='building'&&wood?1:0};
  shader.vertexShader='varying vec3 finishPosition;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
   vec4 finishWorld=vec4(transformed,1.0);
   #ifdef USE_INSTANCING
    finishWorld=instanceMatrix*finishWorld;
   #endif
   finishPosition=(modelMatrix*finishWorld).xyz;`);
  shader.fragmentShader='varying vec3 finishPosition;\nuniform float surfaceGrain;\nuniform float surfaceWood;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   float finishNoise=sin(dot(finishPosition,vec3(51.7,63.1,37.4)))*sin(dot(finishPosition,vec3(29.1,43.3,57.8)));
   float finishLines=sin(finishPosition.y*43.0+sin(finishPosition.x*2.7+finishPosition.z*2.3)*2.0);
   diffuseColor.rgb*=1.0+surfaceGrain*mix(finishNoise,finishLines,surfaceWood);`);
 };
 m.customProgramCacheKey=()=>`island-finish-${kind}-${wood?'wood':'mineral'}`;
 return m;
}
