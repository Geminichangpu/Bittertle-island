import {makeNaturalCave} from './natural-cave.ts';
import * as T from 'three';
import {Builder,type Cache} from './shrine.ts';
import {slateRoof,crate} from './details.ts';
import type {IslandObject} from '../data/model.ts';

/** Small editable outdoor landmarks; the cave is an open, constructed rock tunnel. */
export function makeTownMesh(o:IslandObject,cache:Cache){
 if(o.templateId==='layout_island_cave')return makeNaturalCave(o,cache);
 const b=new Builder(cache),{width:w,depth:d,wallHeight:h,wallColor:wall,roofColor:roof}=o.params,wood='#79583d',stone='#a5a79b',blue='#648faf';
 const box=(p:[number,number,number],s:[number,number,number],c:string)=>b.box(p,s,c);
 const roofed=(x:number,z:number,ww:number,dd:number,hh:number)=>{box([x,.25,z],[ww+.4,.5,dd+.4],stone);box([x,hh/2+.5,z],[ww,hh,dd],wall);slateRoof(b,[x,hh+.5,z],ww+1.8,dd+1.8,1.55,roof);};
 const planters=(x:number,z:number)=>{for(let i=0;i<3;i++){box([x+i*.65,.24,z],[.43,.48,.43],'#aa7656');b.ball([x+i*.65,.65,z],[.28,.35,.28],i%2?'#8dad6a':'#b4ba78');}};
 if(o.templateId==='layout_island_house'||o.templateId==='layout_island_restaurant'){
  const shop=o.templateId==='layout_island_restaurant',dd=d*.65,z=-d*.12;roofed(0,z,w,dd,h);
  // Light plaster, deep timber veranda and sliding panels.
  for(const x of [-w*.43,w*.43])b.box([x,h/2+.5,z+dd*.5+.15],[.14,h,.14],wood);
  b.box([0,.58,z+dd*.5+.72],[w*.9,.18,1.6],'#aa845c');
  for(const x of [-w*.4,0,w*.4])b.box([x,1.9,z+dd*.5+1.35],[.13,2.7,.13],wood);
  b.box([0,3.25,z+dd*.5+.75],[w*.95,.15,1.7],roof);
  for(let j=0;j<4;j++){const x=(j-1.5)*w*.19;box([x,1.8,z+dd*.5+.12],[w*.18,2.4,.1],j===1?'#7694a1':'#c8d7d2');box([x,1.8,z+dd*.5+.2],[.07,2.4,.08],wood);box([x,1.65,z+dd*.5+.23],[w*.18,.07,.07],wood);}
  for(let i=0;i<6;i++){const x=(i-2.5)*w*.15;box([x,.08,d*.42],[w*.13,.16,.75],i%2?'#bcbdb1':'#d0ccc0');}
  planters(-w*.36,d*.43);
  for(const x of [-w*.48,w*.48])box([x,.35,d*.32],[.25,.7,d*.34],'#b3b2a6');
  if(shop){for(let i=0;i<7;i++)box([-w*.45+i*w*.15,3,z+dd*.5+1.8],[w*.14,.12,1.5],i%2?'#7599b7':'#f4eee0');for(const x of [-w*.25,w*.25]){b.cylinder([x,0,d*.42],[x,1,d*.42],.1,wood,8);box([x,1.05,d*.42],[1.6,.15,1.2],'#b18d68');for(const dx of [-.9,.9])box([x+dx,.45,d*.42],[.5,.12,.5],wood);}}
 }else if(o.templateId==='layout_island_park'){
  box([0,.06,0],[w,.12,d],'#dbca9d');
  for(const side of [-1,1]){b.beam([-w*.32,.05,side*2.5],[-w*.32,3.4,0],.16,blue);b.beam([w*.12,.05,side*2.5],[w*.12,3.4,0],.16,blue);}b.box([-w*.1,3.4,0],[w*.48,.2,.2],blue);
  for(const x of [-w*.22,0]){for(const dx of [-.4,.4])b.cylinder([x+dx,3.35,0],[x+dx,1.1,0],.025,'#8d9090',5);box([x,1.05,0],[.9,.12,.5],'#c27e59');}
  for(const x of [w*.24,w*.38])for(const z of [-2,-.4])b.box([x,1.35,z],[.12,2.7,.12],wood);box([w*.31,2.7,-1.2],[w*.2,.18,2.2],'#c2a77b');b.beam([w*.31,2.7,-.3],[w*.31,.25,2.8],1.0,'#e9a868');
  box([0,.4,-d*.43],[3,.15,.8],wood);for(const x of [-1,1])box([x,.2,-d*.43],[.15,.4,.7],wood);
  for(let x=-w*.45;x<=w*.45;x+=1.6)for(const z of [-d*.49,d*.49])b.ball([x,.45,z],[.9,.65,.7],'#71945e');
 }else if(o.templateId==='layout_island_station'){
  box([0,.12,0],[w,.24,d],'#d0cbbc');for(const x of [-w*.45,w*.45])for(const z of [-d*.36,d*.36])box([x,1.5,z],[.16,3,.16],'#e8e9e0');slateRoof(b,[0,3,0],w+.8,d+.8,.8,blue);box([0,.65,-d*.25],[w*.7,.15,.65],blue);for(const x of [-w*.3,w*.3])box([x,.34,-d*.25],[.15,.65,.6],'#ece9dd');b.cylinder([w*.6,0,d*.2],[w*.6,3,d*.2],.08,wood,8);box([w*.6,2.8,d*.2],[1,.65,.1],'#eae9dc');box([w*.6,2.95,d*.27],[.85,.22,.04],blue);
 }else if(o.templateId==='layout_island_pier'){
  // Open central walkway, segmented timber deck, mooring posts and working fishing details.
  for(let i=0;i<22;i++){const z=-d*.47+(i+.5)*d*.94/22;box([0,.55,z],[w,.17,d*.94/22-.035],i%3?'#bc986c':'#d0ae7e');}
  for(const x of [-w*.4,w*.4]){box([x,.39,0],[.18,.2,d*.95],wood);for(let i=0;i<5;i++){const z=-d*.43+i*d*.215;b.cylinder([x,-1.7,z],[x,1.22,z],.13,wood,10);b.cylinder([x,1.22,z],[x,1.3,z],.18,'#d1b185',10);}}
  // Short rails frame the seaward end; the landward entrance stays open.
  for(const side of [-1,1]){for(let i=0;i<4;i++){const z=d*.05+i*d*.13;box([side*w*.47,1.1,z],[.1,1.0,.1],wood);}box([side*w*.47,1.55,d*.245],[.12,.12,d*.48],wood);}
  for(const side of [-1,1]){b.cylinder([side*w*.37,.72,-d*.22],[side*w*.37,.83,-d*.22],.16,'#535b57',8);b.cylinder([side*w*.37-.25,.83,-d*.22],[side*w*.37+.25,.83,-d*.22],.06,'#535b57',8);}
  crate(b,-w*.33,.67,-d*.36,.85,.8);crate(b,w*.33,.67,-d*.36,.75,.75);box([-w*.34,1.18,-d*.36],[.8,.12,.68],'#698e91');
  // Small timber boat floats at sea level alongside the seaward half of the pier.
  const waterY=-o.position[1]+.16,bx=w*.83,bz=d*.52;
  b.emit('town:fishing-hull',()=>{const g=new T.BufferGeometry(),v=[-1,0,-1.7,1,0,-1.7,-.8,0,1.1,.8,0,1.1,0,0,2.1,-.8,.48,-1.5,.8,.48,-1.5,-.62,.48,1.0,.62,.48,1.0,0,.48,1.9];g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setIndex([0,1,6,0,6,5,1,3,8,1,8,6,3,4,9,3,9,8,4,2,7,4,7,9,2,0,5,2,5,7,0,2,4,0,4,3,0,3,1]);g.computeVertexNormals();return g;},'#a65d40',[bx,waterY,bz],[1,1,1]);
  box([bx,waterY+.45,bz-.35],[1.5,.12,.28],'#e8d3ad');box([bx,waterY+.47,bz+.55],[1.25,.12,.25],'#e8d3ad');
  b.cylinder([bx-.8,waterY+.5,bz+1.1],[w*.38,.9,d*.4],.035,'#d8c596',6);
  for(let i=0;i<3;i++){const z=-d*.05+i*1.1;b.cylinder([w*.48,.72,z],[w*.48,.3,z],.1,'#464f4e',8);}
 }else if(o.templateId==='layout_island_cave'){
  // Boulders form a short tunnel with an actual open centre and a vine-covered rim.
  for(const side of [-1,1])for(let k=0;k<3;k++){const z=-d*.33+k*d*.33;b.ball([side*w*.36,1.8,z],[w*.22,2.8,d*.24],k%2?'#8b9182':'#a0a291');}
  for(let k=0;k<4;k++){const z=-d*.38+k*d*.25;b.ball([0,4.8,z],[w*.5,1.8,d*.23],k%2?'#8f9587':'#a3a597');}
  for(let i=0;i<34;i++){const x=-w*.44+(i%9)*w*.11+Math.sin(i*2.4)*.24,z=-d*.43+Math.floor(i/9)*d*.26+Math.cos(i*1.7)*.28,y=6.55+Math.sin(i*2.4)*.25;b.emit('town:cave-leaf',()=>new T.IcosahedronGeometry(1,0),i%3?'#718c55':'#8da66b',[x,y,z],[.85,.28,.72]);}
  for(let i=0;i<10;i++){const x=-w*.45+i*w*.1,z=d*.51; b.cylinder([x,5,z],[x+Math.sin(i)*.22,3.3-(i%3)*.3,z],.045,'#57764b',6);for(let k=0;k<3;k++)b.ball([x+(k%2?.2:-.2),4.6-k*.5,z],[.22,.17,.1],k%2?'#789655':'#688a53');}
 }
 const root=b.finish();root.traverse(n=>{if(n instanceof T.Mesh&&n.geometry.userData.sourceKey==='town:cave-leaf')n.userData.noCollision=true;});return root;
}
