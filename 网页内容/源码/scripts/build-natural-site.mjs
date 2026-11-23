import {execFileSync} from 'node:child_process';
import {mkdir,copyFile,readdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {createDemo} from '../src/data/model.ts';

const run=args=>execFileSync(process.execPath,args,{stdio:'inherit',windowsHide:true});
run(['node_modules/typescript/bin/tsc','--noEmit']);
run(['node_modules/vite/bin/vite.js','build','--mode','viewer','--outDir','dist']);

// Keep the original on-demand model packs available for every walking route.
async function copyDirectory(from,to){
 await mkdir(to,{recursive:true});
 for(const entry of await readdir(from,{withFileTypes:true})){
  const src=path.join(from,entry.name),dest=path.join(to,entry.name);
  if(entry.isDirectory())await copyDirectory(src,dest);else await copyFile(src,dest);
 }
}
for(const directory of ['plant-art','flora-pack','island-surfaces']){
 await copyDirectory(path.join('public',directory),path.join('dist',directory));
}
const project=createDemo();
project.projectName='比特尔特岛 · 自然重制';
await writeFile('dist/project.json',JSON.stringify(project));
console.log('自然小岛已构建：地标、第一人称与室内漫游共同使用原工程布局。');
