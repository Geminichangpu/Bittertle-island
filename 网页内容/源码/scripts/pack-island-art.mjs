// Bake web GLBs and content-addressed PBR maps from the Blender authoring assets.
import {createHash} from 'node:crypto';
import {mkdir,readdir,readFile,rename,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';

const root=fileURLToPath(new URL('../',import.meta.url));
const packages=path.join(root,'reports/performance/tools/node_modules');
const localImport=name=>import(pathToFileURL(path.join(packages,name)).href);
const require=createRequire(import.meta.url);
const sharp=require(path.join(packages,'sharp'));
const {NodeIO}=await localImport('@gltf-transform/core/dist/index.js');
const {ALL_EXTENSIONS,EXTMeshoptCompression}=await localImport('@gltf-transform/extensions/dist/index.js');
const {MeshoptEncoder,MeshoptDecoder}=await localImport('meshoptimizer/index.js');
await Promise.all([MeshoptEncoder.ready,MeshoptDecoder.ready]);
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS)
 .registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
const maps=path.join(root,'public/island-surfaces');
await mkdir(maps,{recursive:true});
const cached=new Map();
const hash=data=>createHash('sha256').update(data).digest('hex').slice(0,32);
const align=n=>Math.ceil(n/4)*4;

async function saveSurface(data,image,alpha){
 const linear=/rough|metal|orm|normal|nor_gl|occlusion/i.test(image.name||'');
 const key=hash(data)+'/'+(linear?'linear':alpha?'alpha':'opaque');
 if(cached.has(key))return cached.get(key);
 const limit=linear?512:768;
 let pipeline=sharp(data).resize({width:limit,height:limit,fit:'inside',withoutEnlargement:true});
 const png=linear||alpha;
 pipeline=png?pipeline.png({compressionLevel:9}):pipeline.removeAlpha().jpeg({quality:88,chromaSubsampling:'4:4:4'});
 const pixels=await pipeline.toBuffer();
 const filename=hash(pixels)+(png?'.png':'.jpg');
 await writeFile(path.join(maps,filename),pixels);
 cached.set(key,filename);
 return filename;
}

async function splitImages(bytes){
 const length=bytes.readUInt32LE(12);
 const doc=JSON.parse(bytes.subarray(20,20+length).toString('utf8'));
 const bin=bytes.subarray(28+length);
 const images=doc.images||[];
 if(!images.some(i=>i.bufferView!==undefined))return bytes;
 const transparent=new Set((doc.materials||[]).filter(m=>m.alphaMode==='BLEND'||m.alphaMode==='MASK')
  .map(m=>m.pbrMetallicRoughness?.baseColorTexture?.index).filter(i=>i!==undefined)
  .map(i=>doc.textures[i].source));
 const removed=new Set();
 for(const [i,image] of images.entries()){
  if(image.bufferView===undefined)continue;
  const index=image.bufferView,view=doc.bufferViews[index],start=view.byteOffset||0;
  const name=await saveSurface(bin.subarray(start,start+view.byteLength),image,transparent.has(i));
  removed.add(index);delete image.bufferView;delete image.mimeType;
  image.uri='island-surfaces/'+name;
 }
 const gaps=[...removed].map(i=>doc.bufferViews[i]).map(v=>[v.byteOffset||0,align((v.byteOffset||0)+v.byteLength)]).sort((a,b)=>a[0]-b[0]);
 const offset=old=>old-gaps.reduce((n,[start,end])=>n+(end<=old?end-start:0),0);
 const indices=new Map(),remaining=[];
 for(const [i,v] of doc.bufferViews.entries()){
  if(removed.has(i))continue;
  indices.set(i,remaining.length);remaining.push(v);
  if(v.buffer===0)v.byteOffset=offset(v.byteOffset||0);
  const packed=v.extensions?.EXT_meshopt_compression;
  if(packed?.buffer===0)packed.byteOffset=offset(packed.byteOffset||0);
 }
 for(const a of doc.accessors){
  if(a.bufferView!==undefined)a.bufferView=indices.get(a.bufferView);
  if(a.sparse)for(const k of ['indices','values'])a.sparse[k].bufferView=indices.get(a.sparse[k].bufferView);
 }
 doc.bufferViews=remaining;
 const segments=[];let last=0;
 for(const [start,end] of gaps){segments.push(bin.subarray(last,start));last=end;}
 segments.push(bin.subarray(last));
 const compact=Buffer.concat(segments);
 doc.buffers[0].byteLength=compact.byteLength;
 const json=Buffer.from(JSON.stringify(doc));
 const result=Buffer.alloc(28+align(json.length)+align(compact.length));
 result.writeUInt32LE(0x46546c67,0);result.writeUInt32LE(2,4);result.writeUInt32LE(result.length,8);
 result.writeUInt32LE(align(json.length),12);result.writeUInt32LE(0x4e4f534a,16);
 result.fill(32,20,20+align(json.length));json.copy(result,20);
 const next=20+align(json.length);
 result.writeUInt32LE(align(compact.length),next);result.writeUInt32LE(0x004e4942,next+4);compact.copy(result,next+8);
 return result;
}
async function publishLocal(file,data){
 const draft=file+'.writing';await writeFile(draft,data);await rename(draft,file);
}
const masters=path.resolve(root,'../../资源/src/assets/models');
const optimized=path.join(root,'src/assets/models-optimized');
const rooms=process.argv.slice(2).filter(arg=>arg.startsWith('--room=')).map(arg=>arg.slice(7)+'-interior-refined-v1.glb');
for(const name of process.argv.includes('--public-only')?[]:await readdir(masters)){
 if(rooms.length&&!rooms.includes(name))continue;
 if(!/(?:-interior|^shrine_.+-exterior)-refined-v1\.glb$/.test(name))continue;
 const doc=await io.read(path.join(masters,name));
 doc.createExtension(EXTMeshoptCompression).setRequired(true);
 const dest=path.join(optimized,name.replace('-refined-v1','-meshopt-lossless'));
 await publishLocal(dest,await splitImages(Buffer.from(await io.writeBinary(doc))));
 console.log('Packed',name);
}
for(const dir of rooms.length?[]:[path.join(root,'src/assets/models'),path.join(root,'public/flora-pack'),path.join(root,'public/plant-art')]){
 for(const name of await readdir(dir)){
  if(!name.endsWith('.glb'))continue;
  const file=path.join(dir,name),original=await readFile(file);
  const web=await splitImages(original);
  if(web!==original)await publishLocal(file,web);
 }
}
console.log('Shared surface encodes:',cached.size);

