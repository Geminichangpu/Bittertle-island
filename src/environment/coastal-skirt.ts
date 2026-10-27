import * as T from 'three';
import type {Project} from '../data/model.ts';
import {mainCoast,distance} from '../terrain/terrain.ts';
import {scenicHighland} from '../terrain/scenic-coast.ts';

/** Close the exact rendered terrain boundary, including pad intersections. */
export function coastalSkirt(p:Project,terrain:T.BufferGeometry,material:T.MeshStandardMaterial){
 if(!p.terrain.scenicCoast)return;
 const pos=terrain.getAttribute('position'),index=terrain.index,edges=new Map<string,{a:T.Vector3;b:T.Vector3;count:number}>();
 const key=(v:T.Vector3)=>[v.x,v.y,v.z].map(n=>Math.round(n*10000)).join(',');
 for(let i=0;i<(index?.count??pos.count);i+=3){
  const vs=[0,1,2].map(j=>new T.Vector3().fromBufferAttribute(pos,index?index.getX(i+j):i+j));
  for(let j=0;j<3;j++){const a=vs[j],b=vs[(j+1)%3],ka=key(a),kb=key(b),k=ka<kb?ka+'|'+kb:kb+'|'+ka,e=edges.get(k);if(e)e.count++;else edges.set(k,{a,b,count:1});}
 }
 const vertices:number[]=[],uv:number[]=[],coast=mainCoast(p.terrain),shrine=p.groups?.find(g=>g.id==='shrine_group');
 for(const {a,b,count} of edges.values()){
  if(count!==1)continue;const x=(a.x+b.x)/2,z=(a.z+b.z)/2;
  const nearShrine=shrine&&x>shrine.position[0]-65&&x<shrine.position[0]+50&&z>shrine.position[2]-65&&z<shrine.position[2]+50;
  if((!scenicHighland(p.terrain,x,z)&&!nearShrine)||distance([x,z],coast)>.035)continue;
  // Shared exact XZ endpoints meet without the previous sampled gaps. A small
  // vertical overlap seals the lip and the foot extends below water.
  const u=a.x/5.5+a.z/5.5,v=b.x/5.5+b.z/5.5,ay=a.y+.045,by=b.y+.045;
  vertices.push(a.x,ay,a.z,b.x,by,b.z,a.x,-1.3,a.z,a.x,-1.3,a.z,b.x,by,b.z,b.x,-1.3,b.z);uv.push(u,-ay/5.5,v,-by/5.5,u,.24,u,.24,v,-by/5.5,v,.24);
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();
 material.side=T.DoubleSide;const mesh=new T.Mesh(g,material);mesh.name='贴合地形边线的连续封闭岩岸';mesh.userData.noCollision=true;return mesh;
}
