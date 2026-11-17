import {execFileSync} from 'node:child_process';
import {mkdtemp,rm,lstat,readdir,realpath} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
const parent=await realpath(os.tmpdir());
const dir=await mkdtemp(path.join(parent,'bittertle-editor-check-'));
async function verifyTree(folder){for(const entry of await readdir(folder,{withFileTypes:true})){const file=path.join(folder,entry.name),info=await lstat(file);if(info.isSymbolicLink())throw new Error(`Unexpected link in temporary build: ${file}`);if(info.isDirectory())await verifyTree(file);}}
try{
 execFileSync(process.execPath,['node_modules/typescript/bin/tsc','--noEmit'],{stdio:'inherit',windowsHide:true});
 execFileSync(process.execPath,['node_modules/vite/bin/vite.js','build','--outDir',dir,'--emptyOutDir'],{stdio:'inherit',windowsHide:true,env:{...process.env,ISLAND_CHECK_EDITOR:'1'}});
 console.log('编辑器构建检查通过；临时构建将清理。');
}finally{
 if(path.dirname(await realpath(dir))!==parent||!path.basename(dir).startsWith('bittertle-editor-check-'))throw new Error('Unexpected temporary path');
 await verifyTree(dir);await rm(dir,{recursive:true});
}