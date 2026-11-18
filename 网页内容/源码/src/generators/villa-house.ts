import * as T from 'three';
import type {Builder} from './shrine';

export function buildVillaHouse(b:Builder,width:number,depth:number,height:number,z:number){
 const limestone='#ded5c4',trim='#f0e7d5',shadow='#9a9182',metal='#566461';
 const ground=.83,roofY=ground+height*.8,mid=ground+(roofY-ground)*.49;
 const rake=1.18,parapet='#505963';
 b.box([0,.38,z],[width+1.18,.76,depth+1.15],shadow);
 b.box([0,.74,z],[width+1,.27,depth+1],limestone);

 function arch(width:number,height:number){
  const r=width/2,shoulder=height-r,s=new T.Shape();
  s.moveTo(-r,0);s.lineTo(r,0);s.lineTo(r,shoulder);s.absarc(0,shoulder,r,0,Math.PI,false);s.closePath();return s;
 }
 function window(x:number,y:number,w:number,h:number,wallDepth:number,door=false){
  const r=w/2,shoulder=y+h-r;
  b.emit(`villa:arched-pane:${w}:${h}`,()=>new T.ShapeGeometry(arch(w,h),24),door?'#5c6f68':'#496a77',[x,y,-wallDepth+.02]);
  for(const side of [-1,1])b.box([x+side*(r+.05),(y+shoulder)/2,.03],[.14,shoulder-y,.18],trim);
  for(let i=0;i<14;i++){
   const a=i*Math.PI/14,c=(i+1)*Math.PI/14,rr=r+.035;
   b.beam([x+rr*Math.cos(a),shoulder+rr*Math.sin(a),.09],[x+rr*Math.cos(c),shoulder+rr*Math.sin(c),.09],i===6||i===7?.15:.098,i%4?trim:'#e5d9c4');
  }
  b.box([x,y-.045,.07],[w+.28,.10,.37],trim);
  b.box([x,(y+shoulder)/2,-wallDepth+.044],[.045,shoulder-y,.049],metal);
  b.box([x,shoulder,-wallDepth+.048],[w,.045,.053],metal);
  for(const s of [-1,1]){
   b.beam([x,shoulder,-wallDepth+.054],[x+s*r*.66,shoulder+r*.73,-wallDepth+.054],.032,metal);
   for(let row=1;row<=2;row++){
    const yy=y+(shoulder-y)*row/3;
    b.box([x+s*w*.244,yy,-wallDepth+.05],[w*.49,.025,.042],metal);
   }
  }
  if(door)for(const s of [-1,1])b.cylinder([x+s*.12,y+1.18,-wallDepth+.049],[x+s*.12,y+1.29,-wallDepth+.049],.022,'#b6a375',10);
 }

 // Recesses are left in each masonry row before the glazing and dressings are inserted.
 for(const [facadeWidth,distance,angle,bayCount] of [[width,depth/2,0,5],[width,depth/2,Math.PI,5],[depth,width/2,Math.PI/2,3],[depth,width/2,-Math.PI/2,3]]){
  const shellDepth=.36,bay=facadeWidth/bayCount;
  b.scoped([Math.sin(angle)*distance,0,z+Math.cos(angle)*distance],angle,()=>{
   for(const y of [ground+.12,mid-.17,mid+.07,roofY-.14])b.box([0,y,.045],[facadeWidth+.32,.145,.28],trim);
   for(let floor=0;floor<2;floor++){
    const lower=floor?mid:ground,upper=floor?roofY:mid;
    for(let i=0;i<bayCount;i++){
     const x=(i+.5-bayCount/2)*bay,entry=bayCount===5&&i===2&&floor===0,doors=bayCount===5&&i===2;
     const w=bay*(doors?.60:.51),bottom=lower+(entry?.03:.80),top=upper-.42,r=w/2,shoulder=top-r;
     const masonry=(x:number,y:number,w:number,h:number)=>{if(h>.01&&w>.01)b.box([x,y,-shellDepth/2],[w,h,shellDepth],limestone);};
     masonry(x,(lower+bottom)/2,bay,bottom-lower);
     masonry(x,(top+upper)/2,bay,upper-top);
     for(const s of [-1,1])masonry(x+s*(w+bay)/4,(bottom+top)/2,(bay-w)/2,top-bottom);
     for(let strip=0;strip<10;strip++){
      const a=strip/10,c=(strip+1)/10,h=r*(c-a),curve=r*Math.sqrt(1-a*a);
      for(const s of [-1,1])masonry(x+s*(r+curve)/2,shoulder+r*a+h/2,r-curve,h);
     }
     window(x,bottom,w,top-bottom,shellDepth,doors);
    }
   }
   for(const x of [-(facadeWidth*.5-.18),facadeWidth*.5-.18]){
    for(let j=0;j<17;j++)b.box([x,ground+(j+.5)*(roofY-ground)/17,.025],[j%2?.45:.56,(roofY-ground)/17-.029,.25],j%3?'#d6cbb7':'#c6bca9');
   }
   if(bayCount!==5)return;
   const cap=mid+.13,front=1.53,span=bay*1.08;
   for(const x of [-span*.47,span*.47]){
    b.box([x,.98,front],[.60,.28,.60],trim);
    b.cylinder([x,1.12,front],[x,cap-.22,front],.193,trim,28);
    const flutes=14;
    for(let i=0;i<flutes;i++){
     const a=i*2*Math.PI/flutes;
     b.cylinder([x+.184*Math.cos(a),1.22,front+.184*Math.sin(a)],[x+.168*Math.cos(a),cap-.29,front+.168*Math.sin(a)],.018,'#e8ddca',6);
    }
    b.box([x,cap-.23,front],[.52,.18,.52],trim);
    b.box([x,cap+.59,front+.23],[.26,.89,.26],trim);
   }
   for(const h of [cap-.15,cap-.035,cap+.085])b.box([0,h,front*.53],[span+.68,.16,front+1.0],trim);
   for(const k of [0,1,2])b.box([0,.16+k*.21,front+1.16-k*.42],[span+.50-k*.20,.24+k*.18,.84],limestone);
   for(let i=0;i<=12;i++){
    const x=(i/12-.5)*span;
    const shape=()=>new T.LatheGeometry([[.083,0],[.074,.13],[.047,.23],[.082,.34],[.086,.43],[.068,.52],[.05,.63],[.069,.77]].map(([r,y])=>new T.Vector2(r,y)),16);
    b.emit('villa:stone-baluster',shape,trim,[x,cap+.16,front+.43]);
   }
   b.box([0,cap+.95,front+.43],[span+.4,.10,.20],trim);
   for(const x of [-span*.5,span*.5])b.box([x,cap+.90,front*.5],[.14,.12,front*1.9],trim);
   for(const x of [-span*.42,span*.42])b.litBox([x,ground+2.24,.29],[.17,.32,.17],'#f4cf84','lamp');
  });
 }

 // Four-sided slate mansard with a shallow upper roof and individually capped seams.
 const eave=[width/2+.67,depth/2+.73],crown=[width/2-rake,depth/2-rake];
 const roof=(u:number,v:number,k:number)=>{
  const a=u*2-1,xx=T.MathUtils.lerp(eave[0],crown[0],v),zz=T.MathUtils.lerp(eave[1],crown[1],v);
  const edge=[[a*xx,zz],[xx,-a*zz],[-a*xx,-zz],[-xx,a*zz]][k];
  return new T.Vector3(edge[0],roofY+v*2.35,edge[1]+z);
 };
 for(let side=0;side<4;side++){
  const cols=Math.ceil((side%2?depth:width)/.52),rows=9;
  for(let i=0;i<=cols;i++){const a=roof(i/cols,0,side),c=roof(i/cols,1,side);b.cylinder([a.x,a.y,a.z],[c.x,c.y,c.z],.027,'#68747e',6);}
  const origin:[number,number,number]=[0,0,z];
  b.emit(`villa:slates:${width}:${depth}:${height}:${side}`,()=>{
   const positions:number[]=[],faces:number[]=[];
   for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
    const u=col/cols,v=row/rows,first=positions.length/3;
    for(const [x,y] of [[u,v],[(col+1)/cols,v],[(col+1)/cols,(row+1)/rows],[u,(row+1)/rows]]){
     const q=roof(x,y,side);positions.push(q.x,q.y+(y===v?.041:.006),q.z-z);
    }
    faces.push(first,first+1,first+2,first,first+2,first+3);
   }
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(faces);g.computeVertexNormals();return g;
  },parapet,origin);
 }
 b.box([0,roofY+2.38,z],[crown[0]*2+.13,.17,crown[1]*2+.13],parapet);
 for(const side of [-1,1]){
  const x=side*width*.29;
  b.box([x,roofY+2.55,z-.8],[.70,1.32,.64],limestone);
  b.box([x,roofY+3.22,z-.8],[.91,.18,.83],trim);
  b.box([x,roofY+3.325,z-.8],[.65,.08,.60],'#6b6456');
 }
}
