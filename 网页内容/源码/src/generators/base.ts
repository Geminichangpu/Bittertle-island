import {slateRoof,paneFrame} from './details.ts';
import * as T from 'three';
import type {IslandObject} from '../data/model.ts';
import {Builder,type Cache} from './shrine.ts';

/** Wood cabins and a static rock-lined pond, reconstructed from the four UI illustrations. */
export function makeBaseMesh(o:IslandObject,cache:Cache){
 const b=new Builder(cache),{width:w,depth:d,wallHeight:h,wallColor:wood,roofColor:roof}=o.params;
 const frame='#62482f',trim='#ad8047',stone='#939184';
 function window(x:number,z:number,width:number,height:number,angle=0){b.scoped([x,h*.56+.5,z],angle,()=>{b.box([0,0,0],[width+.22,height+.22,.2],frame);b.lattice(0,0,.14,width,height);paneFrame(b,width,height,.25);});}
 function cabin(width:number,depth:number,height:number){
  b.box([0,.25,0],[width+.6,.5,depth+.6],stone);b.box([0,height/2+.5,0],[width,height,depth],wood);
  for(const z of [-depth/2,depth/2]){for(let i=0;i<=Math.ceil(width/.48);i++)b.box([-width/2+i*width/Math.ceil(width/.48),height/2+.5,z],[.045,height,.08],trim);for(const y of [.65,height+.35])b.box([0,y,z],[width+.3,.18,.22],frame);}
  for(const x of [-width/2,width/2]){for(let j=0;j<=Math.ceil(depth/.48);j++)b.box([x,height/2+.5,-depth/2+j*depth/Math.ceil(depth/.48)],[.08,height,.045],trim);for(const z of [-depth/2,depth/2])b.box([x,height/2+.5,z],[.22,height+.15,.22],frame);}
  const rw=width+1.25,rd=depth+1.3,rise=Math.min(width,depth)*.3;
  slateRoof(b,[0,height+.5,0],rw,rd,rise,roof);
  // Close the timber gables at both ends, including the board courses.
  for(const side of [-1,1]){b.emit(`base:gable:${depth}:${rise}:${side}`,()=>{const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([0,0,-depth/2,0,rise,0,0,0,depth/2],3));g.setIndex(side>0?[0,1,2]:[2,1,0]);g.computeVertexNormals();return g;},wood,[side*width/2,height+.5,0]);for(let y=.3;y<rise;y+=.35)b.box([side*(width/2+.04),height+.5+y,0],[.08,.06,depth*(1-y/rise)],trim);}
  for(let i=0;i<=Math.ceil(rw/.65);i++){const x=-rw/2+i*rw/Math.ceil(rw/.65);for(const side of [-1,1])b.beam([x,height+.56,side*rd/2],[x,height+.56+rise,0],.055,'#424548');}
  for(const side of [-1,1]){b.cylinder([-width/2,height+.35,side*(depth/2+.7)],[width/2,height+.35,side*(depth/2+.7)],.085,'#565952',8);b.cylinder([side*width/2,.4,-depth/2-.25],[side*width/2,height+.35,-depth/2-.25],.07,'#565952',8);}
  for(const side of [-1,1])for(let i=0;i<Math.ceil(width/1.15);i++)b.box([-width/2+(i+.5)*width/Math.ceil(width/1.15),.25,side*(depth/2+.32)],[width/Math.ceil(width/1.15)-.035,.4,.06],i%2?'#8b8a7c':'#aaa594');
  b.box([0,height+.56+rise,0],[rw+.15,.18,.25],roof);for(const side of [-1,1])b.box([0,height+.46,side*rd/2],[rw,.15,.18],frame);
 }
 if(o.templateId==='base_pond'){
  // No wave/fish animation or transparent depth sorting; this remains a demand-rendered object.
  b.emit('base:pond-disc',()=>new T.CylinderGeometry(1,1,1,64),'#337e79',[0,.08,0],[w*.45,.16,d*.44]);
  b.emit('base:pond-water',()=>new T.CylinderGeometry(1,1,1,64),'#469f98',[0,.19,0],[w*.41,.04,d*.40]);
  for(let i=0;i<40;i++){const a=i*Math.PI*2/40,r=1+.035*Math.sin(i*7);b.ball([Math.cos(a)*w*.46*r,.45,Math.sin(a)*d*.45*r],[.65+(i%3)*.15,.45+(i%4)*.12,.6],['#93947b','#b3b295','#7e8774'][i%3]);if(i%3===0){const x=Math.cos(a)*w*.49,z=Math.sin(a)*d*.48;for(let j=0;j<4;j++)b.cylinder([x,.3,z],[x+Math.sin(i+j)*.4,1+j*.16,z+Math.cos(j)*.3],.045,'#6d8b4e',5);}}
  for(let i=0;i<9;i++){const a=i*2.4,x=Math.cos(a)*w*.26,z=Math.sin(a)*d*.24;b.scoped([x,.27,z],a,()=>{b.ball([0,0,0],[.18,.055,.46],i%2?'#e6ba6b':'#df815e');b.ball([0,.035,-.05],[.15,.03,.2],'#ead9b7');b.emit('base:fish-tail',()=>new T.ConeGeometry(1,1,3),'#d4a16e',[0,0,-.5],[.2,.04,.22],new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),Math.PI/2));});}
  for(let i=0;i<12;i++){const a=i*2.4;b.emit('base:lily',()=>new T.CylinderGeometry(1,1,1,10),'#80a34e',[-w*.21+Math.cos(a)*w*.1,.24,-d*.17+Math.sin(a)*d*.12],[.36,.025,.3]);}
  for(let i=0;i<10;i++){const a=i*2.4,x=Math.cos(a)*w*.455,z=Math.sin(a)*d*.45;for(let j=0;j<3;j++)b.ball([x+Math.sin(j)*.3,.7+j*.1,z+Math.cos(j)*.3],[.25,.12,.28],'#7d9861');}
  for(let i=0;i<5;i++){const a=i*1.9;const x=-w*.21+Math.cos(a)*w*.1,z=-d*.17+Math.sin(a)*d*.12;for(let j=0;j<5;j++)b.ball([x+Math.cos(j*1.26)*.1,.3,z+Math.sin(j*1.26)*.1],[.13,.05,.1],'#e9c1c5');}
 }else if(o.templateId==='base_bedroom'){
  // L footprint: a full rear wing and a projecting right wing, with a sheltered inset entrance.
  b.scoped([0,0,-d*.23],0,()=>cabin(w,d*.54,h));
  b.scoped([w*.26,0,d*.25],Math.PI/2,()=>cabin(d*.5,w*.48,h));
  // All parts share the recessed wall origin; hardware stays attached at any cabin size.
  b.scoped([-w*.14,0,d*.04],0,()=>{
   for(const x of [-.76,.76])b.box([x,1.85,.14],[.14,2.7,.24],frame);
   b.box([0,3.2,.14],[1.66,.14,.24],frame);
   b.box([0,1.84,.17],[1.36,2.58,.12],wood);
   for(const y of [1.15,2.45]){b.box([0,y,.24],[1.12,1.05,.04],frame);b.box([0,y,.27],[.98,.91,.035],wood);}
   for(const y of [.86,2.83])b.box([-.64,y,.26],[.07,.17,.04],'#68645b');
   b.box([.46,1.77,.26],[.1,.23,.035],'#b9a575');
   b.cylinder([.46,1.8,.27],[.46,1.8,.36],.035,'#d5bb75');
   b.cylinder([.46,1.8,.36],[.27,1.8,.36],.035,'#d5bb75');
   b.box([0,.51,.2],[1.65,.08,.48],frame);
  });
  window(w/2+.12,d*.22,d*.32,h*.57,Math.PI/2);
 }else{
  cabin(w,d,h);
  if(o.templateId==='base_office'){
   window(-w*.19,d/2+.1,w*.29,h*.72);window(w*.16,d/2+.1,w*.29,h*.72);window(w/2+.1,0,d*.3,h*.42,Math.PI/2);
   b.box([0,.35,d/2+1],[w*.75,.6,1.8],frame);for(let i=0;i<Math.ceil(w*.75/.4);i++)b.box([-w*.375+i*.4,.68,d/2+1],[.36,.08,1.7],trim);
  }else{
   b.box([0,h*.43+.5,d/2+.13],[w*.62,h*.82,.18],frame);for(let i=0;i<10;i++)b.box([-w*.285+i*w*.063,h*.43+.5,d/2+.25],[w*.057,h*.79,.13],wood);
   for(const x of [-.25,.25])b.box([x,h*.43+.5,d/2+.39],[.1,.4,.1],'#363b37');for(const x of [-w*.23,w*.23])for(const y of [1.1,h*.7])b.box([x,y,d/2+.34],[.35,.12,.08],'#44453d');
   b.box([0,.3,d/2+1.1],[w*.75,.5,2],wood);for(let i=0;i<5;i++)b.box([w/2+.1,1.7+i*.18,0],[.12,.11,d*.25],frame);
   b.scoped([0,h*.83,d/2+.5],0,()=>{b.box([0,0,0],[w*.72,.18,1.6],roof);for(const x of [-w*.32,w*.32])b.beam([x,-.8,-.3],[x,0,.6],.13,frame);});
  }
 }
 return b.finish();
}
