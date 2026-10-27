import {villageHeight,villageCuts} from './village.ts';
import {scenicCoastHeight,scenicHighland,scenicCoastCuts} from './scenic-coast.ts';
import * as THREE from 'three';
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import type {Point,Terrain} from '../data/model';
import {feihuaMountainHeight,feihuaMountainCuts} from './feihua-mountain.ts';
export function inside(p:Point,poly:Point[]){let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
export function distance(p:Point,poly:Point[]){return Math.min(...poly.map((a,i)=>{const b=poly[(i+1)%poly.length],dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dz)/(dx*dx+dz*dz)));return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dz);}));}
export function mainCoast(t:Terrain):Point[]{return t.topology==='open-bay'?[...t.outer,...[...t.bay].reverse()]:t.outer;}
export function coastDistance(t:Terrain,p:Point){return t.topology==='open-bay'?Math.min(distance(p,mainCoast(t)),distance(p,t.islet)):Math.min(distance(p,t.outer),distance(p,t.bay),distance(p,t.islet));}
export function isLand(t:Terrain,x:number,z:number){return (t.topology==='open-bay'?inside([x,z],mainCoast(t)):(inside([x,z],t.outer)&&!inside([x,z],t.bay)))||inside([x,z],t.islet);}
function onCampus(t:Terrain,p:Point){return !!t.campus&&(inside(p,t.islet)||distance(p,t.islet)<.001);}
export function sampleHeight(t:Terrain,x:number,z:number){
  if(!isLand(t,x,z)){if(t.scenicCoast&&scenicHighland(t,x,z)&&distance([x,z],mainCoast(t))<.001)return scenicCoastHeight(t,x,z,.9);if(t.campus&&distance([x,z],t.islet)<.001)return t.campus.level;return 0;}
  const n=t.resolution,u=Math.max(0,Math.min(n-1,(x/t.size+.5)*(n-1))),v=Math.max(0,Math.min(n-1,(z/t.size+.5)*(n-1))),ix=Math.min(n-2,Math.floor(u)),iz=Math.min(n-2,Math.floor(v)),a=u-ix,b=v-iz;
  const h=(1-b)*((1-a)*t.heights[iz*n+ix]+a*t.heights[iz*n+ix+1])+b*((1-a)*t.heights[(iz+1)*n+ix]+a*t.heights[(iz+1)*n+ix+1]);
  const d=inside([x,z],t.islet)?distance([x,z],t.islet):coastDistance(t,[x,z]);
  let height=.9+h*(t.campus&&inside([x,z],t.islet)?1:Math.min(1,d/9));
  if(t.landscapeRevision){
   // Low, sandy southeast promontory; the existing eastern cliff stays outside this patch.
   const beach=Math.max(0,1-((x-132)/31)**2-((z-132)/24)**2);
   if(beach>0)height=height*(1-Math.min(1,beach*2))+1.35*Math.min(1,beach*2);
   const g=t.grading;
   if(g){
    const [minX,maxX,minZ,maxZ]=g.baseRect,dx=Math.max(minX-x,0,x-maxX),dz=Math.max(minZ-z,0,z-maxZ),db=Math.hypot(dx,dz);
    const vx=g.hill[0]-g.base[0],vz=g.hill[1]-g.base[1],length=Math.hypot(vx,vz)||1;
    const along=((x-g.base[0])*vx+(z-g.base[1])*vz)/length,cross=Math.abs((x-g.base[0])*vz-(z-g.base[1])*vx)/length;
    const u=Math.max(0,Math.min(1,(along-10)/Math.max(12,length-16))),s=u*u*(3-2*u);
    const slope=g.baseLevel+(g.hillLevel-g.baseLevel)*s;
    const flat=Math.max(0,1-db/12),corridor=Math.max(0,Math.min(1,(38-cross)/16))*Math.max(0,Math.min(1,(length+28-along)/20))*Math.max(0,Math.min(1,(along+20)/15));
    const target=slope*(1-flat)+g.baseLevel*flat,weight=Math.max(flat,corridor);
    height=height*(1-weight)+target*weight;
   }
  }
  // Flat bearing surfaces beneath the entire model footprint, with soft earth transitions.
  for(const p of t.pads||[])if(x>=p.minX&&x<=p.maxX&&z>=p.minZ&&z<=p.maxZ)return feihuaMountainHeight(t,x,z,p.level);
  let sum=0,weight=0,maxWeight=0;
  for(const p of t.pads||[]){const dx=Math.max(p.minX-x,0,x-p.maxX),dz=Math.max(p.minZ-z,0,z-p.maxZ),r=Math.hypot(dx,dz);if(r>=p.feather)continue;const u=1-r/p.feather,f=u*u*(3-2*u);const w=f/(r+.1)**2;sum+=p.level*w;weight+=w;maxWeight=Math.max(maxWeight,f);}
  if(weight)height=height*(1-maxWeight)+sum/weight*maxWeight;
  return villageHeight(t,x,z,scenicCoastHeight(t,x,z,feihuaMountainHeight(t,x,z,height)));
}
export function terrainGeometry(t:Terrain,beautify=false){
  const vertices:number[]=[],colors:number[]=[]; const sand=new THREE.Color('#e9d6a1'),grass=new THREE.Color('#8aa975'),high=new THREE.Color('#969789'),peak=new THREE.Color('#c2c2b5');
  function emit(a:Point,b:Point,c:Point){
   if(Math.abs((b[0]-a[0])*(c[1]-a[1])-(c[0]-a[0])*(b[1]-a[1]))<1e-10)return;
   for(const p of [a,c,b]){const d=coastDistance(t,p),h=d<.001&&!onCampus(t,p)&&!scenicHighland(t,...p)?.9:sampleHeight(t,...p);vertices.push(p[0],h,p[1]);const beach=t.landscapeRevision&&((p[0]-132)/31)**2+((p[1]-132)/24)**2<1;const color=(d<3.5&&!scenicHighland(t,...p))||beach?sand:grass.clone().lerp(high,Math.max(0,Math.min(1,(h-16)/20))).lerp(peak,Math.max(0,Math.min(1,(h-35)/15)));if(beautify&&d>=3.5&&!beach){const patch=Math.sin(p[0]*.075+Math.sin(p[1]*.08))*Math.cos(p[1]*.065)*.5+.5;color.lerp(new THREE.Color(patch>.48?'#789a59':'#b0bd7d'),.32);if(p[0]<-105&&h>25)color.lerp(new THREE.Color('#9b9b87'),Math.min(.8,(h-25)/20));}colors.push(color.r,color.g,color.b);}
  }
  // Insert terrace boundaries into the actual mesh, not just the height sampler.
  // Otherwise a large triangle straddling a pad can lift through a floor or leave an air gap.
  const cuts=[...new Set((t.pads||[]).flatMap(p=>[p.minX,p.maxX]))].map(v=>[0,v]).concat([...new Set((t.pads||[]).flatMap(p=>[p.minZ,p.maxZ]))].map(v=>[1,v])).concat(feihuaMountainCuts(t)).concat(scenicCoastCuts(t)).concat(villageCuts(t));
  function terraceTriangles(a:Point,b:Point,c:Point){
   let polygons:Point[][]=[[a,b,c]];const minX=Math.min(a[0],b[0],c[0]),maxX=Math.max(a[0],b[0],c[0]),minZ=Math.min(a[1],b[1],c[1]),maxZ=Math.max(a[1],b[1],c[1]);
   // Extend each cut through every crossed triangle so neighbouring edges have identical vertices.
   // Local rectangle-only cuts create T junctions and visible water cracks on graded slopes.
   for(const [axis,value] of cuts){
    if(value<=(axis===0?minX:minZ)||value>=(axis===0?maxX:maxZ))continue;
     const next:Point[][]=[];
     for(const poly of polygons){
      if(!poly.some(v=>v[axis]<value-1e-8)||!poly.some(v=>v[axis]>value+1e-8)){next.push(poly);continue;}
      const left:Point[]=[],right:Point[]=[];
      for(let i=0;i<poly.length;i++){
       const x=poly[i],y=poly[(i+1)%poly.length],dx=x[axis]-value,dy=y[axis]-value;
       if(dx<=0)left.push(x);if(dx>=0)right.push(x);
       if(dx*dy<0){const u=dx/(dx-dy),v:Point=[x[0]+u*(y[0]-x[0]),x[1]+u*(y[1]-x[1])];left.push(v);right.push(v);}
      }
      if(left.length>=3)next.push(left);if(right.length>=3)next.push(right);
     }
     polygons=next;
   }
   for(const poly of polygons)for(let i=1;i<poly.length-1;i++)emit(poly[0],poly[i],poly[i+1]);
  }
  function triangle(a:Point,b:Point,c:Point,depth:number){if(depth){const ab:Point=[(a[0]+b[0])/2,(a[1]+b[1])/2],bc:Point=[(b[0]+c[0])/2,(b[1]+c[1])/2],ca:Point=[(c[0]+a[0])/2,(c[1]+a[1])/2];triangle(a,ab,ca,depth-1);triangle(ab,b,bc,depth-1);triangle(ca,bc,c,depth-1);triangle(ab,bc,ca,depth-1);return;}
    terraceTriangles(a,b,c);}
  for(const [outer,holes] of [[mainCoast(t),t.topology==='open-bay'?[]:[t.bay]],[t.islet,[]]] as [Point[],Point[][]][]){const contour=outer.map(p=>new THREE.Vector2(...p)),hs=holes.map(r=>r.map(p=>new THREE.Vector2(...p)));const all=[...outer,...holes.flat()];THREE.ShapeUtils.triangulateShape(contour,hs).forEach(ids=>triangle(all[ids[0]],all[ids[1]],all[ids[2]],t.heightmapRevision?5:4));}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));if(beautify){const merged=mergeVertices(g,.0001);g.dispose();merged.computeVertexNormals();return merged;}g.computeVertexNormals();return g;
}
export function updateTerrainHeights(g:THREE.BufferGeometry,t:Terrain){const pos=g.getAttribute('position'),colors=g.getAttribute('color'),sand=new THREE.Color('#e9d6a1'),grass=new THREE.Color('#8aa975'),high=new THREE.Color('#768f70');for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i),d=coastDistance(t,[x,z]),h=d<.001&&!onCampus(t,[x,z])&&!scenicHighland(t,x,z)?.9:sampleHeight(t,x,z);pos.setY(i,h);const c=d<3.5&&!scenicHighland(t,x,z)?sand:h>21?high:grass;colors.setXYZ(i,c.r,c.g,c.b);}pos.needsUpdate=true;colors.needsUpdate=true;g.computeVertexNormals();g.computeBoundingSphere();}

