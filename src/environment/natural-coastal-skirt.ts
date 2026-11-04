import * as T from 'three';
import type {Project} from '../data/model.ts';
import {mainCoast,distance,isLand} from '../terrain/terrain.ts';
import {scenicHighland} from '../terrain/scenic-coast.ts';
import {pilotCenter} from './nature-pilot';
import {boulderGeometry} from './nature-geometry';

/** The exact bearing edge stays fixed. Only decorative rock below it bulges outward. */
export function coastalSkirt(p:Project,terrain:T.BufferGeometry,material:T.MeshStandardMaterial,grass?:T.MeshStandardMaterial){
 if(!p.terrain.scenicCoast)return;
 const pos=terrain.getAttribute('position'),index=terrain.index,edges=new Map<string,{a:T.Vector3;b:T.Vector3;count:number}>();
 const key=(v:T.Vector3)=>[v.x,v.y,v.z].map(n=>Math.round(n*10000)).join(',');
 for(let i=0;i<(index?.count??pos.count);i+=3){const vs=[0,1,2].map(j=>new T.Vector3().fromBufferAttribute(pos,index?index.getX(i+j):i+j));for(let j=0;j<3;j++){const a=vs[j],b=vs[(j+1)%3],ka=key(a),kb=key(b),k=ka<kb?ka+'|'+kb:kb+'|'+ka,e=edges.get(k);if(e)e.count++;else edges.set(k,{a,b,count:1});}}
 const coast=mainCoast(p.terrain),shrine=p.groups?.find(g=>g.id==='shrine_group'),center=pilotCenter(p),selected:{a:T.Vector3;b:T.Vector3;n:T.Vector2}[]=[],normals=new Map<string,T.Vector2>();
 const weight=(x:number,z:number)=>{const d=Math.hypot((x-center.x)/105,(z-center.y)/120),u=T.MathUtils.clamp((1-d)/.28,0,1);return u*u*(3-2*u);};
 for(const {a,b,count} of edges.values()){
  if(count!==1)continue;const x=(a.x+b.x)/2,z=(a.z+b.z)/2,nearShrine=shrine&&x>shrine.position[0]-65&&x<shrine.position[0]+50&&z>shrine.position[2]-65&&z<shrine.position[2]+50;
  if(p.terrain.flatBayRevision===1&&x>55&&x<102&&z> -52&&z<38)continue;
  if((!scenicHighland(p.terrain,x,z)&&!nearShrine)||distance([x,z],coast)>.035)continue;
  const n=new T.Vector2(b.z-a.z,a.x-b.x).normalize();if(isLand(p.terrain,x+n.x*.2,z+n.y*.2))n.negate();selected.push({a,b,n});for(const v of [a,b]){const k=key(v);if(!normals.has(k))normals.set(k,new T.Vector2());normals.get(k)!.add(n);}
 }
 normals.forEach(n=>n.normalize());
 const vertices:number[]=[],uv:number[]=[],depths:number[]=[],weights:number[]=[],indices:number[]=[],talus:{p:T.Vector3;s:T.Vector3;q:T.Quaternion}[]=[],root=new T.Group();root.name='样板自然岩岸与坡脚碎石';root.userData.noCollision=true;
 for(const {a,b,n} of selected){
  const wa=weight(a.x,a.z),wb=weight(b.x,b.z),rows=Math.max(wa,wb)>.001?10:1,steps=Math.max(1,Math.ceil(a.distanceTo(b)/2)),start=vertices.length/3,na=normals.get(key(a))!,nb=normals.get(key(b))!;
  for(let i=0;i<=steps;i++){
   const u=i/steps,x=T.MathUtils.lerp(a.x,b.x,u),z=T.MathUtils.lerp(a.z,b.z,u),top=T.MathUtils.lerp(a.y,b.y,u)+.045,nx=T.MathUtils.lerp(na.x,nb.x,u),nz=T.MathUtils.lerp(na.y,nb.y,u),w=weight(x,z);
   for(let j=0;j<=rows;j++){
    const t=j/rows,shape=.7+.55*Math.sin(x*.31+z*.17-t*5)+.32*Math.cos(z*.57-x*.11+t*9),out=w*(Math.sin(Math.PI*t)*Math.max(.12,shape)*2.1+Math.pow(t,3)*2.4),y=T.MathUtils.lerp(top,-1.3,t)+w*Math.sin(Math.PI*t)*.26*Math.sin(x*.22+z*.29+t*12);
    vertices.push(x+nx*out,y,z+nz*out);uv.push((x+z*.43)/6.7+Math.sin(y*.37+x*.09)*.1,-y/5.8+x*.019);depths.push(t);weights.push(w);
   }
  }
  for(let i=0;i<steps;i++)for(let j=0;j<rows;j++){const q=start+i*(rows+1)+j,r=q+rows+1;indices.push(q,r,q+1,q+1,r,r+1);}
  const x=(a.x+b.x)/2,z=(a.z+b.z)/2;if(weight(x,z)>.35&&Math.max(a.y,b.y)>5&&Math.sin(x*.055+z*.075)>.4&&talus.length<64&&!talus.some(r=>Math.hypot(r.p.x-x,r.p.z-z)<2.8)){
   const noise=.5+.5*Math.sin(x*1.7+z*.9),off=2.5+noise*1.7;talus.push({p:new T.Vector3(x+n.x*off,.05+noise*.25,z+n.y*off),s:new T.Vector3(.65+noise*noise*2.3,.45+noise*1.2,.65+noise*1.8),q:new T.Quaternion().setFromEuler(new T.Euler(.1,noise*5,.14))});
  }
 }
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.setAttribute('cliffDepth',new T.Float32BufferAttribute(depths,1));geometry.setAttribute('cliffPilot',new T.Float32BufferAttribute(weights,1));geometry.setIndex(indices);geometry.computeVertexNormals();
 const finish=material.clone();finish.side=T.DoubleSide;finish.customProgramCacheKey=()=> 'pilot-cliff-grass-cap-v1';
 finish.onBeforeCompile=shader=>{shader.uniforms.cliffGrass={value:grass?.map||material.map};shader.vertexShader='attribute float cliffDepth;attribute float cliffPilot;varying vec2 vCliff;varying vec3 vCliffPosition;varying vec3 vCliffNormal;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvCliff=vec2(cliffDepth,cliffPilot);vCliffPosition=position;vCliffNormal=normalize(mat3(modelMatrix)*objectNormal);');shader.fragmentShader='varying vec2 vCliff;varying vec3 vCliffPosition;varying vec3 vCliffNormal;uniform sampler2D cliffGrass;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`
   vec3 cliffAxis=pow(abs(normalize(vCliffNormal)),vec3(4.));cliffAxis/=max(dot(cliffAxis,vec3(1.)),.0001);
   vec3 cliffColor=texture2D(map,vCliffPosition.zy*.18).rgb*cliffAxis.x+texture2D(map,vCliffPosition.xz*.18).rgb*cliffAxis.y+texture2D(map,vCliffPosition.xy*.18).rgb*cliffAxis.z;
   diffuseColor.rgb*=cliffColor;
   float ragged=.14+.045*sin(vCliffPosition.x*.7+vCliffPosition.z*.43)+.025*cos(vCliffPosition.z*1.3);
   float cap=(1.-smoothstep(.015,ragged,vCliff.x))*vCliff.y;
   vec3 capColor=texture2D(cliffGrass,vCliffPosition.xz*.18).rgb*vec3(.7,.94,.56);
   diffuseColor.rgb=mix(diffuseColor.rgb,capColor,cap);`);shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`
   vec3 cx=texture2D(normalMap,vCliffPosition.zy*.18).xyz*2.-1.,cy=texture2D(normalMap,vCliffPosition.xz*.18).xyz*2.-1.,cz=texture2D(normalMap,vCliffPosition.xy*.18).xyz*2.-1.;cx.xy*=.24;cy.xy*=.24;cz.xy*=.24;
   normal=normalize(getTangentFrame(-vViewPosition,normal,vCliffPosition.zy*.18)*cx*cliffAxis.x+getTangentFrame(-vViewPosition,normal,vCliffPosition.xz*.18)*cy*cliffAxis.y+getTangentFrame(-vViewPosition,normal,vCliffPosition.xy*.18)*cz*cliffAxis.z);`);};
 const face=new T.Mesh(geometry,finish);face.name='固定崖顶下方的连续凹凸岩面';face.userData.noCollision=true;root.add(face);
 for(let variant=0;variant<2;variant++){const items=talus.filter((_,i)=>i%2===variant);if(!items.length)continue;const mesh=new T.InstancedMesh(boulderGeometry(variant),material,items.length);items.forEach((r,i)=>mesh.setMatrixAt(i,new T.Matrix4().compose(r.p,r.q,r.s)));mesh.computeBoundingBox();mesh.computeBoundingSphere();mesh.userData.noCollision=true;mesh.name='坡脚碎石 '+variant;root.add(mesh);}
 root.userData.metrics={talus:talus.length,edgeSegments:selected.length};return root;
}
