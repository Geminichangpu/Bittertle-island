// Rebuild the display used by 启动沙盘.cmd while retaining its chosen project.json.
import {build} from 'vite';
import {constants} from 'node:fs';
import {copyFile,mkdir,readdir,unlink} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const source=fileURLToPath(new URL('../',import.meta.url));
const display=path.resolve(source,'../展示版');
const assets=path.join(display,'assets');
const previous=await readdir(assets).catch(error=>{if(error.code==='ENOENT')return [];throw error;});
const bundle=await build({root:source,mode:'viewer',build:{outDir:display,emptyOutDir:false}});
const outputs=new Set((Array.isArray(bundle)?bundle:[bundle]).flatMap(item=>item.output.map(entry=>entry.fileName)));

for(const directory of ['plant-art','flora-pack','island-surfaces']){
 const target=path.join(display,directory);
 await mkdir(target,{recursive:true});
 for(const file of await readdir(path.join(source,'public',directory),{withFileTypes:true})){
  if(file.isFile()&&/\.(?:glb|jpg|png)$/.test(file.name)){
   await copyFile(path.join(source,'public',directory,file.name),path.join(target,file.name));
  }
 }
}
try {
 await copyFile(path.join(source,'比特尔特岛-布局.json'),path.join(display,'project.json'),constants.COPYFILE_EXCL);
} catch (error) {
 if(error.code!=='EEXIST')throw error;
}

// Only retire superseded Vite hashes for assets represented in this build.
const logicalName=file=>file.replace(/-[a-zA-Z0-9_-]{8}(\.[^.]+)$/,'$1');
const activeNames=new Set([...outputs].filter(f=>f.startsWith('assets/')).map(f=>logicalName(path.posix.basename(f))));
for(const name of previous){
 if(name!==logicalName(name)&&activeNames.has(logicalName(name))&&!outputs.has('assets/'+name)){
  await unlink(path.join(assets,name));
 }
}
console.log('Local display built at',display);

