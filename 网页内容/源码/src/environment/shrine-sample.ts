import * as T from 'three';
import type {Project} from '../data/model';
import {Builder} from '../generators/shrine';
import {leafSprigGeometry} from './nature-geometry';
import type {TerrainSurface} from './surface';
import type {Route} from './paths';
import type {createNatureMaterials} from './nature-materials';

/** Three tiny shared finishes, generated once. No new HTTP textures or shader hooks. */
function sampleFinishes(){
 const textures:T.Texture[]=[],materials=new Map<string,T.MeshStandardMaterial>();
 const sets=new Map<string,T.DataTexture[]>();
 function maps(kind:string){
  if(sets.has(kind))return sets.get(kind)!;
  const n=64,height=(x:number,y:number)=>kind==='wood'?.5+.2*Math.sin(x*Math.PI/4+Math.sin(y*Math.PI/16))+.07*Math.sin(x*Math.PI/2):.5+.13*Math.sin(x*Math.PI/4)*Math.cos(y*Math.PI/8)+.08*Math.cos((x+y)*Math.PI/2);
  const color=new Uint8Array(n*n*4),normal=new Uint8Array(n*n*4),rough=new Uint8Array(n*n*4);
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){
   const i=(y*n+x)*4,h=height(x,y),v=kind==='plaster'?247-h*9:231+h*22;
   color.set([v,v,v,255],i);const dx=(height(x+1,y)-height(x-1,y))*.3,dy=(height(x,y+1)-height(x,y-1))*.3,nm=new T.Vector3(-dx,-dy,1).normalize();normal.set([(nm.x*.5+.5)*255,(nm.y*.5+.5)*255,(nm.z*.5+.5)*255,255],i);const r=kind==='wood'?205+h*28:234+h*18;rough.set([r,r,r,255],i);
  }
  const result=[color,normal,rough].map((bytes,i)=>{const t=new T.DataTexture(bytes,n,n);t.colorSpace=i===0?T.SRGBColorSpace:T.NoColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;textures.push(t);return t;});sets.set(kind,result);return result;
 }
 return {material(color:string){
  if(!materials.has(color)){const kind=['#654b35','#af8b60'].includes(color)?'wood':color==='#e1d4bb'?'plaster':'stone',[map,normalMap,roughnessMap]=maps(kind);const m=new T.MeshStandardMaterial({color,map,normalMap,roughnessMap,normalScale:new T.Vector2(.35,.35),roughness:1});m.name='神社样板 '+kind;materials.set(color,m);}return materials.get(color)!;
 },dispose(){textures.forEach(t=>t.dispose());}};
}

/** A small independent overlay survives near-model replacement and shares its batches. */
export function makeShrineSample(p:Project,surface:TerrainSurface,routes:Route[],nature:ReturnType<typeof createNatureMaterials>){
 const group=p.groups?.find(g=>g.id==='shrine_group');if(!group)return;
 const root=new T.Group();root.name='神社入口样板';root.userData.noCollision=true;
 const finish=sampleFinishes(),geometries=new Map<string,T.BufferGeometry>();
 const geo=(key:string,make:()=>T.BufferGeometry)=>{if(!geometries.has(key))geometries.set(key,make());return geometries.get(key)!;};
 const wood='#654b35',trim='#af8b60',pale='#d5cfba';
 const b=new Builder({geo,mat:color=>finish.material(color),sign:color=>finish.material(color)});
 for(const o of p.objects.filter(o=>['shrine_main','shrine_office','shrine_residence'].includes(o.id))){
  const {width:w,depth:d,wallHeight:h}=o.params;
  const matrix=new T.Matrix4().compose(new T.Vector3(...o.position),new T.Quaternion().setFromEuler(new T.Euler(...o.rotation)),new T.Vector3(...o.scale));
  b.transformed(matrix,()=>{
   // Reuse existing lattices and tiled roofs. Add their deep sills, drip edges and end grain.
   for(const side of [-1,1]){
    b.box([side*(w/2+.13),h*.53+.65-h*.28,0],[.28,.16,d*.58+.35],trim);
    b.box([side*(w/2+.06),h*.53+.37-h*.28,0],[.14,.35,d*.58+.22],'#e1d4bb');
    b.box([side*(w/2+.1),h*.53+.65+h*.28,0],[.22,.18,d*.58+.35],wood);
    b.box([0,h+.5,side*(d/2+1.35)],[w+2.7,.14,.16],trim);
    b.box([0,.18,side*(d/2+.85)],[w+1.7,.2,.16],wood);
    b.box([side*(w/2+.85),.18,0],[.16,.2,d+1.7],wood);
    for(let j=0;j<Math.ceil(w/1.8);j++)b.box([-w/2+(j+.5)*w/Math.ceil(w/1.8),.57,side*(d/2+.85)],[w/Math.ceil(w/1.8)-.04,.12,.22],pale);
   }
   for(let step=0;step<3;step++)b.box([0,.24+step*.16,d/2+2.53-step*.45],[w*.4+.06,.075,.16],pale);
   if(o.id==='shrine_main'){
    for(const side of [-1,1]){
     const x=side*(w/2+.7);for(const z of [d/2+.8,d/2+2.6]){b.box([x,1,z],[.18,1.35,.18],wood);b.box([x,1.72,z],[.29,.12,.29],trim);}
     for(const y of [.9,1.56])b.box([x,y,d/2+1.7],[.14,.13,1.95],wood);
    }
   }else{
    // Modest rear-wall wainscot; the front passage stays clear.
    b.box([0,1.1,-d/2-.08],[w,.72,.12],wood);
    for(let j=0;j<Math.ceil(w/.85);j++)b.box([-w/2+(j+.5)*w/Math.ceil(w/.85),1.1,-d/2-.16],[.055,.72,.08],trim);
   }
  });
 }
 const architecture=b.finish();architecture.position.fromArray(group.position);architecture.rotation.set(...group.rotation);architecture.scale.fromArray(group.scale);root.add(architecture);
 const world=new T.Matrix4().compose(new T.Vector3(...group.position),new T.Quaternion().setFromEuler(new T.Euler(...group.rotation)),new T.Vector3(...group.scale));
 const entry=new T.Vector3(-5,0,14.5).applyMatrix4(world);
 const plants=new Builder({geo,mat:color=>color==='#b7b09b'?nature.material('rock','#d9d6c8'):newPlantMaterial(color),sign:color=>finish.material(color)});
 const plantMaterials=new Map<string,T.MeshStandardMaterial>();
 function newPlantMaterial(color:string){if(!plantMaterials.has(color)){const m=new T.MeshStandardMaterial({color,roughness:1,vertexColors:true,side:T.DoubleSide});plantMaterials.set(color,m);}return plantMaterials.get(color)!;}
 const vertices:number[]=[],uv:number[]=[];
 for(const r of routes.filter(r=>r.status==='connected'&&(r.fromId==='shrine_torii'||r.toId==='shrine_torii'))){
  let lastX=Infinity,lastZ=Infinity,cluster=0;
  for(let i=1;i<r.points.length;i++){
   const a=r.points[i-1],c=r.points[i],dx=c[0]-a[0],dz=c[1]-a[1],length=Math.hypot(dx,dz);if(length<.01||Math.hypot(c[0]-entry.x,c[1]-entry.z)>30)continue;
   const place=Math.hypot(c[0]-lastX,c[1]-lastZ)>1.7;
   for(const side of [-1,1]){
    const points=[a,c].flatMap(q=>[r.width*.5,r.width*.5+.65].map(off=>{const x=q[0]-dz/length*off*side,z=q[1]+dx/length*off*side;return [x,(surface.height(x,z)??0)+.08,z];}));
    for(const j of [0,1,2,2,1,3]){vertices.push(...points[j]);uv.push(points[j][0]*.45,points[j][2]*.45);}
    if(place){const off=r.width*.5+.12,x=c[0]-dz/length*off*side,z=c[1]+dx/length*off*side,y=surface.height(x,z);if(y!==undefined){plants.box([x,y+.16,z],[.3,.27,1.1],'#b7b09b',Math.atan2(dx,dz));if(cluster%3===0){for(let k=0;k<3;k++)plants.emit('sample:fern',leafSprigGeometry,k%2?'#638363':'#8c9a6d',[x+side*(.6+k*.2),y+.13,z+k*.23],[1.1,1.4,1.1],new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),i+k));}}}
   }
   if(place){lastX=c[0];lastZ=c[1];cluster++;}
  }
 }
 if(vertices.length){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();g.userData.surfaceKind='road';const ground=new T.Mesh(g,nature.material('gravel','#d4cbb7'));ground.material.side=T.DoubleSide;ground.name='入口道路碎石过渡';root.add(ground);}
 root.add(plants.finish());return {root,dispose:finish.dispose};
}
