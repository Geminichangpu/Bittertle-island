import * as T from 'three';

/** Shared, deterministic silhouettes. No extra random draws change the island planting plan. */
export function crownGeometry(){
 const g=new T.IcosahedronGeometry(1,2),p=g.getAttribute('position'),colors:number[]=[];
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),y=p.getY(i),z=p.getZ(i),r=1+.075*Math.sin(x*17+z*13)*Math.sin(y*15-z*9);
  p.setXYZ(i,x*r,y*r,z*r);
  const shade=.79+.17*(y+1)/2+.04*Math.sin(x*22+z*19);colors.push(shade,shade,shade);
 }
 g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();return g;
}
export function boulderGeometry(variant=0){
 const g=new T.IcosahedronGeometry(1,2),p=g.getAttribute('position');
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
  const r=1+.11*Math.sin(x*7+variant)*Math.cos(z*9-y*6)+.045*Math.sin(y*19+x*11);
  p.setXYZ(i,x*r,Math.max(-.62,y*r),z*r);
 }
 g.computeVertexNormals();return g;
}
/** Five curved leaf blades, folded around their midribs, batched as a single sprig. */
export function leafSprigGeometry(){
 const positions:number[]=[],colors:number[]=[];
 for(let leaf=0;leaf<5;leaf++){
  const a=leaf*2.4,ox=Math.cos(a)*.08,oz=Math.sin(a)*.08,len=.42+(leaf%2)*.16;
  const rows:T.Vector3[][]=[];
  for(let i=0;i<=4;i++){
   const t=i/4,width=Math.sin(t*Math.PI)*.13;
   rows.push([-1,0,1].map(side=>new T.Vector3(ox+Math.cos(a)*t*len-Math.sin(a)*width*side,leaf*.055+Math.sin(t*Math.PI)*.12+(side===0?.025:0),oz+Math.sin(a)*t*len+Math.cos(a)*width*side)));
  }
  for(let i=0;i<4;i++)for(let j=0;j<2;j++)for(const v of [rows[i][j],rows[i+1][j],rows[i][j+1],rows[i][j+1],rows[i+1][j],rows[i+1][j+1]]){positions.push(v.x,v.y,v.z);const s=.82+(leaf%3)*.07;colors.push(s,s,s);}
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();return g;
}
