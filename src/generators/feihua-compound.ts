import * as T from 'three';
import type {IslandObject} from '../data/model';
import {Builder,type Cache} from './shrine.ts';

type V=[number,number,number];
const timber='#70513b',red='#aa5145',stone='#a5a08e',cap='#d6c7a7';

/** Exterior-only additions. +Z is the existing main entrance; -X is the reference's annex. */
export function makeFeihuaPart(o:IslandObject,cache:Cache){
 const {width:w,depth:d,wallHeight:h,wallColor:wall,roofColor:roof}=o.params;
 const deck=2.3,left=-w*1.26,right=w*.66,back=-d*1.8,front=d*1.005;
 const root=new T.Group();root.name='绯华楼 · 共用高台与副楼温泉';
 const terrace=new Builder(cache),annex=new Builder(cache),spa=new Builder(cache),bridge=new Builder(cache);
 function rail(b:Builder,a:V,c:V){
  const length=Math.hypot(c[0]-a[0],c[2]-a[2]),count=Math.max(1,Math.ceil(length/1.8));
  for(let i=0;i<=count;i++){
   const t=i/count,x=a[0]+(c[0]-a[0])*t,y=a[1]+(c[1]-a[1])*t,z=a[2]+(c[2]-a[2])*t;
   b.box([x,y+.70,z],[.19,1.4,.19],red);b.box([x,y+1.43,z],[.30,.12,.30],timber);b.ball([x,y+1.57,z],[.15,.15,.15],'#474a49');
  }
  for(const y of [.36,.88,1.3])b.beam([a[0],a[1]+y,a[2]],[c[0],c[1]+y,c[2]],.11,red);
 }
 function lantern(b:Builder,x:number,y:number,z:number){
  b.cylinder([x,y+.5,z],[x,y+.85,z],.03,timber,6);
  b.litBall([x,y,z],[.27,.43,.27],'#bd5147');
  for(const dy of [-.4,.4])b.box([x,y+dy,z],[.27,.10,.27],timber);
 }

 if(o.templateId==='feihua_terrace'){
 // One continuous terrace under both buildings, the front court and rear bath garden.
 const base=-2.1,thickness=deck-base,centerX=(left+right)/2,centerZ=(back+front)/2;
 terrace.box([centerX,base+thickness/2,centerZ],[right-left,thickness,front-back],'#85867c');
 terrace.box([centerX,deck+.08,centerZ],[right-left+.12,.16,front-back+.12],cap);
 function wallFace(x:number,z:number,length:number,angle:number){
  terrace.scoped([x,0,z],angle,()=>{
   const rows=4,rowHeight=thickness/rows,cell=1.85;
   for(let row=0;row<rows;row++)for(let i=0;i<Math.ceil(length/cell)+1;i++){
    const start=Math.max(-length/2,-length/2+(i-(row%2)*.5)*cell),end=Math.min(length/2,-length/2+(i+1-(row%2)*.5)*cell);
    if(end-start<.15)continue;
    const variant=(i+row*3)%4;
    terrace.emit('feihua:rubble:'+variant,()=>{
     const s=new T.Shape();s.moveTo(-.48,-.45);s.lineTo(.35,-.49);s.lineTo(.49,-.26);s.lineTo(.46,.31);s.lineTo(.13+variant*.035,.49);s.lineTo(-.46,.38);s.closePath();
     return new T.ExtrudeGeometry(s,{depth:.065,bevelEnabled:false});
    },['#aaa591','#b9ae97','#93968a','#c2b79f'][variant],[(start+end)/2,base+(row+.5)*rowHeight,.035],[end-start-.035,rowHeight-.025,1]);
   }
   terrace.box([0,deck-.06,.02],[length+.1,.20,.38],'#ddd0b2');
  });
 }
 wallFace(centerX,front,right-left,0);wallFace(centerX,back,right-left,Math.PI);
 wallFace(left,centerZ,front-back,-Math.PI/2);wallFace(right,centerZ,front-back,Math.PI/2);
 // Front rail has one deliberate opening, aligned to the existing main entrance and island path.
 const bridgeHalf=2.2;
 rail(terrace,[left+.25,deck+.16,front-.2],[-bridgeHalf-.15,deck+.16,front-.2]);
 rail(terrace,[bridgeHalf+.15,deck+.16,front-.2],[right-.25,deck+.16,front-.2]);
 rail(terrace,[left+.25,deck+.16,back+.25],[left+.25,deck+.16,front-.2]);
 rail(terrace,[right-.25,deck+.16,back+.25],[right-.25,deck+.16,front-.2]);
 rail(terrace,[left+.25,deck+.16,back+.25],[right-.25,deck+.16,back+.25]);
 // Broad forecourt ties the two entrances together at the same deck height.
 const courtZ=d*.75;
 for(let i=0;i<14;i++)terrace.box([left+2+(right-left-4)*i/13,deck+.175,courtZ],[2.2,.03,2.0],i%3?'#d9c9a6':'#ccbc9b');
 // Stepping stones lead from the rear of the annex to its bath garden gate.
 for(let i=0;i<5;i++)terrace.box([-w*.91,deck+.19,-d*.38-i*d*.075],[1.8,.05,1.05],i%2?'#b7b19e':'#c6bfa9');
 for(const x of [-w*.68,-w*.37,w*.43]){
  terrace.box([x,deck+.45,d*.78],[2.1,.56,1.5],timber);
  terrace.cylinder([x,deck+.7,d*.78],[x+.25,deck+2,d*.78],.12,timber);
  for(let k=0;k<4;k++)terrace.ball([x+Math.cos(k*2.4)*.6,deck+1.8+k*.18,d*.78+Math.sin(k*2.4)*.4],[.85,.45,.65],k%2?'#6c895a':'#89985b');
 }
 }
 if(o.templateId==='feihua_bridge'){
 // Level suspended span, continuous stringers and hangers; no staircase or ground props.
 const bridgeStart=front-.16,bridgeEnd=front+d*1.35,startY=deck+.15,endY=startY,planks=34,bridgeHalf=2.2;
 for(let i=0;i<planks;i++){
  const t=i/(planks-1);bridge.box([0,startY-.09,bridgeStart+(bridgeEnd-bridgeStart)*t],[bridgeHalf*2,.18,(bridgeEnd-bridgeStart)/(planks-1)+.03],i%2?'#b49368':'#c5a373');
 }
 for(const side of [-1,1]){
  rail(bridge,[side*bridgeHalf,startY,bridgeStart],[side*bridgeHalf,endY,bridgeEnd]);
  bridge.beam([side*(bridgeHalf-.45),startY-.32,bridgeStart],[side*(bridgeHalf-.45),endY-.32,bridgeEnd],.32,timber);
  for(const z of [bridgeStart+.5,bridgeEnd-.5])bridge.box([side*bridgeHalf,startY+1.25,z],[.33,2.5,.33],red);
  for(let i=0;i<16;i++){
   const t=i/15,z=bridgeStart+(bridgeEnd-bridgeStart)*t,next=bridgeStart+(bridgeEnd-bridgeStart)*(i+1)/15,y=startY+2.6-.8*Math.sin(Math.PI*t);
   bridge.cylinder([side*bridgeHalf,startY+1.45,z],[side*bridgeHalf,y,z],.025,'#5f5547',5);
   if(i<15)bridge.cylinder([side*bridgeHalf,y,z],[side*bridgeHalf,startY+2.6-.8*Math.sin(Math.PI*(i+1)/15),next],.045,'#5f5547',6);
  }
 }
 }

 // Low annex with twin front-facing gables, front veranda and lantern eaves.
 if(o.templateId==='feihua_annex'){
 const ax=-w*.91,az=d*.02,aw=w*.48,ad=d*.72,ah=h*.25;
 annex.scoped([ax,deck+.16,az],0,()=>{
  annex.box([0,.17,0],[aw+1.2,.34,ad+1.2],stone);
  annex.box([0,ah/2+.34,0],[aw,ah,ad],wall);
  for(const x of [-aw/2,0,aw/2])for(const z of [-ad/2,ad/2])annex.box([x,ah/2+.34,z],[.22,ah,.22],timber);
  for(const z of [-ad/2-.05,ad/2+.05])for(const y of [.7,ah-.25])annex.box([0,y,z],[aw+.2,.19,.20],timber);
  annex.box([0,.36,ad/2+.9],[aw+1,.2,1.8],'#b3956b');
  for(let i=0;i<13;i++)annex.box([-aw/2+i*aw/12,.48,ad/2+.85],[aw/13-.025,.05,1.75],i%2?'#a7865c':'#b99b70');
  for(const side of [-1,1]){
   const x=side*aw*.25;
   annex.detailedRoof([x,ah+.34,0],ad+1.7,aw*.55+1,1.8,roof,Math.PI/2);
   annex.gable([x,ah+.34,ad/2+.22],aw*.48,aw*.55+1,1.8,wall,0);
   annex.beam([x-aw*.22,ah+.45,ad/2+.24],[x,ah+1.65,ad/2+.24],.16,timber);
   annex.beam([x,ah+1.65,ad/2+.24],[x+aw*.22,ah+.45,ad/2+.24],.16,timber);
   annex.lattice(x,ah*.56,ad/2+.13,aw*.37,ah*.63);
   annex.lattice(side*(aw/2+.13),ah*.56,0,ad*.55,ah*.58,side*Math.PI/2);
  }
  for(let i=0;i<5;i++){const x=-aw*.46+i*aw*.23;annex.box([x,ah*.52,ad/2+1.35],[.17,ah,.17],timber);lantern(annex,x,ah-.35,ad/2+1.45);}
  annex.box([0,ah+.01,ad/2+1.35],[aw+1,.22,.25],timber);
  for(let i=0;i<3;i++)annex.box([0,.10+i*.11,ad/2+2.5-i*.36],[aw*.32,.20,1],stone);
  for(const side of [-1,1])rail(annex,[side*aw*.20,.48,ad/2+1.65],[side*aw*.52,.48,ad/2+1.65]);
  annex.box([0,ah*.40,-ad/2-.10],[1.9,ah*.7,.13],timber);
 });
 }

 if(o.templateId==='feihua_onsen'){
 // The whole hot-spring yard is behind the annex, not behind the main hall.
 const px=-w*.91,pz=-d*1.18,rx=w*.22,rz=d*.29;
 spa.emit('feihua:pool-basin',()=>new T.CylinderGeometry(1,1,1,32),'#647d76',[px,deck+.13,pz],[rx+.5,.24,rz+.5]);
 spa.emit('feihua:pool-water',()=>new T.CircleGeometry(1,40).rotateX(-Math.PI/2),'#72b7b7',[px,deck+.27,pz],[rx,1,rz]);
 for(let i=0;i<27;i++){
  const a=i*Math.PI*2/27,v=1+.055*Math.sin(i*2.7);
  spa.ball([px+Math.cos(a)*rx*v,deck+.48+(i%3)*.10,pz+Math.sin(a)*rz*v],[.8+(i%3)*.15,.62+(i%2)*.15,.75+(i%4)*.10],['#9fa492','#b6b4a0','#888f81'][i%3]);
 }
 // Short pale ripple arcs read as water without an animated shader or additional lights.
 for(let i=0;i<5;i++)spa.emit('feihua:pool-ripple:'+i,()=>new T.TorusGeometry(1,.012,3,18,Math.PI*.7).rotateX(-Math.PI/2),'#a4d7cf',[px+(i%2?1.4:-1.1),deck+.285,pz+(i-2)*.8],[1.2+i*.22,1,.55+i*.12]);
 const outletX=px-1.2,outletZ=pz-rz+.3;
 for(let i=0;i<6;i++)spa.ball([outletX+Math.cos(i*2.2)*1.1,deck+.75+(i%3)*.5,outletZ-.3],[.9,.8,.7],i%2?stone:'#818e7f');
 spa.box([outletX,deck+1.65,outletZ+.25],[.85,.22,1.3],timber);
 for(let i=0;i<5;i++){const t=i/5,u=(i+1)/5;spa.beam([outletX,deck+1.58-1.25*t*t,outletZ+.8+t*.7],[outletX,deck+1.58-1.25*u*u,outletZ+.8+u*.7],.23,'#95cdc6');}
 const fenceLeft=px-w*.33,fenceRight=px+w*.60,fenceBack=-d*1.68,fenceFront=-d*.69;
 function fence(a:V,c:V){
  const n=Math.ceil(Math.hypot(c[0]-a[0],c[2]-a[2])/.32);
  for(let i=0;i<=n;i++){const t=i/n,x=a[0]+(c[0]-a[0])*t,z=a[2]+(c[2]-a[2])*t;spa.cylinder([x,deck+.17,z],[x,deck+3.1+(i%3)*.05,z],.14,i%3?'#a38a50':'#b49b5f',6);}
  for(const y of [.65,2.5,3.15])spa.beam([a[0],deck+y,a[2]],[c[0],deck+y,c[2]],.15,timber);
 }
 fence([fenceLeft,0,fenceBack],[fenceRight,0,fenceBack]);fence([fenceRight,0,fenceBack],[fenceRight,0,fenceFront]);
 fence([fenceLeft,0,fenceBack],[fenceLeft,0,fenceFront]);
 // Front gate faces the annex's rear entrance across the short open garden path.
 const gateZ=fenceFront;
 fence([fenceLeft,0,gateZ],[px-1.2,0,gateZ]);fence([px+1.2,0,gateZ],[fenceRight,0,gateZ]);
 spa.scoped([px,deck+.16,gateZ],0,()=>{
  for(const x of [-1.2,1.2])spa.box([x,1.7,0],[.19,3.4,.19],timber);
  spa.box([0,3.35,0],[2.7,.2,.25],timber);
  // Gathered side curtains leave 1.61 units clear across the full doorway height.
  for(const x of [-.98,.98]){spa.box([x,2.72,0],[.35,1.12,.07],'#344a68');spa.box([x,2.55,.055],[.37,.06,.06],'#c2a36a');}
  spa.sign('湯',[0,3.72,.06],[.45,.52]);
 });
 const bx=px+w*.31,bz=-d*1.20,bw=w*.28,bd=d*.43,bh=h*.22;
 spa.scoped([bx,deck+.16,bz],0,()=>{
  spa.box([0,.34,0],[bw+1.1,.68,bd+1.2],'#968875');
  spa.box([0,bh/2+.65,0],[bw,bh,bd],wall);
  for(const x of [-bw/2,bw/2])for(const z of [-bd/2,bd/2])spa.box([x,bh/2+.65,z],[.26,bh,.26],timber);
  spa.box([0,.78,bd/2+.65],[bw+1,.22,1.3],timber);
  spa.detailedRoof([0,bh+.65,0],bd+1.8,bw+1.8,1.8,roof,Math.PI/2);
  spa.gable([0,bh+.65,bd/2+.25],bw,bw+1.8,1.8,wall,0);
  spa.box([0,2.1,bd/2+.12],[bw*.53,2.7,.16],timber);
  for(const side of [-1,1])spa.box([side*bw*.14,3.35,bd/2+.27],[bw*.26,1.5,.07],'#344a68');
  spa.sign('湯',[0,3.5,bd/2+.33],[.7,.75]);
  for(let i=0;i<4;i++)spa.box([0,.1+i*.18,bd/2+2.15-i*.38],[bw*.55,.2,1],stone);
  spa.lattice(-bw/2-.13,2.7,0,bd*.42,1.6,-Math.PI/2);
  spa.sign('天然温泉',[bw*.38,1.9,bd/2+.6],[1.4,.65]);
  spa.emit('feihua:bath-bucket',()=>new T.CylinderGeometry(.9,1,1,10),timber,[bw*.34,1.15,bd/2+.65],[.42,.6,.42]);
  for(let i=0;i<3;i++)spa.box([bw*.35,1.55+i*.16,bd/2+.28],[.65,.14,.42],'#e7e0ce');
 });
 for(const [x,z] of [[fenceLeft+1,fenceBack+1],[px-4,pz+rz+1],[fenceRight-1,fenceBack+1]] as [number,number][]){
  for(let i=0;i<5;i++){
   const xx=x+Math.cos(i*2.4)*.45,zz=z+Math.sin(i*2.4)*.45,hh=3.7+(i%3)*.5;
   spa.cylinder([xx,deck+.2,zz],[xx+.15,deck+hh,zz],.10,'#72854a',6);
   for(let j=1;j<6;j++)spa.box([xx+.15*j/6,deck+j*hh/6,zz],[.23,.065,.23],'#b4ad69');
   for(let j=0;j<3;j++)spa.ball([xx+(j%2?-.5:.45),deck+hh-.4-j*.45,zz+j*.15],[.65,.10,.22],j%2?'#74924c':'#93a75c');
  }
 }
 for(const [x,z] of [[fenceLeft+1.2,gateZ+2],[bx-bw*.6,bz+bd*.5]] as [number,number][])spa.scoped([x,deck+.16,z],0,()=>spa.lantern(0,0,.6));
 }
 const parts:Record<string,[Builder,string,number,number]>={
  feihua_terrace:[terrace,'绯华楼 · 山腰共用高台',0,0],
  feihua_bridge:[bridge,'绯华楼 · 悬空接入桥',0,front],
  feihua_annex:[annex,'绯华楼 · 副建筑',-w*.91,d*.02],
  feihua_onsen:[spa,'绯华楼 · 副楼后方温泉',-w*.91,-d*1.18],
 };
 const part=parts[o.templateId];if(part){const [builder,name,x,z]=part,group=builder.finish();group.position.set(-x,0,-z);root.name=name;root.add(group);}
 return root;
}
