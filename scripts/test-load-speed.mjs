import {chromium} from 'playwright-core';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';

const base=process.env.TEST_URL||'http://127.0.0.1:4191/';
const output=process.argv.find(a=>a.startsWith('--output='))?.slice(9)||'reports/publish-r187/load-speed.json';
const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const results=[];
await mkdir(path.dirname(output),{recursive:true});
try{
 for(const name of process.argv.includes('--native-only')?['native']:['native','constrained']){
  console.log(`Loading ${name}: ${base}`);
  const context=await browser.newContext({viewport:{width:1280,height:800},deviceScaleFactor:1,reducedMotion:'no-preference'}),page=await context.newPage(),cdp=await context.newCDPSession(page);
  await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
  if(name==='constrained'){await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:80,downloadThroughput:1_250_000,uploadThroughput:250_000});await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});}
  const errors=[],warnings=[],failed=[],badResponses=[],pending=new Set(),glbs=new Set();let lastNetwork=Date.now(),glbRequests=0,maxGlbs=0,activeGlbs=0;
  page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());if(m.type()==='warning')warnings.push(m.text());});
  page.on('request',r=>{if(r.url().startsWith('http')){pending.add(r);lastNetwork=Date.now();}if(r.url().includes('.glb')){glbRequests++;activeGlbs++;maxGlbs=Math.max(maxGlbs,activeGlbs);}});
  page.on('requestfinished',r=>{pending.delete(r);lastNetwork=Date.now();if(r.url().includes('.glb')){activeGlbs--;glbs.add(r.url());}});
  page.on('requestfailed',r=>{pending.delete(r);lastNetwork=Date.now();if(r.url().includes('.glb'))activeGlbs--;if(!r.failure()?.errorText.includes('ERR_ABORTED'))failed.push({url:r.url(),error:r.failure()?.errorText});});
  page.on('response',r=>{if(r.status()>=400)badResponses.push({url:r.url(),status:r.status()});});
  const quiet=async()=>{const deadline=Date.now()+240000;while(pending.size||Date.now()-lastNetwork<2000){if(Date.now()>deadline)throw new Error('Timed out waiting for resource bodies: '+[...pending].map(r=>r.url()).join(', '));await page.waitForTimeout(200);}};
  const snapshot=()=>page.evaluate(()=>{const r=performance.getEntriesByType('resource').filter(r=>r.name.startsWith('http'));return {requests:r.length,bodyBytes:r.reduce((s,r)=>s+r.encodedBodySize,0),transferBytes:r.reduce((s,r)=>s+r.transferSize,0),resources:r.map(r=>({url:r.name,bodyBytes:r.encodedBodySize,transferBytes:r.transferSize,durationMs:r.duration}))};});
  const result={name,url:base,conditions:{viewport:[1280,800],dpr:1,cache:'disabled',network:name==='constrained'?'10 Mbps / 80 ms latency':'actual connection, no throttling',cpuSlowdown:name==='constrained'?4:1},errors,warnings,failed,badResponses};results.push(result);
  const start=Date.now();const response=await page.goto(base,{waitUntil:'domcontentloaded',timeout:120000});assert.equal(response.status(),200);
  await page.locator('.canvas-host canvas').waitFor({timeout:120000});await page.locator('.loading').waitFor({state:'hidden',timeout:120000});result.firstDrawMs=Date.now()-start;
  await quiet();result.overviewCompleteMs=Date.now()-start;result.overview=await snapshot();result.initialGlbRequests=glbRequests;assert.equal(glbRequests,0,'Overview should use procedural meshes');
  const near=Date.now();await page.getByRole('button',{name:'⌖ 神社',exact:true}).click();await page.waitForFunction(()=>performance.getEntriesByType('resource').filter(r=>r.name.includes('shrine_')&&r.name.includes('.glb')&&r.responseEnd>0).length===8,null,{timeout:240000});await quiet();result.nearbyDownloadAndQuietMs=Date.now()-near;
  result.nearby=await snapshot();result.nearbyAddedBodyBytes=result.nearby.bodyBytes-result.overview.bodyBytes;result.maxConcurrentGlbs=maxGlbs;result.completedGlbs=[...glbs];assert(maxGlbs<=2);assert.equal(result.completedGlbs.filter(u=>u.includes('shrine_')).length,8);assert(!result.completedGlbs.some(u=>u.includes('scenic_sakura')));
  result.canvas=await page.locator('.canvas-host canvas').evaluate(c=>({width:c.width,height:c.height,cssWidth:c.clientWidth,cssHeight:c.clientHeight}));
  await page.screenshot({path:path.join(path.dirname(output),`load-${name}.png`)});assert.deepEqual(errors,[]);assert.deepEqual(warnings,[]);assert.deepEqual(failed,[]);assert.deepEqual(badResponses,[]);
  console.log(JSON.stringify({name,firstDrawMs:result.firstDrawMs,overviewCompleteMs:result.overviewCompleteMs,overviewBodyBytes:result.overview.bodyBytes,nearbyDownloadAndQuietMs:result.nearbyDownloadAndQuietMs,nearbyAddedBodyBytes:result.nearbyAddedBodyBytes,maxConcurrentGlbs:maxGlbs,completedGlbs:glbs.size}));await context.close();
 }
}finally{await writeFile(output,JSON.stringify({measuredAt:new Date().toISOString(),results},null,2));await browser.close();}
