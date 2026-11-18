import {islandLoadingManager} from './island-loading-manager';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

/** Fetch can be aborted when a room closes. Callers own successful parse results. */
export async function loadAbortableGLB(path:string,signal:AbortSignal){
 const url=new URL(path,document.baseURI);
 const fetchBytes=async()=>{
  const response=await fetch(url,{signal});
  if(!response.ok)throw new Error(`HTTP ${response.status}`);
  return response.arrayBuffer();
 };
 const [data,{MeshoptDecoder}]=await Promise.all([
  fetchBytes(),import('three/addons/libs/meshopt_decoder.module.js'),
 ]);
 signal.throwIfAborted();
 const base=url.protocol==='data:'||url.protocol==='blob:'?document.baseURI:new URL('.',url).href;
 return new GLTFLoader(islandLoadingManager()).setMeshoptDecoder(MeshoptDecoder).parseAsync(data,base);
}
