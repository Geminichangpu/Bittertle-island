// Produce non-quantized Meshopt copies alongside the preserved source models.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import crypto from 'node:crypto';
const root=path.resolve('reports/performance/tools/node_modules');
const load=p=>import(pathToFileURL(path.join(root,p)).href);
const {NodeIO}=await load('@gltf-transform/core/dist/index.js');
const {ALL_EXTENSIONS,EXTMeshoptCompression}=await load('@gltf-transform/extensions/dist/index.js');
const {MeshoptEncoder,MeshoptDecoder}=await load('meshoptimizer/index.js');
await MeshoptEncoder.ready;await MeshoptDecoder.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
const names=['bedroom','office','residence','tower-lobby','tower-hecate','tower-hebe','tower-dolly','tower-owner'];
const digest=b=>crypto.createHash('sha256').update(Buffer.from(b.buffer,b.byteOffset,b.byteLength)).digest('hex');
const accDigest=a=>{const v=a.getArray();if(a.getType()!=='SCALAR'||!(v instanceof Uint16Array||v instanceof Uint32Array)||v.length%3)return digest(v);const c=v.slice();for(let i=0;i<c.length;i+=3){const [x,y,z]=c.slice(i,i+3);if(y<x&&y<=z){c[i]=y;c[i+1]=z;c[i+2]=x;}else if(z<x&&z<y){c[i]=z;c[i+1]=x;c[i+2]=y;}}return digest(c);};
for(const name of names){
 const source=`src/assets/models/${name}-interior-refined-v1.glb`,output=`src/assets/models-optimized/${name}-interior-meshopt-lossless.glb`;
 const doc=await io.read(source);const r=doc.getRoot();
 const snapshot=()=>({accessors:r.listAccessors().map(a=>({type:a.getType(),array:accDigest(a)})),textures:r.listTextures().map(t=>digest(t.getImage())),nodes:r.listNodes().map(n=>({name:n.getName(),matrix:n.getMatrix(),extras:n.getExtras()})),materials:r.listMaterials().length,meshes:r.listMeshes().length});
 const before=snapshot();doc.createExtension(EXTMeshoptCompression).setRequired(true);await io.write(output,doc);
 const reread=await io.read(output), rr=reread.getRoot();const after={accessors:rr.listAccessors().map(a=>({type:a.getType(),array:accDigest(a)})),textures:rr.listTextures().map(t=>digest(t.getImage())),nodes:rr.listNodes().map(n=>({name:n.getName(),matrix:n.getMatrix(),extras:n.getExtras()})),materials:rr.listMaterials().length,meshes:rr.listMeshes().length};
 before.accessors.sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));after.accessors.sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
 if(JSON.stringify(before)!==JSON.stringify(after)){for(const key of Object.keys(before))if(JSON.stringify(before[key])!==JSON.stringify(after[key])){console.log('Mismatch:',key);if(key==='accessors'){const a=new Set(after.accessors.map(JSON.stringify));console.log('examples:',before.accessors.filter(x=>!a.has(JSON.stringify(x))).slice(0,5));}}throw new Error(`Decoded data mismatch: ${name}`);}
 console.log(`${name}: ${fs.statSync(source).size} -> ${fs.statSync(output).size} bytes; decoded data verified`);
}
