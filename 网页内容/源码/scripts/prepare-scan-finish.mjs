// Decode quantized scans for local-space Blender ray baking, then restore runtime compression.
import {mkdir,readdir,readFile,rename,unlink,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const web=fileURLToPath(new URL('../',import.meta.url));
const scratch=path.resolve(web,'../../codex/scan-baking');
const deps=path.join(web,'reports/performance/tools/node_modules');
const use=name=>import(pathToFileURL(path.join(deps,name)).href);
const {NodeIO}=await use('@gltf-transform/core/dist/index.js');
const {ALL_EXTENSIONS,EXTMeshoptCompression}=await use('@gltf-transform/extensions/dist/index.js');
const {dequantize,quantize}=await use('@gltf-transform/functions/dist/index.js');
const {MeshoptDecoder,MeshoptEncoder}=await use('meshoptimizer/index.js');
await Promise.all([MeshoptDecoder.ready,MeshoptEncoder.ready]);
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder,'meshopt.encoder':MeshoptEncoder});
await mkdir(scratch,{recursive:true});
for(const section of ['abo-test','cc0-test']){
 const dest=path.join(web,'src/assets',section);
 for(const file of (await readdir(dest)).filter(f=>f.endsWith('.glb'))){
  const source=path.join(dest,file),raw=await readFile(source);
  const json=JSON.parse(raw.subarray(20,20+raw.readUInt32LE(12)).toString());
  if(!json.extensionsRequired?.includes('EXT_meshopt_compression')||json.asset?.extras?.atelierLighting||json.extras?.atelierLighting)continue;
  const work=path.join(scratch,file);
  if(process.argv.includes('--publish')){
   const buf=await readFile(work);const info=JSON.parse(buf.subarray(20,20+buf.readUInt32LE(12)).toString());
   if(!info.asset?.extras?.atelierLighting)throw Error('Missing surface bake: '+file);
   const doc=await io.readBinary(buf);
   if(json.extensionsRequired.includes('KHR_mesh_quantization'))await doc.transform(quantize({quantizePosition:16,quantizeNormal:12,quantizeTexcoord:16,quantizeColor:8}));
   doc.createExtension(EXTMeshoptCompression).setRequired(true);
   const result=Buffer.from(await io.writeBinary(doc));
   // glTF-Transform writes its own asset header. Store processing provenance on root extras instead.
   await writeFile(source+'.writing',result);await rename(source+'.writing',source);await unlink(work);
  }else{
   if(json.extras?.atelierLighting)continue;
   const doc=await io.readBinary(raw);
   doc.getRoot().listExtensionsUsed().find(e=>e.extensionName==='EXT_meshopt_compression')?.dispose();
   await doc.transform(dequantize());doc.getRoot().setExtras({...doc.getRoot().getExtras(),atelierLighting:true});
   await writeFile(work,await io.writeBinary(doc));
  }
 }
}

