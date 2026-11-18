import {Builder,type Cache} from './shrine.ts';
import type {IslandObject} from '../data/model.ts';

/** Static east-facing timber footbridge, with independently grounded shore ends. */
export function makeBridge(o:IslandObject,cache:Cache){
 const b=new Builder(cache),{width:w,depth:d,wallColor:_wood,roofColor:_trim}=o.params;
 const wood='#c3cdd1',trim='#e2e8e9';
 const rise=o.params.bridgeEndHeight||0,steps=Math.ceil(w/.65);
 const height=(u:number)=>rise*u+Math.sin(Math.PI*u)*1.5;
 for(let i=0;i<steps;i++){
  const u=(i+.5)/steps,x=(u-.5)*w,y=height(u);
  b.box([x,y-.12,0],[w/steps+.015,.24,d],i%3?wood:trim);
 }
 const spans=Math.ceil(w/3);
 for(const side of [-1,1])for(let i=0;i<=spans;i++){
  const u=i/spans,x=(u-.5)*w,y=height(u),z=side*d*.48;
  b.box([x,y+.6,z],[.18,1.5,.18],trim);
  b.box([x,y+1.38,z],[.26,.09,.26],'#8a9c9e');
  b.cylinder([x,y+1.423,z],[x,y+1.457,z],.059,'#aab4ab',12);
  for(const bolt of [.5,1.2]){
   const face=z+side*.093;
   b.cylinder([x,y+bolt,face],[x,y+bolt,face+side*.015],.029,'#697a7a',6);
  }
  if(i<spans){
   const v=(i+1)/spans,xx=(v-.5)*w,yy=height(v);
   b.beam([x,y-.34,z*.53],[xx,yy-.34,z*.53],.23,'#95a4a3');
   b.box([x,y-.32,z*.53],[.36,.17,.25],'#798880');
   if(i%2===0)b.beam([x,y-.34,-d*.40],[x,y-.34,d*.40],.19,'#909f9b');
   for(const dx of [-.072,.072])b.cylinder([x+dx,y-.28,z+side*.093],[x+dx,y-.28,z+side*.13],.026,'#697772',6);
  }
  if(i<spans&&i%3===0){
   const v=(i+1)/spans;
   b.beam([x,y-1.55,z],[(v-.5)*w,height(v)-.43,z],.16,'#899a9e');
  }
  if(i<spans){const v=(i+1)/spans,xx=(v-.5)*w,yy=height(v);for(const h of [.5,1.2,-.4])b.beam([x,y+h,z],[xx,yy+h,z],h<0?.28:.13,trim);}
  if(i%3===0){const bottom=-o.position[1]-.7;b.box([x,(y+bottom)/2,z],[.38,y-bottom,.38],trim);}
 }
 return b.finish();
}
