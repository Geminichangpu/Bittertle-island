import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';

const dir='reports/nature-sample';await mkdir(dir,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const report={errors:[],warnings:[],failed:[]};
try{
 const page=await browser.newPage({viewport:{width:1440,height:960},deviceScaleFactor:1,reducedMotion:'no-preference'});
 page.on('pageerror',e=>report.errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());if(m.type()==='warning')report.warnings.push(m.text());});
 page.on('requestfailed',r=>{if(!r.failure()?.errorText.includes('ERR_ABORTED'))report.failed.push(r.url());});
 await page.goto('http://127.0.0.1:4194/?diagnostics=1');await page.waitForFunction(()=>window.__islandDiagnostics&&window.__island,{timeout:90000});await page.waitForLoadState('networkidle');
 const views=JSON.parse(await readFile(`${dir}/cameras.json`,'utf8'));
 report.overview=await page.evaluate(()=>{const s=window.__island.scene,gl=s.renderer.getContext(),debug=gl.getExtension('WEBGL_debug_renderer_info');return {refined:[...s.objectNodes.values()].filter(n=>n.userData.modelVariant==='refined').length,grass:s.environment.getObjectByName('近景小草簇').visible,renderer:debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),waterRunning:s.water.running};});
 assert.equal(report.overview.refined,0);assert.equal(report.overview.grass,false);assert.equal(report.overview.waterRunning,false);
 report.structure=await page.evaluate(async()=>{
  const s=window.__island.scene,{terrainGeometry,mainCoast,coastDistance}=await import('/src/terrain/terrain.ts'),{TerrainSurface}=await import('/src/environment/surface.ts'),{roadDistance}=await import('/src/environment/paths.ts');
  const expected=terrainGeometry(s.project.terrain,!!s.project.environment),actual=s.terrain.geometry,surface=new TerrainSurface(actual),roots=s.environment.userData.pilotRoots;
  const unchanged=['position','normal','color'].every(k=>{const a=actual.getAttribute(k).array,b=expected.getAttribute(k).array;return a.length===b.length&&a.every((v,i)=>v===b[i]);})&&actual.index.array.every((v,i)=>v===expected.index.array[i]);expected.dispose();
  const grass=s.environment.getObjectByName('近景小草簇'),cliff=s.environment.getObjectByName('固定崖顶下方的连续凹凸岩面'),steps=s.environment.getObjectByName('坡道完整石踏步');
  let badValues=0;s.environment.traverse(n=>{if(!n.isMesh)return;for(const a of Object.values(n.geometry.attributes))for(const v of a.array)if(!Number.isFinite(v))badValues++;});
  const uniforms=s.water.material.uniforms,center=uniforms.sampleCenter.value,extent=uniforms.sampleExtent.value,coasts=[mainCoast(s.project.terrain),s.project.terrain.islet];
  const waterBoundsCoverIsland=coasts.flat().every(([x,z])=>Math.abs(x-center.x)<extent*.5&&Math.abs(z-center.y)<extent*.5);
  const data=uniforms.depthMap.value.image,waterErrors=[];
  // Probe every water cell near a coast; quantization and cell size are intentionally coarse.
  for(let z=0;z<data.height;z+=7)for(let x=0;x<data.width;x+=7){const wx=center.x+((x+.5)/data.width-.5)*extent,wz=center.y+((z+.5)/data.height-.5)*extent,value=data.data[(z*data.width+x)*4]/255*64;if(value>0&&value<40)waterErrors.push(Math.abs(value-coastDistance(s.project.terrain,[wx,wz])));}
  const out={terrainGeometryUnchanged:unchanged,trees:s.environment.userData.pilotMetrics,maxRootHeightError:Math.max(...roots.map(([x,y,z])=>Math.abs(y-surface.height(x,z)))),minTreeSpacing:Math.min(...roots.flatMap((a,i)=>roots.slice(i+1).map(b=>Math.hypot(a[0]-b[0],a[2]-b[2])))),minRoadClearance:Math.min(...roots.map(([x,,z])=>roadDistance(s.environment.userData.routes,x,z))),badValues,grassInstances:grass.children.reduce((n,c)=>n+(c.count||0),0),cliffVertices:cliff.geometry.getAttribute('position').count,talus:s.environment.getObjectByName('样板自然岩岸与坡脚碎石').userData.metrics.talus,stairs:steps.userData.stepCount,decorativeStepsNoCollision:steps.userData.noCollision,waterBoundsCoverIsland,waterMapSize:[data.width,data.height],maxWaterDistanceQuantizationError:Math.max(...waterErrors)};
  return out;
 });
 assert(report.structure.terrainGeometryUnchanged);assert.equal(report.structure.maxRootHeightError,0);assert(report.structure.minTreeSpacing>=3.8);assert(report.structure.minRoadClearance>=4.5);assert.equal(report.structure.badValues,0);assert(report.structure.waterBoundsCoverIsland);assert(report.structure.maxWaterDistanceQuantizationError<.14);assert(report.structure.decorativeStepsNoCollision);assert(report.structure.stairs>0);for(const kind of ['tall','broad','lean','palm','screwPine'])assert(report.structure.trees[kind]>0,`Missing ${kind}`);
 await page.evaluate(v=>window.__island.scene.restoreView(v),views.find(v=>v.id==='forest'));await page.waitForLoadState('networkidle');await page.waitForTimeout(500);
 report.nearby=await page.evaluate(()=>{const s=window.__island.scene;return {grass:s.environment.getObjectByName('近景小草簇').visible,refined:[...s.objectNodes.values()].filter(n=>n.userData.modelVariant==='refined').length};});assert(report.nearby.grass&&report.nearby.refined>0);
 await page.getByRole('checkbox',{name:'水面微动'}).check();await page.waitForTimeout(500);const start=await page.evaluate(()=>({frames:window.__island.scene.scheduler.frames,shadows:window.__island.scene.lighting.shadowUpdates}));await page.waitForTimeout(1000);
 report.water=await page.evaluate(start=>{const s=window.__island.scene;return {running:s.water.running,framesInOneSecond:s.scheduler.frames-start.frames,shadowUpdates:s.lighting.shadowUpdates-start.shadows};},start);assert(report.water.running&&report.water.framesInOneSecond>0&&report.water.framesInOneSecond<=23);assert.equal(report.water.shadowUpdates,0);
 await page.getByRole('checkbox',{name:'水面微动'}).uncheck();await page.waitForTimeout(150);const idle=await page.evaluate(()=>window.__island.scene.scheduler.frames);await page.waitForTimeout(1000);report.staticIdleFrames=await page.evaluate(n=>window.__island.scene.scheduler.frames-n,idle);assert.equal(report.staticIdleFrames,0);
 await page.evaluate(()=>{const s=window.__island.scene;s.camera.position.x+=.1;s.controls.update();});await page.waitForTimeout(150);report.cameraShadowUpdates=await page.evaluate(n=>window.__island.scene.lighting.shadowUpdates-n,start.shadows);assert.equal(report.cameraShadowUpdates,0);
 await page.getByRole('button',{name:'展示模式',exact:true}).click();await page.locator('main').getByLabel('选择漫游地点').selectOption('shrine_group');await page.getByRole('button',{name:'漫游神社建筑群',exact:true}).click();await page.waitForFunction(()=>window.__compound,{timeout:60000});await page.waitForTimeout(1200);
 report.compound=await page.evaluate(()=>{const c=window.__compound,bell=c.interactions.entries.find(e=>e.spec.id==='bell');if(bell)c.interactions.trigger(bell.key);return {locations:c.locations.length,collisionBoxes:c.world.boxes.length,bellParts:bell?.parts.length||0,animated:c.interactions.animating};});assert(report.compound.locations>0&&report.compound.collisionBoxes>0&&report.compound.bellParts>0&&report.compound.animated);await page.waitForTimeout(1800);await page.evaluate(()=>document.exitPointerLock());await page.getByRole('button',{name:'返回沙盘',exact:true}).click();
 await page.evaluate(()=>window.__island.scene.preset('all'));await page.waitForLoadState('networkidle');await page.waitForTimeout(300);const overviewStart=await page.evaluate(()=>window.__island.scene.scheduler.frames);await page.waitForTimeout(1000);report.returnOverview=await page.evaluate(n=>{const s=window.__island.scene;return {idleFrames:s.scheduler.frames-n,grass:s.environment.getObjectByName('近景小草簇').visible,refined:[...s.objectNodes.values()].filter(n=>n.userData.modelVariant==='refined').length};},overviewStart);assert.deepEqual(report.returnOverview,{idleFrames:0,grass:false,refined:0});
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.warnings,[]);assert.deepEqual(report.failed,[]);
}finally{await writeFile(`${dir}/checks.json`,JSON.stringify(report,null,2));await browser.close();}
console.log(JSON.stringify(report,null,2));
