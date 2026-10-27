import * as T from 'three';

/** Small, room-owned procedural atlas set. No external images and no per-frame work. */
export function stylizedMaterials(extraWood:Record<string,string>={}){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const ctx=canvas.getContext('2d')!;
 const pixels=ctx.createImageData(256,256);
 for(let y=0;y<256;y++)for(let x=0;x<256;x++){
  const warp=7*Math.sin(y*Math.PI/128)+3*Math.sin(y*Math.PI/64+x*.025);
  const axis=x+warp+3*Math.sin(x*Math.PI/32);
  const grain=Math.sin(axis*Math.PI/16)+.25*Math.sin(axis*Math.PI/3);
  const v=237+grain*3+Math.sin(x*Math.PI/64)*3,i=(y*256+x)*4;pixels.data[i]=v;pixels.data[i+1]=v;pixels.data[i+2]=v;pixels.data[i+3]=255;
 }
 ctx.putImageData(pixels,0,0);const grain=new T.CanvasTexture(canvas);grain.colorSpace=T.SRGBColorSpace;grain.wrapS=grain.wrapT=T.RepeatWrapping;grain.anisotropy=4;
 const clothCanvas=document.createElement('canvas');clothCanvas.width=clothCanvas.height=64;const cc=clothCanvas.getContext('2d')!;cc.fillStyle='#f5f3ed';cc.fillRect(0,0,64,64);cc.strokeStyle='#dedbd2';cc.lineWidth=.6;for(let i=0;i<64;i+=4){cc.beginPath();cc.moveTo(i,0);cc.lineTo(i,64);cc.moveTo(0,i);cc.lineTo(64,i);cc.stroke();}const cloth=new T.CanvasTexture(clothCanvas);cloth.wrapS=cloth.wrapT=T.RepeatWrapping;cloth.repeat.set(3,3);cloth.colorSpace=T.SRGBColorSpace;
 const wood:Record<string,string>={'#916340':'#a48460','#493126':'#594733','#b58b5b':'#c2a47d','#ad8258':'#bca482','#b48a60':'#c4ae8e','#a77d54':'#b49a79','#6e402d':'#795943','#a88c60':'#a88c60','#b0a58c':'#aa9b80'};
 Object.assign(wood,extraWood);
 const covers=new Set(['#36576b','#64837a','#ad795a','#88708c','#d4c5aa','#786b59']);
 function configure(m:T.MeshStandardMaterial,color:string,role?:string){
  if(role)return;
  if(wood[color]){
   m.color.set(wood[color]);m.map=grain;m.bumpMap=grain;m.bumpScale=.002;m.roughness=color==='#b58b5b'?.5:color==='#493126'?.75:.65;
   // Grain follows the long axis of each instanced board, with scale in model units.
   m.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>',`#include <uv_vertex>
    vec3 boardScale=vec3(1.0);
    #ifdef USE_INSTANCING
      boardScale=vec3(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz),length(instanceMatrix[2].xyz));
    #endif
    vec3 bp=position*boardScale;vec3 bn=abs(normal);vec2 grainUV;
    if(boardScale.y>=boardScale.x && boardScale.y>=boardScale.z) grainUV=vec2(bn.z>bn.x?bp.x:bp.z,bp.y);
    else if(boardScale.x>=boardScale.z) grainUV=vec2(bn.y>bn.z?bp.z:bp.y,bp.x);
    else grainUV=vec2(bn.y>bn.x?bp.x:bp.y,bp.z);
    vMapUv=grainUV*vec2(1.4,.32);
    vBumpMapUv=vMapUv;
   `);};m.customProgramCacheKey=()=> 'bedroom-board-grain-v1';
  }else if(covers.has(color)||['#efeee7','#604575','#7d8171','#d5ceb4','#e7dec7','#b8ae7c','#d0c18b'].includes(color)){m.map=cloth;m.roughness=.91;}
  else if(['#79958d','#e4dfd2','#b9c8c2'].includes(color)){m.roughness=.25;m.metalness=.03;}
  else if(['#a58c5c','#b5aaa0','#8a897b','#9a9d96'].includes(color)){m.roughness=.32;m.metalness=.65;}
 }
 return {configure,dispose(){grain.dispose();cloth.dispose();}};
}
