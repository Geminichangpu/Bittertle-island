import { defineConfig, type Plugin } from 'vite';
import {createReadStream} from 'node:fs';
import {realpath, stat, readFile, mkdir, copyFile} from 'node:fs/promises';
import path from 'node:path';

// Serve generated templates directly so a running dev server sees files added
// by a later viewer build without requiring a restart or a page reload.
function liveViewerTemplate():Plugin {
 return {name:'live-viewer-template',configureServer(server){
  const root=path.resolve('dist-viewer');
  server.middlewares.use('/viewer-template',async(req,res,next)=>{
   if(req.method!=='GET'&&req.method!=='HEAD')return next();
   try{
    const name=decodeURIComponent(new URL(req.url||'/', 'http://localhost').pathname).replace(/^\/+/, '');
    if(!name||name.includes('\\')||name.includes('\0')||name.split('/').some(x=>!x||x==='.'||x==='..')){res.statusCode=400;res.end();return;}
    const file=path.resolve(root,...name.split('/'));
    if(!file.startsWith(root+path.sep)){res.statusCode=403;res.end();return;}
    const [actualRoot,actualFile,info]=await Promise.all([realpath(root),realpath(file),stat(file)]);
    if(!actualFile.startsWith(actualRoot+path.sep)||!info.isFile()){res.statusCode=404;res.end();return;}
    const types:Record<string,string>={'.json':'application/json; charset=utf-8','.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.jpg':'image/jpeg','.glb':'model/gltf-binary'};
    res.setHeader('Content-Type',types[path.extname(file).toLowerCase()]||'application/octet-stream');
    res.setHeader('Content-Length',info.size);res.setHeader('Cache-Control','no-store');
    if(req.method==='HEAD'){res.end();return;}
    const stream=createReadStream(file);stream.on('error',()=>res.destroy());stream.pipe(res);
   }catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT'){res.statusCode=404;res.end();return;}next(error);}
  });
 }};
}
// A manual portable editor build needs the viewer files, while the normal
// push check uses a temporary build and keeps only the original viewer tree.
function portableEditorTemplate():Plugin {
 let outDir='',mode='';
 return {name:'portable-editor-template',apply:'build',configResolved(config){outDir=path.resolve(config.root,config.build.outDir);mode=config.mode;},async closeBundle(){
  if(mode==='viewer'||process.env.ISLAND_CHECK_EDITOR==='1')return;
  const source=path.resolve('dist-viewer');let raw:string;
  try{raw=await readFile(path.join(source,'manifest.json'),'utf8');}catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT'){console.warn('展示模板尚未构建；如需导出请先运行 pnpm build:viewer。');return;}throw error;}
  const files:unknown=JSON.parse(raw);if(!Array.isArray(files))throw new Error('Invalid viewer manifest');
  const target=path.resolve(outDir,'viewer-template');
  for(const name of [...files,'manifest.json']){
   if(typeof name!=='string'||!name||name.includes('\\')||name.split('/').some(x=>!x||x==='.'||x==='..'))throw new Error('Unsafe viewer manifest path');
   const from=path.resolve(source,...name.split('/')),to=path.resolve(target,...name.split('/'));
   if(!from.startsWith(source+path.sep)||!to.startsWith(target+path.sep))throw new Error('Viewer path outside build');
   await mkdir(path.dirname(to),{recursive:true});await copyFile(from,to);
  }
 }};
}
export default defineConfig(({mode,command})=>({base:'./',plugins:[liveViewerTemplate(),portableEditorTemplate()],server:{watch:{ignored:['**/reports/**','**/Codex/**','**/本地资源/**','**/dist/**','**/dist-viewer/**','**/releases/**','**/public/viewer-template/**','**/src/assets/models-optimized/**']}},publicDir:command==='build'&&(mode==='viewer'||process.env.ISLAND_CHECK_EDITOR==='1')?false:'public',build:{assetsInlineLimit:(file)=>file.endsWith('.glb')?false:undefined,outDir:mode==='viewer'?'dist-viewer':'dist',chunkSizeWarningLimit:750,rollupOptions:{output:{manualChunks:{three:['three','three/addons/controls/OrbitControls.js'],react:['react','react-dom/client']}}}},define:{__VIEWER__:JSON.stringify(mode==='viewer')}}));
