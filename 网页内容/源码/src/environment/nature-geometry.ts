import {coastalRocks} from './coastal-rock-meshes.ts';
import * as T from 'three';

/** Curved blades with pointed tips, an off-centre midrib and separate leaf undersides. */
function spray(count:number,canopy:boolean){
 const positions:number[]=[],colors:number[]=[],uv:number[]=[],indices:number[]=[];
 for(let leaf=0;leaf<count;leaf++){
  const a=leaf*2.399963,phase=leaf*.7549,spread=.30+.54*((leaf*17)%43)/43;
  const root=canopy?new T.Vector3(Math.cos(a)*spread,Math.sin(leaf*1.7)*.41,Math.sin(a)*spread*.88):new T.Vector3(Math.cos(a)*.078,leaf*.046,Math.sin(a)*.078);
  const breadth=canopy?.145+(leaf%3)*.033:.10+(leaf%3)*.012,length=canopy?.64+(leaf%4)*.076:.44+(leaf%3)*.075;
  const forward=new T.Vector3(Math.cos(a+.25),canopy?.18*Math.sin(leaf*.7):.20,Math.sin(a+.25)).normalize();
  const across=new T.Vector3(-forward.z,.12*Math.cos(phase),forward.x).normalize();
  if(canopy)root.addScaledVector(forward,-length*.43);
  const index=positions.length/3;
  for(let row=0;row<=6;row++){
   const t=row/6,span=breadth*Math.max(.012,Math.sin(Math.PI*t**.86))*(row===2?.94:1);
   const mid=root.clone().addScaledVector(forward,t*length);
   mid.y+=Math.sin(Math.PI*t)*length*.16-t*t*length*.115;
   mid.addScaledVector(across,Math.sin(Math.PI*t)*.023*Math.sin(phase));
   for(const side of [-1,0,1]){
    const p=mid.clone().addScaledVector(across,span*side);
    p.y+=span*(side===0?.28:.18*side*Math.sin(phase+t*1.7));
    positions.push(p.x,p.y,p.z);uv.push((side+1)/2,t);
    const shade=.72+.12*t+.055*(leaf%3)+(side===0?.10:side===1?.035:0);colors.push(shade,shade,shade*.98);
   }
   if(row<6)for(let j=0;j<2;j++){const n=index+row*3+j;indices.push(n,n+1,n+4,n,n+4,n+3);}
  }
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
export function crownGeometry(){return spray(27,true);}
export function boulderGeometry(variant=0){
 const rock=coastalRocks[variant % coastalRocks.length];
 const geometry=new T.BufferGeometry();
 geometry.setAttribute('position',new T.Float32BufferAttribute(rock.position,3));
 geometry.setAttribute('uv',new T.Float32BufferAttribute(rock.uv,2));
 geometry.computeVertexNormals();
 return geometry;
}
export function leafSprigGeometry(){return spray(5,false);}
