import * as T from 'three';

/** Shared 176-triangle leaf sprays replace the 180-triangle solid balls.
 * Opaque folded leaves need neither alpha blending nor additional textures/draw calls. */
export function crownGeometry(){
 const vertices:number[]=[],colors:number[]=[];
 for(let i=0;i<44;i++){
  const a=i*2.399963,lobe=i%5,spread=.32+.5*((i*17)%43)/43;
  const center=new T.Vector3(Math.cos(a)*spread,Math.sin(i*1.7)*.4+(lobe===0?.3:0),Math.sin(a)*spread*.88);
  const direction=new T.Vector3(Math.cos(a+.45)*.65,.15+Math.sin(i*.7)*.25,Math.sin(a+.45)*.65).normalize();
  const across=new T.Vector3(-direction.z,.1*Math.cos(i),direction.x).normalize(),length=.55+(i%4)*.09,width=.22+(i%3)*.035;
  const base=center.clone().addScaledVector(direction,-length*.46),tip=center.clone().addScaledVector(direction,length*.54);
  const left=center.clone().addScaledVector(across,width),right=center.clone().addScaledVector(across,-width),ridge=center.clone().add(new T.Vector3(0,.07,0));
  for(const triangle of [[base,left,ridge],[left,tip,ridge],[tip,right,ridge],[right,base,ridge]])for(const v of triangle){vertices.push(v.x,v.y,v.z);const shade=.73+.19*(v.y+1)/2+(i%3)*.035;colors.push(shade,shade,shade);}
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();return g;
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
