// Lossless compression for this sample only. Keep original GLBs for recovery.
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
const digest=b=>crypto.createHash('sha256').update(Buffer.from(b.buffer,b.byteOffset,b.byteLength)).digest('hex');
const accDigest=a=>{const v=a.getArray();if(a.getType()!=='SCALAR'||!(v instanceof Uint16Array||v instanceof Uint32Array)||v.length%3)return digest(v);const c=v.slice();for(let i=0;i<c.length;i+=3){const [x,y,z]=c.slice(i,i+3);if(y<x&&y<=z){c[i]=y;c[i+1]=z;c[i+2]=x;}else if(z<x&&z<y){c[i]=z;c[i+1]=x;c[i+2]=y;}}return digest(c);};
const snapshot=doc=>{const r=doc.getRoot();return {accessors:r.listAccessors().map(a=>({type:a.getType(),array:accDigest(a)})).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b))),textures:r.listTextures().map(t=>digest(t.getImage())),nodes:r.listNodes().map(n=>({name:n.getName(),matrix:n.getMatrix(),extras:n.getExtras()})),materials:r.listMaterials().length,meshes:r.listMeshes().length};};
const report=[];
for(const part of ['main','torii','temizu','office','residence','court','path','garden']){
 const name='shrine_'+part,source=`src/assets/models/${name}-exterior-refined-v1.glb`,output=`src/assets/models-optimized/${name}-exterior-meshopt-lossless.glb`;
 const doc=await io.read(source),before=snapshot(doc);doc.createExtension(EXTMeshoptCompression).setRequired(true);await io.write(output,doc);
 if(JSON.stringify(before)!==JSON.stringify(snapshot(await io.read(output))))throw new Error(`Decoded data mismatch: ${name}`);
 const result={name,source,output,before:fs.statSync(source).size,after:fs.statSync(output).size,decodedDataVerified:true};report.push(result);console.log(JSON.stringify(result));
}
fs.mkdirSync('reports/r187-sample',{recursive:true});fs.writeFileSync('reports/r187-sample/meshopt.json',JSON.stringify(report,null,2));
