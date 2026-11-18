// Rebuild web topology from the installed ABO library. Keep original UV islands,
// silhouettes and material assignments; woven strips need a tighter error bound.
import path from 'node:path';
import {readdir,readFile,rename,writeFile} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';

const web=fileURLToPath(new URL('../',import.meta.url));
const packages=path.join(web,'reports/performance/tools/node_modules');
const use=name=>import(pathToFileURL(path.join(packages,name)).href);
const {NodeIO}=await use('@gltf-transform/core/dist/index.js');
const {ALL_EXTENSIONS,EXTMeshoptCompression}=await use('@gltf-transform/extensions/dist/index.js');
const {dedup,weld,simplify,prune}=await use('@gltf-transform/functions/dist/index.js');
const {MeshoptDecoder,MeshoptEncoder,MeshoptSimplifier}=await use('meshoptimizer/index.js');
await Promise.all([MeshoptDecoder.ready,MeshoptEncoder.ready,MeshoptSimplifier.ready]);
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder,'meshopt.encoder':MeshoptEncoder});
const library=process.argv[2];
if(!library)throw new Error('Supply the local ABO objects directory.');
const aboProfiles=[
 ['B007IHF36E',20000,.00045],['B01D3C7Z4A',16000,.0004],
 ['B078JG4N1N',27000,.0006],['B078JM9XSJ',19000,.0005],
 ['B07B7N6JH3',24000,.0004],['B07B83KVGK',6800,.00028],
 ['B07B8NW6C9',7200,.0004],['B07BLB6644',10500,.0003],
 ['B07HPMBN4B',4700,.00032],['B07K12WN6V',14000,.00046],
 ['B07TLDNPXW',15000,.00042],['B07WDJRMPG',23000,.00035],
 ['B07WMQ8P8Q',23000,.00045],['B07YNFQCWM',27500,.00026],
 ['B07YPRSX86',3300,.00025],['B07ZSZ4FYF',34000,.00028],
 ['B07ZVM6QMT',14500,.00055],['B07ZVMQ9B9',15500,.00045],
 ['B0857JQ3BZ',38000,.00025],['B0857JZJPR',46000,.00026],
 ['B0857K54FM',39000,.00025],
];
const scanned=process.argv.includes('--scanned');
const profiles=scanned?[
 ['potted_plant_02',15800,.00025],['tree_stump_01',4750,.00016],
 ['wooden_display_shelves_01',3100,.00012],['armchair_01',5430,.00012],
 ['sofa_02',2710,.00010],['standing_picture_frame_01',1634,.00010],
]:aboProfiles;
const out=path.join(web,'src/assets',scanned?'cc0-test':'abo-test');
const folders=scanned?await readdir(library,{withFileTypes:true}):[];
for(const [id,budget,error] of profiles){
 const dest=path.join(out,id+'.glb');
 let source=path.join(library,id,id+'.glb');
 if(scanned){
  source=dest;
  for(const section of folders.filter(s=>s.isDirectory())){
   const names=await readdir(path.join(library,section.name));
   if(names.includes(id)){source=path.join(library,section.name,id,'model.glb');break;}
  }
 }
 const doc=await io.readBinary(await readFile(source));
 if(scanned&&doc.getRoot().getExtras().islandScanTopology)continue;
 const meshes=doc.getRoot().listMeshes();
 const triangles=()=>meshes.reduce((n,m)=>n+m.listPrimitives().reduce((s,p)=>s+(p.getIndices()?.getCount()??p.getAttribute('POSITION').getCount())/3,0),0);
 const before=triangles();
 await doc.transform(weld(),simplify({simplifier:MeshoptSimplifier,ratio:Math.min(1,budget/before),error}),dedup(),prune({keepAttributes:true,keepLeaves:true}));
 doc.createExtension(EXTMeshoptCompression).setRequired(true);
 if(scanned)doc.getRoot().setExtras({...doc.getRoot().getExtras(),islandScanTopology:1});
 const draft=dest+'.writing';
 await writeFile(draft,await io.writeBinary(doc));await rename(draft,dest);
 console.log(id,before,'->',triangles());
}
