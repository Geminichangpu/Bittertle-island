import {upgradeM3} from '../src/data/m3-upgrade.ts';
import {execFileSync} from 'node:child_process';
import {mkdir,writeFile,readFile,readdir,copyFile} from 'node:fs/promises';
import path from 'node:path';
import {createDemo} from '../src/data/model.ts';
const run=args=>execFileSync(process.execPath,args,{stdio:'inherit',windowsHide:true});
const readExisting=async file=>{try{return await readFile(file,'utf8');}catch(e){if(e.code==='ENOENT')return null;throw e;}};
const examplePath='examples/比特尔特岛-示例工程.json';
const existingExample=await readExisting(examplePath);
const existingViewer=await readExisting('dist-viewer/project.json');
const viewer=path.resolve('dist-viewer');
run(['node_modules/typescript/bin/tsc','--noEmit']);
run(['node_modules/vite/bin/vite.js','build','--mode','viewer']);
// The viewer build disables publicDir, so add the two runtime model packs.
for(const dir of ['plant-art','flora-pack','island-surfaces']){
 await mkdir(path.join(viewer,dir),{recursive:true});
 for(const entry of await readdir(path.join('public',dir),{withFileTypes:true}))if(entry.isFile()&&/\.(glb|png|jpg)$/.test(entry.name)){
  await copyFile(path.join('public',dir,entry.name),path.join(viewer,dir,entry.name));
 }
}
const upgraded=text=>{if(text===null)return null;const p=JSON.parse(text);return p.terrain.heightmapRevision===1&&p.terrain.landscapeRevision===2&&p.environment?.revision===1&&(!p.objects.some(o=>o.id==='landmark_feihua')||p.groups?.some(g=>g.id==='feihua_group'))?text:JSON.stringify(upgradeM3(p),null,2);};
const updatedExample=upgraded(existingExample),updatedViewer=upgraded(existingViewer);
const published=process.argv.includes('--use-project-layout')?JSON.stringify(createDemo(),null,2):null;
const data=published??updatedExample??JSON.stringify(createDemo(),null,2);
await mkdir('examples',{recursive:true});if(existingExample===null&&!published)await writeFile(examplePath,data);
await writeFile(path.join(viewer,'project.json'),published??updatedViewer??data);
async function walk(dir,base=''){const result=[];for(const e of await readdir(dir,{withFileTypes:true})){const rel=base+e.name;if(e.isDirectory())result.push(...await walk(path.join(dir,e.name),rel+'/'));else result.push(rel);}return result;}
const files=(await walk(viewer)).filter(n=>n!=='project.json'&&n!=='manifest.json');
await writeFile(path.join(viewer,'manifest.json'),JSON.stringify(files,null,2));
console.log(`展示版已构建，${files.length} 个资源与导出模板共用一份，布局已保留。`);
