// Rebuild an experimental lossless Meshopt copy; never overwrites the source GLB.
// Install the optional tools into reports/performance/tools as described in the report.
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
const root=path.resolve('reports/performance/tools/node_modules');
const load=relative=>import(pathToFileURL(path.join(root,relative)).href);
const {NodeIO}=await load('@gltf-transform/core/dist/index.js');
const {ALL_EXTENSIONS,EXTMeshoptCompression}=await load('@gltf-transform/extensions/dist/index.js');
const {MeshoptEncoder,MeshoptDecoder}=await load('meshoptimizer/index.js');
await MeshoptEncoder.ready;await MeshoptDecoder.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
const source='src/assets/models/feihua-interior-refined-v1.glb';
const output='reports/performance/optimized/feihua-interior-meshopt-lossless.glb';
fs.mkdirSync(path.dirname(output),{recursive:true});
const doc=await io.read(source);doc.createExtension(EXTMeshoptCompression).setRequired(true);await io.write(output,doc);
const checked=await io.read(output);console.log(JSON.stringify({source,output,bytes:fs.statSync(output).size,meshes:checked.getRoot().listMeshes().length,materials:checked.getRoot().listMaterials().length},null,2));
