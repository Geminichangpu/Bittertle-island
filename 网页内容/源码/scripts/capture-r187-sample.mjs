import {chromium} from 'playwright-core';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
const stage=process.argv[2]||'before',dir='reports/r187-sample';
await mkdir(dir,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:960},deviceScaleFactor:1}),errors=[],warnings=[],failed=[];
page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());if(m.type()==='warning')warnings.push(m.text());});page.on('requestfailed',r=>failed.push({url:r.url(),error:r.failure()?.errorText}));
try{
 await page.goto('http://127.0.0.1:4190/?diagnostics=1');await page.waitForFunction(()=>window.__islandDiagnostics&&window.__island,{timeout:90000});
 await page.getByRole('button',{name:'展示模式',exact:true}).click();
 await page.addStyleTag({content:'.viewport-title,.display-places,.compass,.view-controls,.environment-controls{visibility:hidden!important}'});
 let fixtures;
 if(stage==='before'||stage==='foliage-before'){
  fixtures=await page.evaluate(async()=>{const T=await import('/node_modules/.vite/deps/three.js'),s=window.__island.scene,g=s.node('shrine_group');g.updateWorldMatrix(true,true);const view=(id,target,eye,zoom)=>({id,name:id,position:g.localToWorld(new T.Vector3(...eye)).toArray(),target:g.localToWorld(new T.Vector3(...target)).toArray(),zoom,perspective:false});return [view('entrance',[0,4,12],[55,55,110],3.3),view('coast',[15,0,35],[105,85,135],1.8),view('joinery',[16,3,-8],[65,30,65],6)];});
  if(stage==='foliage-before')fixtures=await page.evaluate(async()=>{const T=await import('/node_modules/.vite/deps/three.js'),s=window.__island.scene;return [['sakura','scenic_sakura',[0,8,0],[35,25,48],12],['grove','shrine_group',[-12,5,32],[30,30,78],11]].map(([id,key,target,eye,zoom])=>{const n=s.node(key);n.updateWorldMatrix(true,true);return {id,name:id,position:n.localToWorld(new T.Vector3(...eye)).toArray(),target:n.localToWorld(new T.Vector3(...target)).toArray(),zoom,perspective:false};});});
  await writeFile(`${dir}/${stage.startsWith('foliage')?'foliage-':''}cameras.json`,JSON.stringify(fixtures,null,2));
 }else fixtures=JSON.parse(await readFile(`${dir}/${stage.startsWith('foliage')?'foliage-':''}cameras.json`,'utf8'));
 const results=[];
 for(const fixture of fixtures){
  console.log(`Capturing ${stage}: ${fixture.id}`);
  await page.evaluate(v=>{const s=window.__island.scene;s.labels.visible=false;s.regions.visible=false;s.restoreView(v);},fixture);
  await page.waitForTimeout(4500);await page.waitForLoadState('networkidle');
  await page.evaluate(()=>{const s=window.__island.scene;s.water?.setAnimated(false);s.scheduler.renderNow();});
  const start=await page.evaluate(()=>window.__island.scene.scheduler.frames);await page.waitForTimeout(1000);
  const data=await page.evaluate(async()=>{const T=await import('/node_modules/.vite/deps/three.js'),s=window.__island.scene,gl=s.renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info'),times=[];for(let i=0;i<3;i++){s.scheduler.renderNow();gl.finish();}for(let i=0;i<12;i++){const t=performance.now();s.scheduler.renderNow();gl.finish();times.push(performance.now()-t);}times.sort((a,b)=>a-b);return {revision:T.REVISION,view:s.getView('fixed'),viewport:{width:s.host.clientWidth,height:s.host.clientHeight,dpr:s.renderer.getPixelRatio(),bufferWidth:s.renderer.domElement.width,bufferHeight:s.renderer.domElement.height},gpu:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),stats:window.__islandDiagnostics.stats(),frames:s.scheduler.frames,timing:{medianMs:times[6],p95Ms:times[11],samples:times},refined:[...s.objectNodes].filter(([,n])=>n.userData.modelVariant==='refined').map(([id])=>id),shadowType:s.renderer.shadowMap.type};});
  data.id=fixture.id;data.idleFrames=data.frames-start-15;
  await page.locator('.canvas-host canvas').screenshot({path:`${dir}/${stage}-${fixture.id}.png`});results.push(data);
 }
 await writeFile(`${dir}/${stage}.json`,JSON.stringify({stage,results,errors,warnings,failed},null,2));console.log(JSON.stringify({stage,results:results.map(({id,revision,timing,stats,viewport,idleFrames,refined})=>({id,revision,medianMs:timing.medianMs,calls:stats.calls,triangles:stats.triangles,viewport,idleFrames,refined})),errors,warnings,failed},null,2));
}finally{await browser.close();}
