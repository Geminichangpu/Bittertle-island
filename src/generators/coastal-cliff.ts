import * as T from 'three';
import {COAST_EDGE} from '../data/scenic-site.ts';

/** One joined, fissured rock mass. No stacked stone courses or water gaps. */
export function cliffSections(){
 const points:{x:number;z:number;nx:number;nz:number;u:number}[]=[];let distance=0;
 for(let i=0;i<COAST_EDGE.length-1;i++){
  const a=COAST_EDGE[i],b=COAST_EDGE[i+1],length=Math.hypot(b[0]-a[0],b[1]-a[1]),steps=Math.ceil(length/1.05);
  for(let j=0;j<steps;j++){const t=j/steps;points.push({x:a[0]+(b[0]-a[0])*t,z:a[1]+(b[1]-a[1])*t,nx:0,nz:0,u:distance+t*length});}
  distance+=length;
 }
 const last=COAST_EDGE.at(-1)!;points.push({x:last[0],z:last[1],nx:0,nz:0,u:distance});
 points.forEach((p,i)=>{const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],len=Math.hypot(b.x-a.x,b.z-a.z);p.nx=(b.z-a.z)/len;p.nz=-(b.x-a.x)/len;});
 return points;
}
function geometry(vertices:number[],uv:number[],indices:number[]){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;}
export function naturalCliffGeometry(height:number){
 const points=cliffSections(),vertices:number[]=[],uv:number[]=[],indices:number[]=[],rows=12;
 for(let i=0;i<points.length;i++){
  const p=points[i];
  for(let j=0;j<=rows;j++){
   const t=j/rows,envelope=Math.sin(Math.PI*t),rib=.75*Math.sin(p.u*1.7)+.32*Math.sin(p.u*4.3);
   const out=envelope*(.6+rib+.25*Math.sin(p.u*.43+j*1.8))+.42*t;
   const y=.035-(height+1.6)*t+envelope*.35*Math.sin(p.u*.9+j*2.3);
   vertices.push(p.x+p.nx*out,y,p.z+p.nz*out);uv.push(p.u/5.5,-y/5.5);
  }
 }
 const stride=rows+1;
 for(let i=0;i<points.length-1;i++)for(let j=0;j<rows;j++){const a=i*stride+j,b=a+stride;indices.push(a,b,a+1,b,b+1,a+1);}
 // Close the hidden back, bottom and both ends. All face vertices remain connected.
 const back=vertices.length/3;
 for(const p of points){vertices.push(p.x-p.nx*3,-.14,p.z-p.nz*3,p.x-p.nx*3,-height-1.565,p.z-p.nz*3);uv.push(p.u/5.5,0,p.u/5.5,height/5.5);}
 for(let i=0;i<points.length-1;i++){
  const a=i*stride,b=a+stride,c=back+i*2,d=c+2;
  indices.push(c,c+1,d,d,c+1,d+1,a+rows,b+rows,c+1,c+1,b+rows,d+1,a,c,b,b,c,d);
 }
 for(const i of [0,points.length-1]){const a=i*stride,c=back+i*2;for(let j=0;j<rows;j++)indices.push(c,a+j,a+j+1);indices.push(c,a+rows,c+1);}
 return geometry(vertices,uv,indices);
}
export function cliffLipGeometry(){
 const points=cliffSections(),v:number[]=[],uv:number[]=[],idx:number[]=[];
 for(const p of points){const width=3.2+.65*Math.sin(p.u*.73)+.4*Math.sin(p.u*1.91);for(const inset of [0,width]){const x=p.x-p.nx*inset,z=p.z-p.nz*inset;v.push(x,.055,z);uv.push(x/3,z/3);}}
 for(let i=0;i<points.length-1;i++){const a=i*2;idx.push(a,a+1,a+2,a+2,a+1,a+3);}
 return geometry(v,uv,idx);
}
export function cliffGroundGeometry(){
 const outline=[...COAST_EDGE,[0,32],[-20,25],[-23,9],[-19,-14]];
 const v:number[]=[],uv:number[]=[],idx:number[]=[];
 // Its bearing plane is the same continuous 14 m terrain as the shrine.
 for(const p of outline){v.push(p[0],.025,p[1]);uv.push(p[0]/14,p[1]/14);}
 for(const [a,b,c] of T.ShapeUtils.triangulateShape(outline.map(p=>new T.Vector2(p[0],p[1])),[]))idx.push(a,c,b);
 return geometry(v,uv,idx);
}
