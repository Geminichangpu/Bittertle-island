import * as T from 'three';
import lowBank from '../assets/custom-nature/maritime-cloud-0.png?url';
import cumulus from '../assets/custom-nature/maritime-cloud-1.png?url';
import wisps from '../assets/custom-nature/maritime-cloud-2.png?url';

/** Static daylight integrated through a volume. Orient its projection to the viewing direction. */
export async function windowClouds(matrices:T.Matrix4[],signal:AbortSignal){
 const group=new T.Group(),plane=new T.PlaneGeometry(2,2);
 const textures:T.Texture[]=[],materials:T.Material[]=[];
 const dispose=()=>{
  group.removeFromParent();group.children.forEach(n=>{if(n instanceof T.InstancedMesh)n.dispose();});
  plane.dispose();materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());
 };
 try{
  const jobs=await Promise.allSettled([lowBank,cumulus,wisps].map(async url=>{
   const tex=await new T.TextureLoader().loadAsync(url);textures.push(tex);return tex;
  }));
  if(signal.aborted)throw new DOMException('Aborted','AbortError');
  for(let variant=0;variant<3;variant++){
   const job=jobs[variant];if(job.status==='rejected')throw job.reason;
   const tex=job.value;tex.colorSpace=T.SRGBColorSpace;
   const m=new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,side:T.DoubleSide,forceSinglePass:true});
   m.onBeforeCompile=shader=>{
    shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`
     mat4 placed=modelViewMatrix*instanceMatrix;
     vec4 mvPosition=placed[3];
     mvPosition.xy+=position.xy*vec2(length(placed[0].xyz)*1.52,length(placed[1].xyz)*1.48);
     gl_Position=projectionMatrix*mvPosition;
    `);
   };
   materials.push(m);
   const slots=matrices.filter((_,i)=>i%3===variant);
   if(!slots.length)continue;
   const mesh=new T.InstancedMesh(plane,m,slots.length);
   slots.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));mesh.instanceMatrix.needsUpdate=true;
   mesh.frustumCulled=false;mesh.renderOrder=-5;group.add(mesh);
  }
  return {group,dispose};
 }catch(error){dispose();throw error;}
}

