import * as T from 'three';
import type {Project} from '../data/model';
import type {Route} from './paths';
import type {TerrainSurface} from './surface';
import type {createNatureMaterials} from './nature-materials';
import {inNaturePilot} from './nature-pilot';

/** Solid, supported tread wedges within the existing ribbon. The walkable terrain stays unchanged. */
export function slopeSteps(p:Project,routes:Route[],surface:TerrainSurface,nature:ReturnType<typeof createNatureMaterials>){
 const vertices:number[]=[],uv:number[]=[],colors:number[]=[],indices:number[]=[];let stepCount=0;
 const quad=(a:T.Vector3,b:T.Vector3,c:T.Vector3,d:T.Vector3,shade:number)=>{const start=vertices.length/3;for(const v of [a,b,c,d]){vertices.push(v.x,v.y,v.z);uv.push(v.x*.4,v.z*.4+v.y*.17);colors.push(shade,shade,shade);}indices.push(start,start+1,start+2,start,start+2,start+3);};
 for(const route of routes){
  if(route.status!=='connected')continue;let arc=0,next=.38;
  for(let i=1;i<route.points.length;i++){
   const a=route.points[i-1],b=route.points[i],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);if(length<.001)continue;
   for(;next<=arc+length;next+=.72){
    const t=(next-arc)/length,x=a[0]+dx*t,z=a[1]+dz*t;if(!inNaturePilot(p,x,z))continue;
    const fx=dx/length,fz=dz/length,near=surface.height(x-fx*.55,z-fz*.55),far=surface.height(x+fx*.55,z+fz*.55);if(near===undefined||far===undefined||Math.abs(far-near)/1.1<.24)continue;
    const halfWidth=Math.max(.4,route.width*.5-.2),halfDepth=.34,bottom:T.Vector3[]=[],top:T.Vector3[]=[];let valid=true;
    for(const along of [-halfDepth,halfDepth])for(const across of [-halfWidth,halfWidth]){const xx=x+fx*along-fz*across,zz=z+fz*along+fx*across,y=surface.height(xx,zz);if(y===undefined){valid=false;break;}bottom.push(new T.Vector3(xx,y+.125,zz));}
    if(!valid||bottom.length!==4)continue;
    for(let k=0;k<4;k++){const across=k%2,high=Math.max(bottom[across].y,bottom[across+2].y)+.045;top.push(new T.Vector3(bottom[k].x,high,bottom[k].z));}
    quad(top[0],top[2],top[3],top[1],stepCount%3===0?.96:1);quad(bottom[0],bottom[1],top[1],top[0],.83);quad(bottom[2],top[2],top[3],bottom[3],.83);quad(bottom[0],top[0],top[2],bottom[2],.9);quad(bottom[1],bottom[3],top[3],top[1],.9);stepCount++;
   }
   arc+=length;
  }
 }
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();geometry.userData.surfaceKind='road';
 const material=nature.material('paving','#d2ccbc',true);material.side=T.DoubleSide;material.polygonOffset=true;material.polygonOffsetFactor=-2;material.polygonOffsetUnits=-2;
 const mesh=new T.Mesh(geometry,material);mesh.name='坡道完整石踏步';mesh.userData.noCollision=true;mesh.userData.stepCount=stepCount;return mesh;
}
