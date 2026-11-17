import type {BufferGeometry} from 'three';

/** Spatially indexed barycentric height of the actual rendered terrain, including terraces. */
export class TerrainSurface {
 private bins=new Map<string,number[]>();
 private triangles:number[][]=[];
 constructor(geometry:BufferGeometry){
  const p=geometry.getAttribute('position'),idx=geometry.index,at=(i:number)=>idx?idx.getX(i):i;
  for(let i=0;i<(idx?.count||p.count);i+=3){
   const a=at(i),b=at(i+1),c=at(i+2),t=[p.getX(a),p.getZ(a),p.getY(a),p.getX(b),p.getZ(b),p.getY(b),p.getX(c),p.getZ(c),p.getY(c)];
   const id=this.triangles.length;this.triangles.push(t);
   for(let x=Math.floor(Math.min(t[0],t[3],t[6])/5);x<=Math.floor(Math.max(t[0],t[3],t[6])/5);x++)for(let z=Math.floor(Math.min(t[1],t[4],t[7])/5);z<=Math.floor(Math.max(t[1],t[4],t[7])/5);z++){const key=x+','+z;let bin=this.bins.get(key);if(!bin)this.bins.set(key,bin=[]);bin.push(id);}
  }
 }
 height(x:number,z:number):number|undefined{
  for(const i of this.bins.get(Math.floor(x/5)+','+Math.floor(z/5))||[]){
   const t=this.triangles[i],den=(t[4]-t[7])*(t[0]-t[6])+(t[6]-t[3])*(t[1]-t[7]);if(Math.abs(den)<1e-10)continue;
   const a=((t[4]-t[7])*(x-t[6])+(t[6]-t[3])*(z-t[7]))/den,b=((t[7]-t[1])*(x-t[6])+(t[0]-t[6])*(z-t[7]))/den,c=1-a-b;
   if(a>=-1e-6&&b>=-1e-6&&c>=-1e-6)return a*t[2]+b*t[5]+c*t[8];
  }
 }
}
