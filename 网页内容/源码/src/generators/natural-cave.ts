import * as T from 'three';
import type {IslandObject} from '../data/model.ts';
import {Builder,type Cache} from './shrine.ts';

/** A small modeled hill containing a closed-back, walk-in rock chamber. */
export function makeNaturalCave(_o:IslandObject,cache:Cache){
 const b=new Builder(cache);
 const outer:[number,number][]=[[-6,0],[-5.1,3.4],[-2.8,5.8],[-.7,6.3],[1.6,6.0],[4.7,4.4],[6,0]];
 const inner:[number,number][]=[[-2.45,0],[-2.2,2.2],[-1.55,3.6],[-.65,4.35],[.65,4.25],[1.8,3.3],[2.45,0]];
 const make=(part:'face'|'shell'|'inside'|'back')=>()=>{const v:number[]=[],idx:number[]=[];const quad=(a:number[],c:number[],d:number[],e:number[])=>{let n=v.length/3;v.push(...a,...c,...d,...e);idx.push(n,n+1,n+2,n,n+2,n+3);};const tri=(a:number[],c:number[],d:number[])=>{let n=v.length/3;v.push(...a,...c,...d);idx.push(n,n+1,n+2);};
  for(let i=0;i<outer.length-1;i++){const [ox,oy]=outer[i],[px,py]=outer[i+1],[ix,iy]=inner[i],[jx,jy]=inner[i+1];
   if(part==='face')quad([ox,oy,5],[px,py,5],[jx,jy,5],[ix,iy,5]);
   if(part==='shell'){const mid=(x:number,y:number,n:number)=>[x*(1.02+Math.sin(n*1.7)*.09),y*(.92+Math.cos(n*2.1)*.1),-.8+Math.sin(n)*.7];const a=mid(ox,oy,i),c=mid(px,py,i+1);quad([ox,oy,5],a,c,[px,py,5]);quad(a,[ox*.58,oy*.58,-6],[px*.58,py*.58,-6],c);}
   if(part==='inside')quad([ix,iy,5],[jx,jy,5],[jx*.76,jy*.83,-2.7],[ix*.76,iy*.83,-2.7]);
   if(part==='back')tri([ix*.76,iy*.83,-2.7],[jx*.76,jy*.83,-2.7],[0,1.7,-4.2]);
  }
  if(part==='back')tri([inner[inner.length-1][0]*.76,0,-2.7],[inner[0][0]*.76,0,-2.7],[0,1.7,-4.2]);
  if(part==='shell')for(let i=0;i<outer.length-1;i++)tri([outer[i][0]*.58,outer[i][1]*.58,-6],[outer[i+1][0]*.58,outer[i+1][1]*.58,-6],[0,.2,-7.2]);
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setIndex(idx);g.computeVertexNormals();return g;};
 b.emit('town:cave-face',make('face'),'#a8aba0',[0,0,0]);b.emit('town:cave-shell',make('shell'),'#899388',[0,0,0]);b.emit('town:cave-interior',make('inside'),'#666f68',[0,0,0]);b.emit('town:cave-back',make('back'),'#515a55',[0,0,0]);
 // Asymmetric rock outcrops break up the regular shell while leaving the mouth clear.
 for(const [x,y,z,sx,sy,sz,color] of [[-4.9,1.1,2.2,2.3,2.1,2.5,'#8c958a'],[4.9,.9,2.0,2.5,1.8,2.9,'#9ba397'],[-4.7,1,-2.6,2.8,1.7,3.1,'#929d8d'],[4.5,.9,-3.5,2.5,1.9,2.8,'#8c9889'],[-2.5,.7,-5.5,3,1.5,1.8,'#96a091'],[2.4,.9,-5.4,2.8,1.7,2,'#899587']] as [number,number,number,number,number,number,string][])b.emit('town:cave-outcrop',()=>new T.IcosahedronGeometry(1,1),color,[x,y,z],[sx,sy,sz]);
 // Irregular moss patches and sparse hanging tendrils frame, rather than obscure, the entrance.
 for(let i=0;i<19;i++){const z=-4.4+Math.floor(i/7)*3.4,scale=.82+(z+6)/11*.18,x=(-4.3+(i%7)*1.4+Math.sin(i*1.7)*.24)*scale,local=x/scale;let k=0;while(k<outer.length-2&&outer[k+1][0]<local)k++;const [ax,ay]=outer[k],[bx,by]=outer[k+1],y=(ay+(by-ay)*(local-ax)/(bx-ax))*scale+.04;b.emit('town:cave-moss',()=>new T.IcosahedronGeometry(1,0),i%3?'#789168':'#93a27a',[x,y,z],[.85,.12,.65]);}
 for(let i=0;i<7;i++){const x=-2.2+i*.72,y=4.25-Math.abs(x)*.25,z=5.06,end=y-.65-(i%3)*.28;b.cylinder([x,y,z],[x+Math.sin(i)*.16,end,z],.035,'#617c55',6);for(let k=0;k<2;k++)b.emit('town:cave-vine-leaf',()=>new T.IcosahedronGeometry(1,0),k?'#78956a':'#8da678',[x+(k?-.14:.14),y-.28-k*.43,z],[.18,.22,.09]);}
 const root=b.finish();root.name='natural-cave-chamber';root.traverse(n=>{if(n instanceof T.Mesh){n.userData.noCollision=true;for(const m of Array.isArray(n.material)?n.material:[n.material]){m.side=T.DoubleSide;}}});
 // Rendering uses the hollow shell; lightweight invisible boxes provide open-centre walk collision.
 const proxy=(x:number,y:number,z:number,w:number,h:number,d:number)=>{const mesh=new T.Mesh(cache.geo('town:cave-collision-box',()=>new T.BoxGeometry(1,1,1)),cache.mat('#515a55'));mesh.position.set(x,y,z);mesh.scale.set(w,h,d);mesh.visible=false;mesh.userData.caveCollisionProxy=true;root.add(mesh);};
 proxy(-3.15,2.0,.7,1.2,4,8.6);proxy(3.15,2.0,.7,1.2,4,8.6);proxy(0,1.8,-3.5,5,3.6,.6);proxy(0,4.55,.3,5,.5,7.5);
 return root;
}
