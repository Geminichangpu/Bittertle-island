import * as T from 'three';
import type {Cache} from '../generators/shrine';

/** Quiet stone/cloth variation, shared per floor and released with that floor. */
export function modernMaterials(cache:Cache){
 const stoneCanvas=document.createElement('canvas');stoneCanvas.width=stoneCanvas.height=128;
 const ctx=stoneCanvas.getContext('2d')!,data=ctx.createImageData(128,128);
 for(let y=0;y<128;y++)for(let x=0;x<128;x++){
  const wave=Math.sin(x*.049+Math.sin(y*.049)*1.8),v=246+wave*3+Math.sin(x*.196+y*.098)*1.2,i=(y*128+x)*4;
  data.data[i]=v;data.data[i+1]=v;data.data[i+2]=v;data.data[i+3]=255;
 }
 ctx.putImageData(data,0,0);const stone=new T.CanvasTexture(stoneCanvas);stone.colorSpace=T.SRGBColorSpace;
 for(const color of ['#eef0f2','#e7e9ee','#dfe9f2']){const m=cache.mat(color);m.map=stone;m.roughness=color==='#e7e9ee'?.52:.34;}
 const c=document.createElement('canvas');c.width=c.height=64;const cc=c.getContext('2d')!;cc.fillStyle='#f5f5f5';cc.fillRect(0,0,64,64);cc.strokeStyle='#dedede';cc.lineWidth=.6;
 for(let i=0;i<64;i+=4){cc.beginPath();cc.moveTo(i,0);cc.lineTo(i,64);cc.moveTo(0,i);cc.lineTo(64,i);cc.stroke();}
 const cloth=new T.CanvasTexture(c);cloth.colorSpace=T.SRGBColorSpace;cloth.wrapS=cloth.wrapT=T.RepeatWrapping;cloth.repeat.set(4,4);
 for(const color of ['#873b51','#a6544a','#84acd9','#b87164','#e3cfc7','#e5e7e6','#9cbce0','#b6cce6']){const m=cache.mat(color);m.map=cloth;m.roughness=.91;m.metalness=0;}
 return {dispose(){stone.dispose();cloth.dispose();}};
}
