import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';

// Run after pnpm build:viewer. Set BROWSER_PATH if Chrome/Edge is elsewhere.
const executablePath=[process.env.BROWSER_PATH,'C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(p=>p&&existsSync(p));
if(!executablePath)throw new Error('Set BROWSER_PATH to a local Chrome or Edge executable.');
const server=spawn(process.execPath,['scripts/serve.mjs','dist-viewer','4185'],{stdio:['ignore','pipe','pipe'],windowsHide:true});
let browser;
try{
 await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Local server did not start')),15000);server.stdout.once('data',()=>{clearTimeout(timer);resolve();});server.once('error',reject);server.once('exit',code=>reject(new Error(`Local server exited: ${code}`)));});
 browser=await chromium.launch({executablePath,headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[],completed=[],running=new Set();let max=0,fail=true,started=0;
 page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(r.url().endsWith('.glb')){running.add(r);started++;max=Math.max(max,running.size);}});
 page.on('requestfinished',r=>{if(running.delete(r))completed.push(r.url());});page.on('requestfailed',r=>running.delete(r));
 await page.route('**/landmark_feihua-refined-*.glb',r=>{if(fail){fail=false;return r.abort();}return r.continue();});
 await page.goto('http://127.0.0.1:4185/');await page.locator('.canvas-host canvas').waitFor({timeout:60000});await page.waitForTimeout(2000);assert.equal(started,0,'Overview must not request detailed GLBs');
 await page.getByRole('button',{name:'⌖ 绯华楼',exact:true}).click();await page.getByRole('button',{name:'重试精修模型'}).waitFor({timeout:60000});
 await page.waitForFunction(()=>performance.getEntriesByType('resource').some(r=>r.name.includes('feihua_annex-refined')),{timeout:60000});
 const retry=page.waitForResponse(r=>r.url().includes('landmark_feihua-refined')&&r.status()===200,{timeout:90000});await page.getByRole('button',{name:'重试精修模型'}).click();await retry;await page.waitForTimeout(2000);
 assert(max<=2,`Expected at most 2 concurrent GLB requests, got ${max}`);assert(completed.some(u=>u.includes('feihua_annex-refined')),'Another building should load despite the failed request');assert.deepEqual(errors,[]);console.log(JSON.stringify({initialGlbs:0,maxConcurrent:max,retrySucceeded:true,completed:completed.length,errors}));
} finally {await browser?.close();server.kill();}
