import {existsSync} from 'node:fs';
import {spawn} from 'node:child_process';

// An ordinary GitHub checkout still opens the original editor. The independent
// hosted preview uses the immersive viewer, with the same scene and project data.
const hosted=existsSync('.openai/hosting.json');
const action=process.argv[2];
function run(args){
 return new Promise((resolve,reject)=>{
  const child=spawn(process.execPath,args,{stdio:'inherit',windowsHide:true});
  const stop=signal=>child.kill(signal);
  const interrupt=()=>stop('SIGINT'),terminate=()=>stop('SIGTERM');
  process.on('SIGINT',interrupt);process.on('SIGTERM',terminate);
  child.once('error',reject);
  child.once('exit',(code,signal)=>{
   process.off('SIGINT',interrupt);process.off('SIGTERM',terminate);
   if(code===0)resolve();else reject(new Error(`Project command exited: ${signal||code}`));
  });
 });
}
if(action==='dev'){
 if(hosted)await import('./prepare-natural.mjs');
 await run(['node_modules/vite/bin/vite.js','--host',hosted?'0.0.0.0':'127.0.0.1',...(hosted?['--mode','viewer']:[]),...process.argv.slice(3)]);
}else if(action==='build'){
 if(hosted)await import('./build-natural-site.mjs');
 else {await run(['node_modules/typescript/bin/tsc','--noEmit']);await run(['node_modules/vite/bin/vite.js','build',...process.argv.slice(3)]);}
}else throw new Error('Expected dev or build');
