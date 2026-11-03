import * as T from 'three';
import type {Project,Point} from '../data/model';
import {mainCoast,isLand} from '../terrain/terrain';
import type {TerrainSurface} from './surface';

/** Narrow, irregular wet-sand ribbons only on low beaches. Cliff and artificial wall feet stay open. */
export function naturalShore(p:Project,surface:TerrainSurface){
 const vertices:number[]=[],colors:number[]=[],sand=new T.Color('#e9d6a1'),wet=new T.Color('#8c9785');
 const loops=p.terrain.campus?[mainCoast(p.terrain)]:[mainCoast(p.terrain),p.terrain.islet];
 const emit=(a:number[],b:number[],c:number[],ca:number[],cb:number[],cc:number[])=>{vertices.push(...a,...b,...c);colors.push(...ca,...cb,...cc);};
 for(const loop of loops){
  let previous:{v:number[][];c:number[][]}|undefined;
  for(let i=0;i<=loop.length;i++){
   const a=loop[i%loop.length],b=loop[(i+1)%loop.length],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),steps=Math.max(1,Math.ceil(len/1.3));
   for(let j=0;j<(i===loop.length?1:steps);j++){
    const t=j/steps,x=a[0]+dx*t,z=a[1]+dz*t;let nx=-dz/len,nz=dx/len;if(isLand(p.terrain,x+nx*.3,z+nz*.3)){nx=-nx;nz=-nz;}
    const h=surface.height(x-nx*.3,z-nz*.3);if(h===undefined||h>3.6){previous=undefined;continue;}
    const width=.95+.3*Math.sin(x*.43+z*.17)+.15*Math.sin(z*.91-x*.2),v=[[x,.89,z],[x+nx*width,.025,z+nz*width],[x+nx*(width+.8),-.1,z+nz*(width+.8)]],c=[[sand.r,sand.g,sand.b,1],[wet.r,wet.g,wet.b,.66],[wet.r,wet.g,wet.b,0]];
    if(previous)for(let k=0;k<2;k++){emit(previous.v[k],v[k],previous.v[k+1],previous.c[k],c[k],previous.c[k+1]);emit(previous.v[k+1],v[k],v[k+1],previous.c[k+1],c[k],c[k+1]);}previous={v,c};
   }
  }
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,4));const m=new T.MeshBasicMaterial({vertexColors:true,transparent:true,depthWrite:false,side:T.DoubleSide});m.userData.shore=true;const mesh=new T.Mesh(g,m);mesh.name='真实低岸线窄湿沙带';mesh.userData.noCollision=true;return mesh;
}

/** Keep the existing vegetation seed sequence stable while retiring the old white shore boxes. */
export function consumeLegacyShoreRandom(p:Project,rnd:()=>number){for(const loop of p.terrain.campus?[mainCoast(p.terrain)]:[mainCoast(p.terrain),p.terrain.islet])for(let i=0;i<loop.length;i++){const a=loop[i],b=loop[(i+1)%loop.length],steps=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/1.5);for(let j=0;j<steps;j++)if(j%3===0&&rnd()>.18){rnd();rnd();}}}
