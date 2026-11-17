import * as T from 'three';
import type {SceneController} from '../scene/SceneController';

/** Development-only: open with ?diagnostics=1; production builds omit this module. */
export function installDiagnostics(scene:SceneController){
 const saved=new Map<T.MeshStandardMaterial,T.Texture|null>();
 const api={
  stats:()=>{const attrs=new Set<T.BufferAttribute|T.InterleavedBufferAttribute>(),textures=new Set<T.Texture>();let batches=0,instances=0,singletons=0;
   scene.scene.traverse(n=>{if(!(n instanceof T.Mesh))return;if(n instanceof T.InstancedMesh){if(n.count>1){batches++;instances+=n.count;}else singletons++;}for(const a of Object.values(n.geometry.attributes) as (T.BufferAttribute|T.InterleavedBufferAttribute)[])attrs.add(a);if(n.geometry.index)attrs.add(n.geometry.index);for(const m of Array.isArray(n.material)?n.material:[n.material])for(const v of Object.values(m))if(v instanceof T.Texture)textures.add(v);});
   let geometryBytes=0;for(const a of attrs)geometryBytes+=(a instanceof T.InterleavedBufferAttribute?a.data.array:a.array).byteLength;
   let textureBytes=0;for(const t of textures){const image=t.image as {width?:number;height?:number}|undefined;if(image?.width&&image.height)textureBytes+=image.width*image.height*4*(t.generateMipmaps?4/3:1);}
   return {...scene.stats,shadowUpdates:scene.lighting.shadowUpdates,renderMemory:{...scene.renderer.info.memory},estimatedGeometryBytes:geometryBytes,estimatedTextureBytes:Math.round(textureBytes),batches,instances,singletons};},
  setShadows:(enabled:boolean)=>{scene.renderer.shadowMap.enabled=enabled;scene.scene.traverse(n=>{if(n instanceof T.Mesh)for(const m of Array.isArray(n.material)?n.material:[n.material])m.needsUpdate=true;});scene.invalidateShadows();scene.requestRender();},
  setRoadWireframe:(enabled:boolean)=>{scene.environment.traverse(n=>{if(n instanceof T.Mesh&&n.geometry.userData.surfaceKind==='road')for(const m of Array.isArray(n.material)?n.material:[n.material])if(m instanceof T.MeshStandardMaterial)m.wireframe=enabled;});scene.requestRender();},
  setColorMaps:(enabled:boolean)=>{scene.scene.traverse(n=>{if(n instanceof T.Mesh)for(const m of Array.isArray(n.material)?n.material:[n.material])if(m instanceof T.MeshStandardMaterial){if(!saved.has(m))saved.set(m,m.map);m.map=enabled?(saved.get(m)||null):null;m.needsUpdate=true;}});scene.requestRender();},
  surfaces:()=>{const out:{name:string,kind:string,sourceKey:string,objectId:string,vertices:number,normal:boolean,needsNormal:boolean,uv:boolean,textured:boolean,invalidNormals:number,invalidUv:number,materials:string[]}[]=[],seen=new Set<T.BufferGeometry>();scene.scene.traverse(n=>{if(!(n instanceof T.Mesh)||seen.has(n.geometry))return;seen.add(n.geometry);const kind=n===scene.terrain?'terrain':n.geometry.userData.surfaceKind||n.userData.natureKind||(n.userData.objectId?'building':'other');const normal=n.geometry.getAttribute('normal'),uv=n.geometry.getAttribute('uv'),materials=Array.isArray(n.material)?n.material:[n.material];let invalidNormals=0,invalidUv=0;if(normal)for(let i=0;i<normal.count;i++)if(!Number.isFinite(normal.getX(i)+normal.getY(i)+normal.getZ(i))||Math.hypot(normal.getX(i),normal.getY(i),normal.getZ(i))<.01)invalidNormals++;if(uv)for(let i=0;i<uv.count;i++)if(!Number.isFinite(uv.getX(i)+uv.getY(i)))invalidUv++;out.push({name:n.name,kind,sourceKey:n.geometry.userData.sourceKey||'',objectId:n.userData.objectId||'',vertices:n.geometry.getAttribute('position')?.count||0,normal:!!normal,needsNormal:materials.some(m=>!(m instanceof T.MeshBasicMaterial)),uv:!!uv,textured:materials.some(m=>m instanceof T.MeshStandardMaterial&&!!m.map),invalidNormals,invalidUv,materials:materials.map(m=>m.name)});});return out;}
 };
 (window as unknown as {__islandDiagnostics?:typeof api}).__islandDiagnostics=api;
 return ()=>{delete (window as unknown as {__islandDiagnostics?:typeof api}).__islandDiagnostics;};
}
