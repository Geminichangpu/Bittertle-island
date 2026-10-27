import {upgradeM3} from '../src/data/m3-upgrade.ts';
import {execFileSync} from 'node:child_process';
import {mkdir,writeFile,readFile,readdir,copyFile,unlink} from 'node:fs/promises';
import path from 'node:path';
import {createDemo} from '../src/data/model.ts';
import {sampleHeight} from '../src/terrain/terrain.ts';
const run=(args)=>execFileSync(process.execPath,args,{stdio:'inherit',windowsHide:true});
// A model-only rebuild must not replace an existing authored viewer or example layout.
const readExisting=async file=>{try{return await readFile(file,'utf8');}catch(e){if(e.code==='ENOENT')return null;throw e;}};
const examplePath='examples/比特尔特岛-示例工程.json',existingExample=await readExisting(examplePath);
const existingViewer=await readExisting('dist-viewer/project.json');
const previousManifestText=await readExisting('public/viewer-template/manifest.json');
const previousManifest=previousManifestText?JSON.parse(previousManifestText):[];
run(['node_modules/typescript/bin/tsc','--noEmit']);
run(['node_modules/vite/bin/vite.js','build','--mode','viewer']);
const upgraded=text=>{if(text===null)return null;const p=JSON.parse(text);return p.terrain.heightmapRevision===1&&p.terrain.landscapeRevision===2&&p.environment?.revision===1&&(!p.objects.some(o=>o.id==='landmark_feihua')||p.groups?.some(g=>g.id==='feihua_group'))?text:JSON.stringify(upgradeM3(p),null,2);};
const updatedExample=upgraded(existingExample),updatedViewer=upgraded(existingViewer);
const demo=createDemo(),published=process.argv.includes('--use-project-layout')?JSON.stringify(demo,null,2):null;const data=published??updatedExample??JSON.stringify(demo,null,2);
await mkdir('examples',{recursive:true});if(existingExample===null&&!published)await writeFile(examplePath,data);await writeFile('dist-viewer/project.json',published??updatedViewer??data);
async function walk(dir,base=''){const result=[];for(const e of await readdir(dir,{withFileTypes:true})){const rel=base+e.name;if(e.isDirectory())result.push(...await walk(path.join(dir,e.name),rel+'/'));else result.push(rel);}return result;}
const files=await walk('dist-viewer');for(const name of files){if(name==='project.json')continue;const dest=path.join('public/viewer-template',name);await mkdir(path.dirname(dest),{recursive:true});await copyFile(path.join('dist-viewer',name),dest);}
// Remove only superseded files previously owned by the manifest. Never remove
// layouts, unknown files, nested paths, or files outside the asset directory.
const current=new Set(files);
if(Array.isArray(previousManifest))for(const name of previousManifest){
 if(typeof name!=='string'||!/^assets\/[\w.-]+$/.test(name)||current.has(name))continue;
 try{await unlink(path.join('public/viewer-template',name));}catch(error){if(error.code!=='ENOENT')throw error;}
}
await writeFile('public/viewer-template/manifest.json',JSON.stringify(files.filter(n=>n!=='project.json'),null,2));console.log(`只读 viewer 已构建，发布模板 ${files.length} 个文件，已有布局文件保留。`);
