import * as T from 'three';
import type {Builder} from '../generators/shrine';
import {boulderGeometry} from './nature-geometry';

const tau=Math.PI*2;
function shore(a:number,r:number):[number,number]{
 const arm=1+.10*Math.sin(3*a-.42)+.06*Math.cos(2*a+.34);
 return [2.58*r*arm*Math.cos(a)+.28*r*Math.sin(a),1.98*r*arm*Math.sin(a)];
}
function basin(water:boolean){
 const vertices:number[]=[],colours:number[]=[],faces:number[]=[],n=64;
 const deep=new T.Color('#346c6c'),sand=new T.Color('#bac39c');
 for(let j=0;j<=10;j++)for(let i=0;i<n;i++){
  const r=j/10,a=i*tau/n,[x,z]=shore(a,r*(water?.981:1.047));
  const glint=Math.sin(x*9+z*4)*Math.cos(z*8-x);
  const y=water?.415+.005*Math.sin(8*x+4*z)*Math.sin(6*z):.142+.32*r**5+.012*r*Math.sin(7*a);
  vertices.push(x,y,z);
  const tint=deep.clone().lerp(sand,Math.min(1,.08+r**2*.77+.07*glint));colours.push(tint.r,tint.g,tint.b);
  if(j){const k=(j-1)*n+i,l=(j-1)*n+(i+1)%n;if(j>1)faces.push(k,l,k+n);faces.push(k+n,l,l+n);}
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));if(!water)g.setAttribute('color',new T.Float32BufferAttribute(colours,3));g.setIndex(faces);g.computeVertexNormals();return g;
}

function koi(variant:number){
 const pos:number[]=[],color:number[]=[];
 const chalk=new T.Color('#efe4c7'),red=new T.Color(variant===1?'#cf9c4b':'#c26b48'),ink=new T.Color('#57534e');
 const flank=(t:number,a:number):T.Vector3=>{
  const r=Math.sin(Math.PI*t)**.64*(.44+.67*t);
  return new T.Vector3((t-.50)*.74,r*.091*Math.cos(a),.057*Math.sin(4*t)+r*.128*Math.sin(a));
 };
 const triangle=(a:T.Vector3,b:T.Vector3,c:T.Vector3,pig:T.Color)=>{for(const v of [a,b,c]){pos.push(v.x,v.y,v.z);color.push(pig.r,pig.g,pig.b);}};
 for(let j=0;j<15;j++)for(let k=0;k<14;k++){
  const t=j/15,t1=(j+1)/15,a=k*tau/14,a1=(k+1)*tau/14;
  const marks=Math.cos(t*16+.6*Math.sin(a+variant))+Math.cos(2*a+t*4);
  const pigment=marks>.41?red:variant===2&&marks<-.98?ink:chalk;
  const a0=flank(t,a),b0=flank(t,a1),c0=flank(t1,a),d0=flank(t1,a1);
  triangle(a0,b0,c0,pigment);triangle(b0,d0,c0,pigment);
 }
 const fin=(v:number[][],pig:T.Color)=>{for(let i=1;i<v.length-1;i++)triangle(new T.Vector3(...v[0]),new T.Vector3(...v[i]),new T.Vector3(...v[i+1]),pig);};
 for(const s of [-1,1]){
  fin([[-.31,.006,.016],[-.49,.023,s*.13],[-.54,.014,s*.153],[-.49,-.008,s*.037],[-.36,-.006,0]],red);
  fin([[.15,.003,s*.081],[.006,.010,s*.201],[-.052,.007,s*.193],[.02,-.014,s*.089]],chalk);
  const eye=new T.Vector3(.276,.041,s*.057-.018);
  for(let i=0;i<9;i++)triangle(eye,eye.clone().add(new T.Vector3(.015*Math.cos(i*tau/9),.006,.014*Math.sin(i*tau/9))),eye.clone().add(new T.Vector3(.015*Math.cos((i+1)*tau/9),.006,.014*Math.sin((i+1)*tau/9))),ink);
 }
 fin([[.09,.078,.022],[-.125,.145,.028],[-.20,.061,.032]],red);
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(color,3));g.computeVertexNormals();return g;
}
export function addPond(b:Builder,x:number,z:number){
 b.scoped([x,0,z],0,()=>{
  b.emit('pond:gravel-basin',()=>basin(false),'#fdfcfa',[0,0,0]);
  b.emit('pond:clear-water',()=>basin(true),'#97d7c8',[0,0,0]);
  for(let i=0;i<31;i++){
   const a=i*tau/31+.045*Math.sin(i*2.4),[xx,zz]=shore(a,1.03);
   if((zz>1.20&&Math.abs(xx)<.98)||i%8===2||i%9===4)continue;
   const size=.23+.14*(.5+.5*Math.cos(i*1.7)),v=i%3;
   b.emit('pond:shore-slab-'+v,()=>boulderGeometry(v),['#858c7d','#a7a492','#92968c'][v],[xx,.37,zz],[size*1.8,size*.65,size*.94],new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),-a+1.35+.18*Math.sin(i)));
  }
  for(const a of [.07,2.39,4.68])for(let k=0;k<8;k++){
   const [xx,zz]=shore(a+.056*k,.92+.025*Math.sin(k*2)),h=.29+.17*(k%3);
   b.cylinder([xx,.34,zz],[xx+.065,.34+h,zz+.076],.014,'#819560',5);
   if(k%3===0)b.cylinder([xx+.06,.30+h,zz+.07],[xx+.074,.47+h,zz+.085],.025,'#896e49',6);
  }
  for(const [i,xx,zz,a,s] of [[0,.23,-.37,.34,1.12],[1,1.08,.17,-.87,.86],[2,-.40,.57,.63,1]]){
   b.emit('pond:koi-'+i,()=>koi(i),'#fffcf4',[xx,.296,zz],[s,s,s],new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),a));
  }
  for(let j=0;j<4;j++)b.emit('pond:lily',()=>new T.CircleGeometry(1,28,.21,5.88).rotateX(-Math.PI/2),'#879f72',[-1.34+.34*Math.cos(j*2),.425+j*.002,-.22+.48*Math.sin(j*2)],[.20,1,.17]);
  for(let j=0;j<5;j++)b.box([-.13,.53,1.37+j*.21],[1.45,.10,.194],j%2?'#aa8a62':'#b99b70');
  for(const dx of [-.72,.47])for(const dz of [1.35,2.16])b.cylinder([dx,.12,dz],[dx,.63,dz],.077,'#806949');
 });
}
