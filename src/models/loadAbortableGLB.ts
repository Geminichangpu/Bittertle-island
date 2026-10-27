import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
/** Fetch can be aborted when a room closes; parsing results are checked by callers. */
export async function loadAbortableGLB(path:string,signal:AbortSignal){const url=new URL(path,document.baseURI);const response=await fetch(url,{signal});if(!response.ok)throw new Error(`HTTP ${response.status}`);const data=await response.arrayBuffer();if(signal.aborted)throw new DOMException('Aborted','AbortError');return new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(data,new URL('.',url).href);}
