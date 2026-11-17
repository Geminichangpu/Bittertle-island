import * as T from 'three';

/** Folded opaque leaflets: one shared frond, without alpha cards or image downloads. */
export function palmFrondGeometry(){
 const positions:number[]=[],colors:number[]=[];
 const put=(a:T.Vector3,b:T.Vector3,c:T.Vector3,shade:number)=>{for(const v of [a,b,c]){positions.push(v.x,v.y,v.z);colors.push(shade,shade,shade);}};
 const spine=(t:number)=>new T.Vector3(t,.42*Math.sin(t*Math.PI)-.28*t*t,0);
 for(let i=0;i<10;i++){
  const t=.09+i*.085,base=spine(t),next=spine(t+.09);
  put(base.clone().add(new T.Vector3(0,0,-.012)),next,base.clone().add(new T.Vector3(0,0,.012)),.92);
  for(const side of [-1,1]){
   const spread=.26*Math.pow(Math.sin(t*Math.PI),.7),tip=spine(Math.min(1,t+.18)).add(new T.Vector3(0,-.085,side*spread));
   const middle=base.clone().lerp(tip,.48),ridge=middle.clone().add(new T.Vector3(0,.028,0)),width=new T.Vector3(.033,0,side*-.018);
   const left=middle.clone().add(width),right=middle.clone().sub(width),shade=.77+(i%3)*.075;
   put(base,left,ridge,shade);put(left,tip,ridge,shade);put(tip,right,ridge,shade*.92);put(right,base,ridge,shade*.92);
  }
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();return g;
}

/** Long, drooping strap leaves give screw-pine a different silhouette from a palm. */
export function screwPineCrownGeometry(){
 const positions:number[]=[],colors:number[]=[];
 for(let leaf=0;leaf<14;leaf++){
  const a=leaf*2.399963,upper=leaf%2===0,rows:T.Vector3[][]=[];
  for(let i=0;i<=4;i++){
   const t=i/4,r=t*(upper?.88:1.12),y=(upper?.9:.5)*Math.sin(t*Math.PI*.8)-.64*t*t,width=.075*Math.sin(t*Math.PI);
   rows.push([-1,0,1].map(side=>new T.Vector3(Math.cos(a)*r-Math.sin(a)*width*side,y+(side===0?.025:0),Math.sin(a)*r+Math.cos(a)*width*side)));
  }
  for(let i=0;i<4;i++)for(let j=0;j<2;j++)for(const v of [rows[i][j],rows[i+1][j],rows[i][j+1],rows[i][j+1],rows[i+1][j],rows[i+1][j+1]]){positions.push(v.x,v.y,v.z);const shade=.79+(leaf%3)*.07;colors.push(shade,shade,shade);}
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();return g;
}
