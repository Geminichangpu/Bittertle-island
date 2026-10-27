import * as T from 'three';
import type {IslandObject} from '../data/model.ts';
import {Builder,type Cache} from './shrine.ts';
import {crownGeometry,leafSprigGeometry,boulderGeometry} from '../environment/nature-geometry.ts';
type V=[number,number,number];
const wood='#785333',dark='#493728',paper='#eee3cd',roof='#485460',gold='#c3a35c',stone='#979f91';

export function makeSettlement(o:IslandObject,cache:Cache){
 const b=new Builder(cache);
 const leaf=(p:V,s:V,color='#799757')=>b.emit('settlement:leaf',crownGeometry,color,p,s);
 const rock=(p:V,s:V)=>b.emit('settlement:rock',()=>boulderGeometry(2),stone,p,s);
 function tree(x:number,z:number,h:number){
  b.cylinder([x,-.2,z],[x,h*.78,z],.3,wood,10);
  for(let i=0;i<5;i++){const a=i*2.4,dx=Math.cos(a)*1.5,dz=Math.sin(a)*1.5;b.cylinder([x,h*.4,z],[x+dx,h*.77,z+dz],.12,wood,8);leaf([x+dx,h*.7+i%2*.65,z+dz],[2.4,1.8,2.2],i%2?'#608b52':'#8ba75d');}
 }
 function hipRoof(x:number,y:number,z:number,w:number,d:number,rise:number){
  const rim=(t:number,side:number,u:number):V=>{
   const hx=w/2*(1-.72*t),hz=d/2*(1-t),corners=[[-hx,-hz],[hx,-hz],[hx,hz],[-hx,hz]],a=corners[side],c=corners[(side+1)%4];
   return [x+a[0]+(c[0]-a[0])*u,y+rise*(1-(1-t)**.84)+.5*(1-t)**6*(Math.abs(u-.5)*2)**3,z+a[1]+(c[1]-a[1])*u];
  };
  b.emit(`settlement:hip:${x}:${y}:${z}:${w}:${d}`,()=>{const v:number[]=[],uv:number[]=[],idx:number[]=[];for(let side=0;side<4;side++)for(let j=0;j<12;j++)for(let k=0;k<16;k++){const start=v.length/3;for(const [t,u] of [[j/12,k/16],[(j+1)/12,k/16],[(j+1)/12,(k+1)/16],[j/12,(k+1)/16]]){v.push(...rim(t,side,u));uv.push(u*4,t*3);}idx.push(start,start+1,start+2,start,start+2,start+3);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;},roof,[0,0,0]);
  for(let side=0;side<4;side++){
   const count=Math.ceil((side%2?d:w)/.6);
   for(let k=0;k<=count;k++)for(let j=0;j<8;j++){const a=rim(j/8,side,k/count),c=rim((j+1)/8,side,k/count);a[1]+=.045;c[1]+=.045;b.cylinder(a,c,.06,roof,6);}
   for(let j=1;j<8;j++)for(let k=0;k<8;k++)b.cylinder(rim(j/8,side,k/8),rim(j/8,side,(k+1)/8),.028,'#697078',5);
   for(let j=0;j<10;j++)b.cylinder(rim(j/10,side,0),rim((j+1)/10,side,0),.15,roof,8);
   const corner=rim(0,side,0);b.ball([corner[0],corner[1]+.16,corner[2]],[.18,.28,.18],gold);
  }
  b.box([x,y+rise+.12,z],[w*.28+.4,.23,.38],roof);for(const sign of [-1,1])b.ball([x+sign*w*.14,y+rise+.4,z],[.19,.27,.19],gold);
 }
 function wall(p:V,length:number,angle=0){b.scoped(p,angle,()=>{b.box([0,.45,0],[length,.9,.7],stone);b.box([0,1.9,0],[length,2.2,.45],paper);b.box([0,3,0],[length,.14,.68],wood);b.roof([0,3,0],length+.35,1.2,.4,roof);for(let i=0;i<length;i+=1.25)b.box([-length/2+i,.43,.365],[.025,.8,.035],'#727e73');});}
 if(o.templateId==='scenic_academy'){
  // Walled garden, open gate and freestanding two-storey research hall.
  b.box([0,.08,0],[22,.16,25],'#8fa773');
  b.scoped([0,0,-5],0,()=>{
   b.stoneBase(15,10);b.box([0,3.8,0],[15,5.7,10],paper);
   for(const x of [-7.4,-3.5,3.5,7.4])for(const z of [-5,5]){b.box([x,3.8,z],[.35,5.8,.35],wood);b.box([x,.9,z],[.6,.9,.6],stone);}
   for(const y of [1.1,5.7,6.5]){b.box([0,y,5.1],[15.5,.24,.32],wood);b.box([0,y,-5.1],[15.5,.24,.32],wood);}
   b.box([0,3,5.12],[3.3,4.1,.18],dark);for(const x of [-.8,.8]){b.box([x,3,5.25],[1.5,3.9,.12],wood);b.ball([x*.25,2.85,5.36],[.07,.07,.07],gold);}
   for(const x of [-5.5,5.5])b.lattice(x,3.8,5.18,2.3,2.7);
   for(const side of [-1,1])for(const z of [-2.8,1.7])b.lattice(side*7.55,3.8,z,2.3,2.7,side*Math.PI/2);
   hipRoof(0,6.65,0,18.5,13,2.2);
   b.box([0,9.8,0],[10.6,3,6],paper);
   for(const x of [-5.3,-1.8,1.8,5.3]){b.box([x,9.8,3.05],[.25,3.1,.25],wood);b.box([x,9.8,-3.05],[.25,3.1,.25],wood);}
   for(const x of [-3.5,0,3.5])b.lattice(x,9.8,3.1,2.6,1.8);
   for(const side of [-1,1])b.lattice(side*5.4,9.8,0,3,1.8,side*Math.PI/2);
   hipRoof(0,11.35,0,13,8.7,2.1);
   b.box([0,5.7,5.45],[6.9,1.8,.35],gold);b.sign('研究学堂',[0,5.7,5.69],[6.4,1.4]);
   for(const x of [-4,4]){b.cylinder([x,5.3,5.3],[x,4.8,5.9],.065,dark);b.litBox([x,4.3,5.9],[.65,1,.65],'#f5d38a');for(const xx of [-.34,.34])b.box([x+xx,4.3,5.91],[.05,1.05,.7],wood);}
   for(let i=0;i<4;i++)b.box([0,.12+i*.18,7.5-i*.55],[5,.25+i*.25,1.2],stone);
  });
  wall([0,0,-12],22);wall([-10.8,0,0],24,Math.PI/2);wall([10.8,0,0],24,Math.PI/2);wall([-7,0,12],7.6);wall([7,0,12],7.6);
  for(const x of [-3.2,3.2]){b.box([x,.35,12],[1,.7,1],stone);b.box([x,2.6,12],[.6,4.5,.65],wood);}
  b.box([0,4.6,12],[7.4,.6,.7],wood);hipRoof(0,4.8,12,9.4,3.6,1.1);b.sign('研学',[0,4.2,12.48],[2.6,.9]);
  for(let i=0;i<9;i++)b.box([Math.sin(i*.7)*.6,.19,3+i],[2.3,.16,1.2],'#d1c2a1',Math.sin(i)*.1);
  tree(-8,-6,6.6);for(const [x,z] of [[-8,6],[8,5],[-6,1],[6,1]])leaf([x,.6,z],[1.7,.9,1.4]);
  rock([7,1.7,5],[1.1,2.5,.65]);b.box([7,.25,5],[2.8,.5,2.3],stone);
  for(let i=0;i<8;i++){const x=7.7+(i%3)*.55,z=-5+Math.floor(i/3)*2,h=4+(i%3)*.6;b.cylinder([x,0,z],[x+.2,h,z],.09,'#688750',8);for(let j=1;j<5;j++){b.cylinder([x,j*h/5,z],[x+.4,j*h/5+.4,z+.3],.025,'#708c49',5);b.emit('settlement:sprig',leafSprigGeometry,'#7e9c50',[x+.4,j*h/5+.4,z+.3],[1.4,1.4,1.4]);}}
 }else{
  // Four distinct crop beds with furrows, irrigation and forest surrounding them.
  b.box([0,.06,0],[35,.12,29],'#879e67');
  for(const x of [-8,6])for(const z of [-6,6]){
   b.box([x,.18,z],[10,.3,8],'#70553f');
   for(const dx of [-5,5])b.box([x+dx,.33,z],[.16,.3,8.2],'#a18d66');
   for(let row=0;row<5;row++){
    const rz=z-3+row*1.4;b.box([x,.37,rz],[9,.2,.34],'#94734f');
    for(let j=0;j<8;j++){
     const xx=x-4+j*1.12,yy=.52+(j%3)*.05;
     b.emit('settlement:sprig',leafSprigGeometry,'#699456',[xx,yy,rz],[1.3,1.7,1.3]);
     if(x<0&&z<0){for(let k=0;k<3;k++)b.ball([xx+(k-1)*.16,yy+.48+k*.13,rz],[.15,.28,.15],'#b6d58c');}
     else if(x>0&&z<0){b.ball([xx,yy+.28,rz],[.38,.36,.36],j%2?'#b989d1':'#e8ad71');b.cylinder([xx,yy+.55,rz],[xx+.05,yy+.8,rz],.04,'#62764a',5);}
     else if(x<0){b.emit('settlement:crystal',()=>new T.ConeGeometry(1,1,6),'#82c7ce',[xx,yy+.55,rz],[.25,.9,.25]);b.ball([xx,yy+.25,rz],[.42,.2,.42],'#7b9fb5');}
     else {b.cylinder([xx,yy,rz],[xx,yy+.5,rz],.06,'#d8d6b1',6);b.ball([xx,yy+.55,rz],[.36,.16,.33],j%2?'#b4c8e3':'#dfb0cb');}
    }
   }
  }
  for(const x of [-1.2,0])b.box([x,.12,0],[.22,.22,27],'#9b9e84');b.box([-.6,.15,0],[.9,.06,27],'#80b7bd');
  b.box([0,.3,12],[4,.2,1.8],wood);for(let i=0;i<9;i++)b.box([-1.8+i*.45,.42,12],[.36,.12,1.8],'#ad8b60');
  b.scoped([-11,0,-13],0,()=>{for(const x of [-2.7,2.7])for(const z of [-1.7,1.7])b.box([x,1.8,z],[.24,3.6,.24],wood);b.roof([0,3.5,0],6.5,4.6,1.4,'#577b75');b.box([0,.4,0],[5.8,.45,3.6],wood);for(const x of [-1.8,0,1.8]){b.box([x,.9,0],[1.2,.7,1.2],'#ad8c5e');b.ball([x,1.3,0],[.55,.2,.5],'#d4ac77');}});
  for(let i=0;i<27;i++){
   const a=i*Math.PI*2/27;if(Math.abs(a-Math.PI/2)<.2)continue;
   const x=Math.cos(a)*(20.5+(i%3)*.65),z=Math.sin(a)*(18+(i%2)*1.5);tree(x,z,6.7+(i%4)*.7);leaf([x*.92,.65,z*.92],[1.6,.85,1.5],i%2?'#668958':'#819c60');
   if(i%3===0){rock([x*.83,.25,z*.83],[.65,.45,.55]);b.cylinder([x*.83,0,z*.83],[x*.83,1.3,z*.83],.09,wood,7);b.litBall([x*.83,1.5,z*.83],[.22,.27,.22],'#a9d5bb');}
  }
  for(const x of [-3.3,3.3])b.box([x,1.1,16],[.22,2.2,.22],wood);b.beam([-3.3,2.2,16],[3.3,2.2,16],.2,wood);
 }
 const root=b.finish();root.traverse(n=>{if(!(n instanceof T.Mesh))return;const key=n.geometry.userData.sourceKey||'';if(key==='settlement:rock')n.userData.natureKind='rock';if(key==='settlement:leaf'||key==='settlement:sprig'){n.userData.natureKind='leaf';(n.material as T.Material).side=T.DoubleSide;}n.userData.noCollision=true;});return root;
}
