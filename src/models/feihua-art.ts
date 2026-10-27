import * as T from 'three';

/** Subtle object-space grain on the existing GLB materials, with no texture downloads. */
export function finishFeihuaMaterial(m:T.Material){
 if(!(m instanceof T.MeshStandardMaterial)||m.transparent||!m.name.endsWith('_surface'))return;
 const color=m.name.slice(3,9).toLowerCase();
 const roof=['525d77','65728a','8190a1','6d7070'].includes(color);
 const plaster=['e5d4b5','eee1b9'].includes(color);
 const stone=['b6afa0','b7b1a0','c7bda6'].includes(color);
 const scale=roof?5:plaster?12:stone?5:9, strength=roof?.035:plaster?.025:stone?.045:.045;
 m.roughness=roof?.72:plaster?.96:stone?.94:.86;
 m.onBeforeCompile=shader=>{
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vFeihuaPosition;').replace('#include <begin_vertex>','#include <begin_vertex>\nvFeihuaPosition = position;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vFeihuaPosition;\nfloat fhHash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}\nfloat fhNoise(vec3 p){vec3 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);return mix(mix(mix(fhHash(i),fhHash(i+vec3(1,0,0)),f.x),mix(fhHash(i+vec3(0,1,0)),fhHash(i+vec3(1,1,0)),f.x),f.y),mix(mix(fhHash(i+vec3(0,0,1)),fhHash(i+vec3(1,0,1)),f.x),mix(fhHash(i+vec3(0,1,1)),fhHash(i+vec3(1,1,1)),f.x),f.y),f.z);}')
   .replace('#include <color_fragment>',`#include <color_fragment>\ndiffuseColor.rgb *= 1.0 + (fhNoise(vFeihuaPosition * ${scale.toFixed(1)}) - 0.5) * ${strength.toFixed(3)};`);
 };
 m.customProgramCacheKey=()=>`feihua-grain-${scale}-${strength}`;
}

/** Small structural eave brackets are batched and stay clear of the walking surface. */
export function makeFeihuaJoinery(){
 const g=new T.BoxGeometry(1,1,1),m=new T.MeshStandardMaterial({color:'#654936',roughness:.86}),transforms:T.Matrix4[]=[];
 const part=(x:number,y:number,z:number,sx:number,sy:number,sz:number,rx=0)=>transforms.push(new T.Matrix4().compose(new T.Vector3(x,y,z),new T.Quaternion().setFromEuler(new T.Euler(rx,0,0)),new T.Vector3(sx,sy,sz)));
 for(let floor=0;floor<3;floor++){
  const width=26*(1-floor*.065),depth=16*(1-floor*.055),y=2.3+floor*7+6.35;
  for(const side of [-1,1])for(let i=0;i<7;i++){
   const x=-width*.42+i*width*.14,z=side*(depth/2+.17);
   part(x,y,z,.36,.22,.7);part(x,y+.22,z+side*.16,.62,.18,.9);part(x,y-.25,z-side*.06,.17,.65,.17,-side*.48);
  }
 }
 const mesh=new T.InstancedMesh(g,m,transforms.length);transforms.forEach((v,i)=>mesh.setMatrixAt(i,v));mesh.instanceMatrix.needsUpdate=true;mesh.name='feihua-eave-joinery';mesh.castShadow=true;mesh.receiveShadow=true;return mesh;
}
