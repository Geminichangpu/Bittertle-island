import * as T from 'three';
import {Builder} from './shrine.ts';
type V=[number,number,number];

/** Static, closed slate roof: visible edge thickness, courses, ridge, fascia and rafters. */
export function slateRoof(b:Builder,p:V,w:number,d:number,h:number,color:string,angle=0){
 b.scoped(p,angle,()=>{
  b.emit(`detail:slate:${w}:${d}:${h}`,()=>{
   const v:number[]=[],ix:number[]=[];
   const quad=(a:V,c:V,e:V,f:V)=>{const n=v.length/3;v.push(...a,...c,...e,...f);ix.push(n,n+1,n+2,n,n+2,n+3);};
   for(const s of [-1,1]){
    quad([-s*w/2,0,s*d/2],[s*w/2,0,s*d/2],[s*w/2,h,0],[-s*w/2,h,0]);
    quad([-s*w/2,-.2,s*d/2],[-s*w/2,h-.2,0],[s*w/2,h-.2,0],[s*w/2,-.2,s*d/2]);
    quad([-s*w/2,0,s*d/2],[-s*w/2,-.2,s*d/2],[s*w/2,-.2,s*d/2],[s*w/2,0,s*d/2]);
    for(const end of [-1,1])quad([end*w/2,0,s*d/2],[end*w/2,-.2,s*d/2],[end*w/2,h-.2,0],[end*w/2,h,0]);
   }
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setIndex(ix);g.computeVertexNormals();return g;
  },color,[0,0,0]);
  for(const s of [-1,1]){
   b.box([0,-.12,s*d/2],[w,.25,.2],'#604a35');
   for(let i=1;i<9;i++){const u=i/9;b.cylinder([-w/2,h*u+.025,s*d/2*(1-u)],[w/2,h*u+.025,s*d/2*(1-u)],.035,'#66676a',6);}
   for(let x=-w/2+.2;x<w/2;x+=.55){b.beam([x,-.24,s*d/2],[x,h*.28-.22,s*d*.36],.11,'#967146');}
   for(const x of [-w/2,w/2])b.beam([x,-.12,s*d/2],[x,h-.12,0],.2,'#775838');
  }
  b.box([0,h+.035,0],[w+.18,.15,.26],color);
 });
}

export function crate(b:Builder,x:number,y:number,z:number,w:number,d:number,color='#a67c43'){
 b.box([x,y+.1,z],[w,.2,d],color);
 for(const s of [-1,1])for(const yy of [.22,.48]){b.box([x,y+yy,z+s*d/2],[w,.18,.09],color);b.box([x+s*w/2,y+yy,z],[.09,.18,d],color);}
 for(const sx of [-1,1])for(const sz of [-1,1])b.box([x+sx*w/2,y+.32,z+sz*d/2],[.13,.64,.13],'#755335');
}

export function paneFrame(b:Builder,w:number,h:number,z:number,wood='#72523a'){
 for(const x of [-w/2,w/2])b.box([x,0,z],[.13,h+.3,.22],wood);
 for(const y of [-h/2,h/2])b.box([0,y,z],[w+.3,.14,.24],wood);
 b.box([0,-h/2-.16,z+.12],[w+.5,.14,.5],'#a07d51');
}
