import * as T from 'three';
import type {IslandObject} from '../data/model.ts';
import {Builder,type Cache} from './shrine.ts';
import {slateRoof,crate,paneFrame} from './details.ts';
type V=[number,number,number];
/** M2 static structures: closed roofs, joinery, counters, glazing and repeated detail batches. */
export function makeLayoutBuilding(o:IslandObject,cache:Cache){
 const b=new Builder(cache),{width:w,depth:d,wallHeight:h,wallColor:wall,roofColor:roof}=o.params;
 const wood='#705438',stone='#a6a290',red='#b85e45',green='#79994e';
 const disc=(p:V,r:number,height:number,color:string,top=r)=>b.emit('layout:cylinder:'+top/r,()=>new T.CylinderGeometry(top/r,1,1,16),color,p,[r,height,r]);
 const cone=(p:V,r:number,height:number,color:string,sides=8)=>b.emit('layout:cone:'+sides,()=>new T.ConeGeometry(1,1,sides),color,p,[r,height,r]);
 const gable=(p:V,width:number,depth:number,rise:number,color:string)=>b.emit('layout:gable',()=>{const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([-1,0,-1,1,0,-1,0,1,-1,-1,0,1,1,0,1,0,1,1],3));g.setIndex([0,2,1,3,4,5,0,3,5,0,5,2,1,2,5,1,5,4,0,1,4,0,4,3]);g.computeVertexNormals();return g;},color,p,[width/2,rise,depth/2]);
 if(o.templateId==='layout_lighthouse'){
  disc([0,.35,0],w*.65,.7,stone);disc([0,.8,0],w*.53,.3,'#829a64');
  for(let i=0;i<4;i++)disc([0,1+h*.085+i*h*.17,0],w*(.27-i*.025),h*.17,i%2?red:wall,w*(.245-i*.025));
  const lamp=1+h*.68+.25;disc([0,lamp,0],w*.34,.55,stone);b.emit('layout:cylinder:1',()=>new T.CylinderGeometry(1,1,1,16),'#a3bdad',[0,lamp+2,0],[w*.22,3,w*.22],new T.Quaternion(),cache.mat('#a3bdad','lamp'));
  for(let i=0;i<8;i++){const a=i*Math.PI/4,c=(i+1)*Math.PI/4,x=Math.cos(a),z=Math.sin(a);b.cylinder([x*w*.24,lamp+.2,z*w*.24],[x*w*.24,lamp+3.6,z*w*.24],.1,wood);b.cylinder([x*w*.33,lamp+.3,z*w*.33],[x*w*.33,lamp+1.2,z*w*.33],.055,wood);b.beam([x*w*.33,lamp+1.2,z*w*.33],[Math.cos(c)*w*.33,lamp+1.2,Math.sin(c)*w*.33],.06,wood);}
  disc([0,lamp+3.6,0],w*.31,.3,red);cone([0,lamp+4.7,0],w*.35,2,roof);b.ball([0,lamp+5.8,0],[.35,.35,.35],red);
  b.box([0,2.1,w*.27],[1.6,2.7,.15],wood);for(let i=0;i<3;i++){const t=.25+i*.18;b.litBox([0,1+h*t,w*(.27-.1*t/.68)],[.8,1.3,.15],'#47646a');}
  for(let i=0;i<4;i++)b.box([0,.2+i*.2,w*.5-i*.35],[2.1,.3,1],stone);
  // Masonry courses, cornices, arched door surround and segmented lantern glazing.
  for(let row=0;row<18;row++){const y=1+row*h*.038,r=w*(.27-(y-1)/(h*.68)*.1)+.015;for(let i=0;i<20;i++){const a=(i+(row%2)*.5)*Math.PI/10;b.cylinder([Math.cos(a)*r,y,Math.sin(a)*r],[Math.cos(a+.28)*r,y,Math.sin(a+.28)*r],.018,'#b8ad91',5);}}
  for(let i=1;i<=4;i++)disc([0,1+i*h*.17,0],w*(.27-i*.025)+.08,.15,stone);
  b.scoped([0,2.1,w*.27+.1],0,()=>{paneFrame(b,1.6,2.7,0,stone);for(let i=0;i<6;i++)b.box([-.7+i*.28,0,.1],[.035,2.45,.05],'#ae8c57');b.ball([.5,0,.18],[.07,.07,.06],'#c5a06d');});
  for(let i=0;i<8;i++){const a=i*Math.PI/4;for(const y of [lamp+1,lamp+2.6])b.beam([Math.cos(a)*w*.24,y,Math.sin(a)*w*.24],[Math.cos(a+Math.PI/4)*w*.24,y,Math.sin(a+Math.PI/4)*w*.24],.065,wood);b.beam([Math.cos(a)*w*.31,lamp+3.8,Math.sin(a)*w*.31],[0,lamp+5.7,0],.065,'#cf8960');}
  b.litBall([0,lamp+2,0],[.5,.75,.5],'#f3dda2');
 }else if(o.templateId==='layout_shopping'){
  b.box([0,.25,0],[w+2,.5,d+2],stone);b.box([0,.55,0],[w*.3,.1,d],'#cfb98c');
  for(const side of [-1,1])for(let i=0;i<3;i++){
   const x=side*w*.35,z=-d*.32+i*d*.32,ww=w*.28,dd=d*.3;
   b.box([x,h/2+.5,z],[ww,h,dd],wall);gable([x,h+.5,z],ww,dd,1.15,wall);slateRoof(b,[x,h+.5,z],dd+.5,ww+1,1.4,'#65766b',Math.PI/2);
   b.scoped([x-side*ww/2,h*.48,z],side<0?Math.PI/2:-Math.PI/2,()=>{b.lattice(0,0,.1,dd*.73,h*.6);b.box([0,h*.42,.5],[dd*.9,.35,1.2],i%2?'#688e70':'#b57549');});
   b.litBox([x,h*.7,z+dd/2+.1],[ww*.6,1.5,.15],'#5b7778');
   for(const sx of [-1,1])for(const sz of [-1,1])b.box([x+sx*ww/2,h/2+.5,z+sz*dd/2],[.18,h,.18],wood);
   b.scoped([x-side*ww/2,0,z],side<0?Math.PI/2:-Math.PI/2,()=>{
    for(let k=0;k<7;k++)b.box([-dd*.4+k*dd*.133,.95,.5],[dd*.12,1.6,.22],k%2?wood:'#96744b');
    b.box([0,1.8,.65],[dd*.85,.18,1.1],'#af8c58');
    for(const x of [-dd*.33,dd*.33]){crate(b,x,1.9,.65,dd*.24,.65);for(let k=0;k<3;k++)b.ball([x-.35+k*.35,2.65,.65],[.16,.22,.16],i%2?'#bd8d52':'#819858');}
    for(let k=0;k<6;k++)b.box([-dd*.4+k*dd*.16,h*.92,.55],[dd*.14,.25,1.3],k%2?'#bda577':'#758f78');
   });
  }
  // Barrel arcade roof over the central pedestrian aisle.
  const r=w*.21,y=h+1;
  b.emit('layout:arcade',()=>new T.CylinderGeometry(1,1,1,16,1,true,0,Math.PI).rotateZ(Math.PI/2).rotateY(Math.PI/2),roof,[0,y,0],[r,r,d*.98]);
  for(let k=0;k<6;k++){const z=-d*.49+k*d*.98/5;for(let j=0;j<12;j++){const a=j*Math.PI/12,c=(j+1)*Math.PI/12;b.beam([Math.cos(a)*r,y+Math.sin(a)*r,z],[Math.cos(c)*r,y+Math.sin(c)*r,z],.13,wood);}for(const side of [-1,1])b.box([side*r,y/2,z],[.22,y,.22],wood);}
  for(let i=0;i<Math.ceil(d/1.2);i++)for(let j=0;j<4;j++)b.box([-w*.135+j*w*.09,.63,-d*.48+i*1.2],[w*.085,.08,1.13],(i+j)%2?'#c8bca1':'#b4ac99');
  for(const x of [-r*.5,0,r*.5])b.box([x,y+Math.sqrt(r*r-x*x)+.025,0],[.07,.07,d*.98],wood);
  for(const z of [-d*.4,0,d*.4]){b.cylinder([0,y+r,z],[0,y+r-.6,z],.025,wood,5);b.litBall([0,y+r-.85,z],[.22,.3,.22],'#edcea0');}
 }else if(o.templateId==='layout_market'){
  b.box([0,.2,0],[w,.4,d],'#b4b18c');
  for(const side of [-1,1])for(let i=0;i<2;i++){
   const x=side*w*.32,z=-d*.24+i*d*.48,sw=w*.28,sd=d*.35;
   b.box([x,1,z],[sw,1.4,sd],wall);for(const sx of [-1,1])for(const sz of [-1,1])b.box([x+sx*sw*.46,h*.52,z+sz*sd*.46],[.18,h,.18],wood);
   gable([x,h,z],sw,sd,1.35,wall);for(let j=0;j<5;j++)b.box([x-sw*.4+j*sw*.2,h+.02,z+sd*.5],[.09,.09,.7],wood);
   slateRoof(b,[x,h,z],sd+1,sw+1,1.6,roof,Math.PI/2);
   for(let k=0;k<8;k++)b.box([x-sw*.45+k*sw*.128,1,z+sd/2+.06],[sw*.11,1.2,.08],k%2?'#b28b51':wood);
   b.box([x,1.77,z+sd*.32],[sw+.25,.14,sd*.5],wood);
   for(let k=0;k<3;k++)crate(b,x-sw*.31+k*sw*.31,1.85,z+sd*.32,sw*.27,sd*.35);
   crate(b,x-side*sw*.35,.4,z-sd*.25,sw*.4,sd*.35);
   for(const sx of [-1,1])b.beam([x+sx*sw*.46,h-1,z+sd*.46],[x+sx*sw*.2,h,z+sd*.46],.13,wood);
   for(let k=0;k<6;k++)b.ball([x-sw*.35+k*sw*.14,2.6,z+sd*.32],[.38,.32,.38],k%2?'#94a75e':'#d89e45');
   b.box([x-side*sw*.43,2,z],[.3,2.6,sd*.85],i%2?'#709886':'#708d9d');
  }
  // Peripheral planting pockets keep the entire palm crown outside the stall eaves.
  for(const side of [-1,1]){const x=side*(w/2+4.2),z=-d*.4;b.box([side*(w/2+2.4),.2,z],[5.6,.4,4.0],stone);disc([x,.52,z],1.0,.25,'#8d9e62');b.cylinder([x,.4,z],[x-.6,9,z],.3,wood);for(let j=0;j<7;j++){const a=j*Math.PI*2/7;b.scoped([x-.6,9,z],a,()=>{
   b.emit('layout:palm-leaf',()=>{const v:number[]=[],idx:number[]=[];for(let k=0;k<=8;k++){const u=k/8,width=Math.sin(Math.PI*u)*.47,y=.55*Math.sin(Math.PI*u)-u*u;v.push(u*3,y,-width,u*3,y+.08,0,u*3,y,width);}for(let k=0;k<8;k++){const n=k*3;idx.push(n,n+3,n+1,n+1,n+3,n+4,n+1,n+4,n+2,n+2,n+4,n+5,n+1,n+3,n,n+4,n+3,n+1,n+2,n+4,n+1,n+5,n+4,n+2);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setIndex(idx);g.computeVertexNormals();return g;},green,[0,0,0]);
   for(let k=0;k<5;k++){const u=k/5,v=(k+1)/5;b.cylinder([u*3,.55*Math.sin(Math.PI*u)-u*u+.08,0],[v*3,.55*Math.sin(Math.PI*v)-v*v+.08,0],.025,'#a2b366',5);}
  });}}
  b.beam([-(w/2+4.2)-.44,7,-d*.4],[(w/2+4.2)-.44,7,-d*.4],.04,wood);for(let k=0;k<8;k++){b.emit('layout:flag',()=>{const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([-.5,0,0,0,-1,0,.5,0,0],3));g.computeVertexNormals();return g;},k%2?'#bc755e':'#d8b76b',[-w*.35+k*w*.1,7,-d*.4]);}
  for(let i=0;i<10;i++)for(let j=0;j<10;j++)b.box([-w/2+(i+.5)*w/10,.43,-d/2+(j+.5)*d/10],[w/10-.08,.06,d/10-.08],(i+j)%3?'#c4bc98':'#b4ab8b');
 }else{
  disc([0,.2,0],w*.46,.4,'#8d9e62');disc([0,h*.32,0],w*.12,h*.64,wall,w*.075);
  // Keep the crown; the radial slanted timbers around the trunk base were removed.
  for(let i=0;i<7;i++){const a=i*Math.PI*2/7;b.ball([Math.cos(a)*w*.3,h*.94+(i%2)*1.3,Math.sin(a)*w*.3],[w*.24,h*.14,d*.23],i%2?'#6c9647':'#91ab53');}
  const y=h*.55;b.box([0,y,1],[w*.63,.4,d*.53],wood);b.box([0,y+2,0],[w*.38,4,d*.32],wall);gable([0,y+4,0],w*.38,d*.32,1.65,wall);b.lattice(0,y+2,d*.16+.1,w*.23,2.4);
  slateRoof(b,[0,y+4,0],d*.42,w*.46,2,roof,Math.PI/2);
  for(let i=0;i<18;i++)b.box([-w*.3+i*w*.6/17,y+.23,1],[w*.6/18-.035,.06,d*.52],i%2?wood:'#927247');
  for(const side of [-1,1]){
   for(let i=0;i<8;i++)b.box([side*w*.192,y+2,-d*.15+i*d*.3/7],[.08,3.9,.045],wood);
   for(let i=0;i<5;i++)b.box([side*w*.31,y+.9,-d*.18+i*d*.12],[.14,1.6,.14],wood);
   for(const yy of [.45,1.55])b.box([side*w*.31,y+yy,d*.06],[.13,.13,d*.48],wood);
  }
  b.scoped([0,y+2,d*.16+.25],0,()=>paneFrame(b,w*.23,2.4,0));
  for(let i=0;i<18;i++){const a=i*2.4,r=w*.095;b.beam([Math.cos(a)*r,h*.08,Math.sin(a)*r],[Math.cos(a)*r*.83,h*.48,Math.sin(a)*r*.83],.045,'#735335');}
  for(let i=0;i<21;i++){const a=i*2.4,rr=w*(.18+(i%3)*.065);b.ball([Math.cos(a)*rr,h*.94+(i%4)*.52,Math.sin(a)*rr],[w*.12,h*.08,d*.12],['#6d934a','#86a653','#a6b960'][i%3]);}
  // Story reference: no stairs or ladder; keep the treehouse deck and its front rail.
  for(let k=0;k<6;k++)b.box([-w*.3+k*w*.12,y+.9,d*.32],[.13,1.6,.13],wood);
  for(const yy of [.45,1.55])b.box([0,y+yy,d*.32],[w*.62,.12,.12],wood);
 }
 return b.finish();
}
