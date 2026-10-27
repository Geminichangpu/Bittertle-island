import * as T from 'three';
import type {Project} from '../data/model.ts';

/** Match the existing steep shrine shoreline to the adjacent cliff material.
 * These are the actual terrain triangles, not another raised ground surface. */
export function shrineCoastRock(p:Project,terrain:T.BufferGeometry,material:T.MeshStandardMaterial){
 const shrine=p.groups?.find(g=>g.id==='shrine_group');if(!shrine||!p.terrain.scenicCoast)return;
 const pos=terrain.getAttribute('position'),index=terrain.index,vertices:number[]=[],uv:number[]=[];
 const a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),normal=new T.Vector3(),edge=new T.Vector3();
 const [sx,,sz]=shrine.position;
 for(let i=0;i<(index?.count??pos.count);i+=3){
  a.fromBufferAttribute(pos,index?index.getX(i):i);b.fromBufferAttribute(pos,index?index.getX(i+1):i+1);c.fromBufferAttribute(pos,index?index.getX(i+2):i+2);
  const x=(a.x+b.x+c.x)/3,z=(a.z+b.z+c.z)/3;
  if(x<sx-65||x>sx+45||z<sz-48||z>sz+48)continue;
  normal.crossVectors(edge.subVectors(b,a),c.clone().sub(a));
  // Some terrain boundary triangles collapse to a line; they have no usable
  // normal and cannot contribute visible area to the cliff overlay.
  if(normal.lengthSq()<1e-12)continue;
  normal.normalize();
  // Leave the level green plateau, grounds and gentler grassy banks untouched.
  if(Math.abs(normal.y)>.8||Math.max(a.y,b.y,c.y)<1)continue;
  const tangent=new T.Vector2(-normal.z,normal.x).normalize();
  for(const v of [a,b,c]){vertices.push(v.x,v.y,v.z);uv.push((v.x*tangent.x+v.z*tangent.y)/5.5,(p.terrain.scenicCoast.level-v.y)/5.5);}
 }
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.computeVertexNormals();
 // A shallow depth offset keeps the terrain surface intact without z-fighting.
 const rockMaterial=material.clone();rockMaterial.side=T.DoubleSide;rockMaterial.polygonOffset=true;rockMaterial.polygonOffsetFactor=-2;rockMaterial.polygonOffsetUnits=-2;
 const mesh=new T.Mesh(geometry,rockMaterial);mesh.name='神社海岸统一自然岩面';mesh.userData.noCollision=true;mesh.renderOrder=1;return mesh;
}
