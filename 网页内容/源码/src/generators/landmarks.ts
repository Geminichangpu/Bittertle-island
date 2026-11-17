import * as T from 'three';
import type {IslandObject} from '../data/model.ts';
import {Builder,type Cache} from './shrine.ts';
type V=[number,number,number];
const white='#e1ece5',gold='#bda572',cyan='#6bd4d7',wood='#655044',red='#a7504a',purple='#75568b';

/** Three individually editable, static landmarks. Small repeated details share instanced batches. */
export function makeLandmarkMesh(o:IslandObject,cache:Cache){
 const b=new Builder(cache),{width:w,depth:d,wallHeight:h,wallColor:wall,roofColor:roof}=o.params;
 const cylinder=(p:V,r:number,height:number,color:string,rz=r,sides=32)=>b.emit('landmark:disc:'+sides,()=>new T.CylinderGeometry(1,1,1,sides),color,p,[r,height,rz]);
 const cone=(p:V,r:number,height:number,color:string,sides=6)=>b.emit('landmark:cone:'+sides,()=>new T.ConeGeometry(1,1,sides),color,p,[r,height,r]);
 const ring=(p:V,r:number,color:string,tube=.025)=>b.emit('landmark:ring:'+tube,()=>new T.TorusGeometry(1,tube,6,48).rotateX(Math.PI/2),color,p,[r,r,r]);

 if(o.templateId==='landmark_liuli'){
  // Reference: blue glass corporate spire with sweeping white structural blades.
  const r=Math.min(w,d);
  for(let i=0;i<3;i++)cylinder([0,.15+i*.22,0],r*(.49-i*.025),.24,'#dfe7ea',undefined,64);
  ring([0,.67,0],r*.43,'#a4bac7',.012);
  b.emit('liuli:glass-core',()=>new T.CylinderGeometry(.68,1,1,8),roof,[0,h*.43,0],[r*.125,h*.83,r*.125]);
  for(let side=0;side<8;side++)b.scoped([0,0,0],side*Math.PI/4,()=>{
   const base=r*.115,top=base*.68;
   b.beam([-r*.047,.65,base],[-r*.032,h*.845,top],.065,white);
   b.beam([r*.047,.65,base],[r*.032,h*.845,top],.065,white);
   for(let row=0;row<27;row++){
    const u=row/27,yy=.9+u*h*.81,z=base+(top-base)*u;
    b.box([0,yy,z+.025],[r*(.093-u*.025),.045,.07],'#95b7d2');
    if(row%3===0)b.litBox([0,yy+.3,z+.04],[r*.034,h*.009,.025],'#92cbe6');
   }
  });
  for(let k=0;k<6;k++)b.scoped([0,0,0],k*Math.PI/3,()=>{
   const tip=h*(k%2?.73:.9),segments=40;
   const profile=(u:number)=>r*(.09+.36*Math.pow(1-u,4));
   b.emit(`liuli:corporate-fin:${r}:${tip}`,()=>{
    const v:number[]=[],ix:number[]=[];
    for(let i=0;i<=segments;i++){const u=i/segments,yy=.65+u*tip,z=profile(u),half=r*(.032*(1-u)+.002),thick=.2*(1-u)+.04;v.push(-half,yy,z,half,yy,z,-half,yy,z-thick,half,yy,z-thick);}
    for(let i=0;i<segments;i++){const a=i*4,c=a+4;ix.push(a,c,a+1,a+1,c,c+1,a+2,a+3,c+2,a+3,c+3,c+2,a,a+2,c,a+2,c+2,c,a+1,c+1,a+3,a+3,c+1,c+3);}
    ix.push(0,1,2,1,3,2);const a=segments*4;ix.push(a,a+2,a+1,a+1,a+2,a+3);
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setIndex(ix);g.computeVertexNormals();return g;
   },k%2?wall:white,[0,0,0]);
   for(let i=0;i<segments;i++){const u=i/segments,v=(i+1)/segments;b.cylinder([0,.65+u*tip,profile(u)+.03],[0,.65+v*tip,profile(v)+.03],.03,'#9ebdd4',6);}
  });
  // Forked crown, antenna and recessed glass entrance.
  for(const side of [-1,1])b.beam([0,h*.84,0],[side*r*.1,h*.94,0],.16,white);
  b.cylinder([0,h*.84,0],[0,h,0],.055,white,8);
  b.box([0,1.55,r*.13],[r*.12,1.8,.12],'#70b0d5');b.box([0,1.55,r*.14],[.055,1.8,.09],white);
  b.box([0,2.55,r*.18],[r*.19,.12,r*.15],white);
 }else if(o.templateId==='landmark_library'){
  const r=Math.min(w,d)*.5;
  for(let i=0;i<3;i++)cylinder([0,.18+i*.28,0],r*(1.14-i*.065),.3,i%2?'#c9ccc0':wall,undefined,48);
  cylinder([0,h*.43+.7,0],r*.72,h*.86,wall,undefined,12);
  cylinder([0,h*.85+.7,0],r*.82,.4,gold,undefined,48);
  for(let i=0;i<12;i++){
   const angle=i*Math.PI/6;
   b.scoped([0,0,0],angle,()=>{
    const ww=r*.29,wh=h*.56,z=r*.702;
    b.emit(`library:arch:${ww}:${wh}`,()=>{const s=new T.Shape();s.moveTo(-ww/2,0);s.lineTo(ww/2,0);s.lineTo(ww/2,wh-ww/2);s.absarc(0,wh-ww/2,ww/2,0,Math.PI,false);s.lineTo(-ww/2,0);return new T.ExtrudeGeometry(s,{depth:.1,bevelEnabled:false});},roof,[0,1.6,z],[1,1,1],new T.Quaternion(),cache.mat(roof,'window'));
    b.box([0,h*.33+1,z+.14],[.08,h*.53,.12],gold);b.box([0,h*.4,z+.14],[ww,.09,.12],gold);
    const archY=1.6+wh-ww/2;
    for(let j=0;j<12;j++){const a=j*Math.PI/12,c=(j+1)*Math.PI/12;b.cylinder([Math.cos(a)*ww/2,archY+Math.sin(a)*ww/2,z+.17],[Math.cos(c)*ww/2,archY+Math.sin(c)*ww/2,z+.17],.07,gold,6);}
    for(const x of [-r*.2,r*.2]){
     b.cylinder([x,1,r*.83],[x,h*.86+.6,r*.83],.24,white,10);
     cylinder([x,1.2,r*.83],.39,.3,wall);cylinder([x,h*.86+.5,r*.83],.4,.35,gold);
    }
    b.box([0,1,r*.89],[ww+.7,.25,1],wall);
    if(i%2===0){cone([0,h*1.13,r*.88],.5,h*.26,gold,4);b.cylinder([0,1.2,r*.96],[0,h*.85,r*.85],.13,roof,6);}
   });
  }
  const domeY=h*.89+1,domeR=r*.72,domeH=h*.47;
  b.emit('library:dome',()=>new T.SphereGeometry(1,24,12,0,Math.PI*2,0,Math.PI/2),roof,[0,domeY,0],[domeR,domeH,domeR]);
  ring([0,domeY,0],domeR,gold);
  for(let k=0;k<12;k++){const a=k*Math.PI/6;for(let j=0;j<12;j++){const t=j*Math.PI/24,u=(j+1)*Math.PI/24;b.cylinder([Math.cos(a)*domeR*Math.sin(t),domeY+domeH*Math.cos(t),Math.sin(a)*domeR*Math.sin(t)],[Math.cos(a)*domeR*Math.sin(u),domeY+domeH*Math.cos(u),Math.sin(a)*domeR*Math.sin(u)],.055,white,6);}}
  ring([0,domeY+domeH*.5,0],domeR*Math.sqrt(.75),gold,.012);
  cylinder([0,domeY+domeH+.35,0],.3,.7,gold);cone([0,domeY+domeH+1.25,0],.42,1.3,gold);
  for(let i=0;i<6;i++)b.box([0,.1+i*.16,r+2.2-i*.45],[w*.43,.2+i*.32,1.2],wall);
  b.box([0,h*.27,r*.75],[w*.19,h*.4,.3],'#42616e');b.box([0,h*.27,r*.78],[.1,h*.4,.15],gold);
  b.sign('璃光图书馆',[0,h*.55,r*.77],[w*.29,.8]);
  for(const x of [-w*.42,w*.42]){cylinder([x,.8,r*.5],1.1,.6,wall);for(let i=0;i<5;i++)b.ball([x+Math.cos(i*2.4)*.5,1.45, r*.5+Math.sin(i*2.4)*.5],[.6,.5,.6],'#638666');}
  for(let k=0;k<12;k++)b.scoped([0,0,0],k*Math.PI/6,()=>{
   for(const x of [-r*.2,r*.2]){for(let j=0;j<8;j++){const a=j*Math.PI/4;b.cylinder([x+Math.cos(a)*.245,1.4,r*.83+Math.sin(a)*.245],[x+Math.cos(a)*.245,h*.86+.25,r*.83+Math.sin(a)*.245],.022,'#bccac4',5);}for(const yy of [1.5,h*.86+.2])cylinder([x,yy,r*.83],.29,.12,gold);}
   for(let row=0;row<3;row++){const yy=2.3+row*h*.16;b.box([0,yy,r*.72+.14],[r*.27,.06,.08],white);for(const side of [-1,1])b.beam([0,yy+.55,r*.72+.15],[side*r*.1,yy,r*.72+.15],.04,gold);}
   for(let i=0;i<4;i++)b.box([-r*.24+i*r*.16,h*.85+.85,r*.77],[.18,.27,.4],white);
  });
  for(const side of [-1,1]){b.box([side*w*.105,h*.27,r*.8],[.18,h*.42,.25],gold);b.ball([side*.25,h*.25,r*.94],[.09,.09,.09],gold);}
  ring([0,domeY+domeH*.78,0],domeR*Math.sqrt(1-.78**2),gold,.008);
 }else{
  const floor=h/3,deck=2.3;
  // The main hall keeps its authored origin and entrance; the shared terrace is added below.
  function rails(width:number,depth:number,y:number,z=0){
   for(const side of [-1,1]){for(let i=0;i<=Math.ceil(width/2);i++){const x=-width/2+i*width/Math.ceil(width/2);b.box([x,y+.72,z+side*depth/2],[.15,1.44,.15],red);b.ball([x,y+1.48,z+side*depth/2],[.14,.1,.14],wood);}for(const level of [.4,.95,1.4])b.box([0,y+level,z+side*depth/2],[width,.1,.12],red);}
   for(const side of [-1,1]){for(let i=0;i<=Math.ceil(depth/2);i++)b.box([side*width/2,y+.72,z-depth/2+i*depth/Math.ceil(depth/2)],[.15,1.44,.15],red);for(const level of [.4,.95,1.4])b.box([side*width/2,y+level,z],[.12,.1,depth],red);}
  }
  function paperLantern(x:number,y:number,z:number,large=false){
   b.cylinder([x,y+.75,z],[x,y+1.2,z],.025,wood,5);b.litBall([x,y,z],[large?.52:.26,large?.8:.42,large?.46:.26],red);
   for(const yy of [-1,1])cylinder([x,y+yy*(large?.72:.38),z],large?.27:.16,.12,gold,undefined,8);
   // Exterior lanterns retain their paper/rib decoration without written labels.
  }
  for(let level=0;level<3;level++){
   const width=w*(1-level*.065),depth=d*(1-level*.055),y=deck+level*floor;
   b.box([0,y+.12,0],[width+.8,.22,depth+1],wood);
   b.box([0,y+floor/2,-depth/2],[width,floor,.3],wall);
   for(const side of [-1,1])b.box([side*width/2,y+floor/2,0],[.3,floor,depth],wall);
   // Leave the central ground-floor entrance physically open.
   if(level===0){for(const side of [-1,1])b.box([side*width*.345,y+floor/2,depth/2],[width*.31,floor,.3],wall);}
   else b.box([0,y+floor/2,depth/2],[width,floor,.3],wall);
   for(const z of [-depth/2,depth/2])for(const yy of [.5,floor-.3])b.box([0,y+yy,z+.1],[width+.3,.22,.25],wood);
   for(let i=0;i<=8;i++){const x=-width/2+i*width/8;for(const z of [-depth/2,depth/2])b.box([x,y+floor/2,z],[.24,floor,.3],wood);}
   for(let i=0;i<8;i++){const x=-width*.44+i*width*.126;if(level===0&&Math.abs(x)<width*.2)continue;b.lattice(x,y+floor*.52,depth/2+.23,width*.112,floor*.61);}
   for(const side of [-1,1])for(let i=0;i<4;i++)b.lattice(side*(width/2+.17),y+floor*.52,-depth*.36+i*depth*.24,depth*.2,floor*.61,side*Math.PI/2);
   if(level>0){b.box([0,y+.12,depth*.54],[width+1.8,.22,2.4],wood);rails(width+1.8,depth+2,y+.25);}
   // Staggered lower eaves; the final roof caps the building.
   if(level<2){for(const side of [-1,1]){b.detailedRoof([side*width*.32,y+floor-.7,depth/2+1.05],width*.39,5.2,1.35,roof);b.detailedRoof([side*(width/2+.85),y+floor-.7,0],depth+2,3.8,1,roof,Math.PI/2);}}
   else b.detailedRoof([0,y+floor,0],width+3,depth+4,3,roof);
   for(const x of [-width*.45,0,width*.45])for(const side of [-1,1])b.bracket(x,y+floor-.5,side*depth/2,side<0?Math.PI:0);
   if(level===2)for(const side of [-1,1])b.gable([side*(width/2+.02),y+floor,0],depth,depth+4,3,wall,side*Math.PI/2);
   if(level>0)for(let i=0;i<Math.ceil(width/.55);i++)b.box([-width/2+i*.55,y+.255,depth*.54],[.5,.04,2.35],i%2?wood:'#967955');
   for(const side of [-1,1])for(let j=0;j<4;j++){const z=-depth*.36+j*depth*.24;b.box([side*(width/2+.29),y+.7,z],[.12,.12,depth*.2],gold);}
   for(let i=0;i<8;i++)paperLantern(-width*.44+i*width*.126,y+floor-1,depth/2+.7);
  }
  // Roof lookout pavilion and its circular window.
  const top=deck+h+2.5;b.box([0,top,0],[w*.35,.5,d*.47],wall);rails(w*.39,d*.5,top+.2);
  b.box([0,top+2.7,0],[w*.24,5.1,d*.3],wall);
  for(const x of [-w*.12,w*.12])for(const z of [-d*.15,d*.15])b.box([x,top+2.7,z],[.22,5.3,.22],wood);
  b.emit('feihua:round-window',()=>new T.CircleGeometry(1,32), '#f0dfba',[0,top+3,d*.15+.17],[1.5,1.5,1],new T.Quaternion(),cache.mat('#f0dfba','window'));
  b.emit('feihua:round-frame',()=>new T.TorusGeometry(1,.07,6,32),wood,[0,top+3,d*.15+.22],[1.5,1.5,1]);
  for(const x of [-.65,0,.65])b.box([x,top+3,d*.15+.25],[.09,2.4,.08],wood);for(const y of [-.6,0,.6])b.box([0,top+3+y,d*.15+.25],[2.4,.09,.08],wood);
  b.detailedRoof([0,top+5.4,0],w*.3,d*.44,1.7,roof);
  for(const side of [-1,1])b.gable([side*(w*.12+.02),top+5.4,0],d*.3,d*.44,1.7,wall,side*Math.PI/2);
  // Open portico, purple split curtain and an actual shallow lobby behind the doors.
  const front=d/2+2;
  for(const x of [-w*.16,w*.16])b.box([x,deck+floor*.45,front],[.55,floor*.9,.55],wood);
  b.detailedRoof([0,deck+floor*.86,front],5.5,w*.43,1.6,roof,Math.PI/2);
  for(const side of [-1,1]){b.box([side*w*.085,deck+floor*.68,front+.3],[w*.16,1.45,.06],purple);paperLantern(side*w*.22,deck+floor*.53,front+.25,true);}
  b.sign('绯华楼',[0,deck+floor*.95,front+.7],[w*.2,.75]);
  for(const side of [-1,1]){b.bracket(side*w*.16,deck+floor*.82,front);b.box([side*w*.16,deck+.25,front],[.8,.5,.8],'#c7bda6');}
  for(let i=0;i<7;i++)b.box([-w*.16+i*w*.32/6,deck+floor*.84,front],[.12,.18,2.5],wood);
  for(const side of [-1,1])for(let j=0;j<8;j++){const a=j*Math.PI/4;const x=side*w*.22,y=deck+floor*.53; b.cylinder([x+Math.cos(a)*.49,y-.45,front+.25+Math.sin(a)*.43],[x+Math.cos(a)*.49,y+.45,front+.25+Math.sin(a)*.43],.018,gold,5);}
  for(let i=0;i<4;i++)b.box([0,deck-.7+i*.2,front+2-i*.4],[w*.41,.25,1.1],'#b7b1a0');
  // Reception counter, stair and red gallery rails echo the two interior references.
  b.box([w*.21,deck+1,-d*.1],[w*.18,1.8,1.6],wood);b.sign('受付',[w*.21,deck+2,-d*.1+.9],[1.1,.55]);
  for(let i=0;i<12;i++)b.box([w*.31,deck+i*floor/12,-d*.32+i*.45],[2.3,.25,.5],wood);
  b.beam([w*.36,deck+1,-d*.32],[w*.36,deck+floor+1,-d*.32+5.4],.13,red);
  for(let i=0;i<3;i++){const z=-d*.3+i*d*.25;paperLantern(0,deck+floor-.6,z);b.box([-w*.36,deck+2,z],[.08,1.4,1.8],purple);}
  // Ground-level perimeter rails and approach now belong to the common compound terrace.
 }
 const root=b.finish();
 if(o.templateId==='landmark_feihua')root.name='绯华楼 · 主建筑';
 return root;
}
