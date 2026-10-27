import type {Point,Terrain} from '../data/model';
import {inside,distance,isLand,mainCoast} from './terrain';
const cross=(a:Point,b:Point,c:Point)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
function intersect(a:Point,b:Point,c:Point,d:Point){const x=cross(a,b,c),y=cross(a,b,d),z=cross(c,d,a),w=cross(c,d,b);return x*y<=0&&z*w<=0&&Math.max(Math.min(a[0],b[0]),Math.min(c[0],d[0]))<=Math.min(Math.max(a[0],b[0]),Math.max(c[0],d[0]))+1e-8&&Math.max(Math.min(a[1],b[1]),Math.min(c[1],d[1]))<=Math.min(Math.max(a[1],b[1]),Math.max(c[1],d[1]))+1e-8;}
export function validateRing(r:Point[],name='轮廓',max=64,bound=155){
 if(r.length<3||r.length>max)throw new Error(`${name}需 3–64 个控制点。`);
 let area=0;for(let i=0;i<r.length;i++){const a=r[i],b=r[(i+1)%r.length];if(a.some(v=>!Number.isFinite(v)||Math.abs(v)>bound))throw new Error(`${name}超出 ±${bound} 边界。`);if(Math.hypot(a[0]-b[0],a[1]-b[1])<2)throw new Error(`${name}相邻点至少相距 2 米。`);area+=a[0]*b[1]-a[1]*b[0];for(let j=i+1;j<r.length;j++){if(j===i+1||(i===0&&j===r.length-1))continue;if(intersect(a,b,r[j],r[(j+1)%r.length]))throw new Error(`${name}不能自交或接触。`);}}
 if(Math.abs(area)<40)throw new Error(`${name}面积过小。`);
}
function nested(inner:Point[],outer:Point[],name:string){for(let i=0;i<inner.length;i++){const a=inner[i],b=inner[(i+1)%inner.length];if(!inside(a,outer)||distance(a,outer)<3)throw new Error(`${name}必须保持在边界内并留出至少 3 米间距。`);for(let j=0;j<outer.length;j++)if(intersect(a,b,outer[j],outer[(j+1)%outer.length]))throw new Error(`${name}边界不能相交。`);}for(const p of outer)if(distance(p,inner)<3)throw new Error(`${name}边界间距不足 3 米。`);}
export function validateContours(t:Terrain){validateRing(t.outer,'主岛',64,t.size/2-5);validateRing(t.bay,'内湾',64,t.size/2-5);validateRing(t.islet,'湾中小岛',64,t.size/2-5);nested(t.bay,t.outer,'内湾');nested(t.islet,t.bay,'湾中小岛');if(t.topology==='open-bay'){validateRing(mainCoast(t),'开放岸线',128,t.size/2-5);if(Math.hypot(t.outer[0][0]-t.outer.at(-1)![0],t.outer[0][1]-t.outer.at(-1)![1])<15||Math.hypot(t.bay[0][0]-t.bay.at(-1)![0],t.bay[0][1]-t.bay.at(-1)![1])<15)throw new Error('湾口必须保留至少 15 米开口。');}}
export type BrushMode='raise'|'lower'|'smooth'|'flatten';
export function applyBrush(t:Terrain,center:Point,mode:BrushMode,radius:number,strength:number,level:number){
 const old=[...t.heights],n=t.resolution;for(let j=0;j<n;j++)for(let i=0;i<n;i++){const x=(i/(n-1)-.5)*t.size,z=(j/(n-1)-.5)*t.size,d=Math.hypot(x-center[0],z-center[1]);if(d>radius||!isLand(t,x,z))continue;const falloff=(1-d/radius)**2,index=j*n+i,v=old[index];let target=v;
 if(mode==='raise'||mode==='lower')target=v+(mode==='raise'?1:-1)*strength*falloff;
 else if(mode==='flatten')target=v+(level-v)*Math.min(1,strength*.15*falloff);
 else {let sum=0,count=0;for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){const xx=i+dx,zz=j+dz;if(xx>=0&&xx<n&&zz>=0&&zz<n){sum+=old[zz*n+xx];count++;}}target=v+(sum/count-v)*Math.min(1,strength*.2*falloff);}
 t.heights[index]=Math.max(-.5,Math.min(100,target));
 }
}

