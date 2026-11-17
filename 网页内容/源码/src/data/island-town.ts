import {upgradeBayGroups} from './bay-groups.ts';
import {upgradeBusStops} from './bus-stops.ts';
import {adjustRoadsideStops} from './station-adjustment.ts';
import {adjustFarmAndAcademy} from './farm-academy-adjustment.ts';
import {flattenBay} from './bay-flatten.ts';
import * as T from 'three';
import type {Project,IslandObject} from './model.ts';
import {isLand,coastDistance,sampleHeight,mainCoast} from '../terrain/terrain.ts';
import {objectWorldBounds,transformMatrix} from '../terrain/placement.ts';
import {planPaths,roadDistance} from '../environment/paths.ts';

/** Enable the current island's reversible, derived settlement-side terrain finish. */
function finishSettlementGrade(p:Project){if(p.terrain.village&&p.terrain.grading&&p.terrain.scenicCoast)p.terrain.settlementGradeRevision=1;const cave=p.objects.find(o=>o.id==='layout_island_cave');if(cave&&Math.abs(cave.rotation[1]-Math.PI)<.001)cave.rotation[1]=-Math.PI/2;return flattenBay(adjustFarmAndAcademy(adjustRoadsideStops(p)));}
/** Add new editable locations once, respecting the saved layout and existing site bounds. */
export function upgradeIslandTown(p:Project):Project{
 if(p.islandTownRevision===3)return finishSettlementGrade(p);
 if(p.islandTownRevision===2)return finishSettlementGrade(upgradeBusStops(upgradeBayGroups(p)));
 const shop=p.objects.find(o=>o.id==='layout_shopping'),market=p.objects.find(o=>o.id==='layout_market');if(!shop||!market)return p;
 const previous=p.islandTownRevision===1;
 // Move only our unedited v1 placements; user-moved houses keep their transforms.
 const originals:Record<string,[number,number,number,number]>={'layout_island_house_1':[82.96457339398363,-57.6312729643087,2.1,-.4254496373700421],'layout_island_house_2':[88.74279867351372,-70.3832184087889,2.1478107156468034,-.4254496373700421],'layout_island_house_3':[76.32309667373355,-72.42491164766193,2.1,-.4964227534048819],'layout_island_house_7':[59.734300618192094,100.96833689173694,2.123193317273655,-3.1169537516298482],'layout_island_house_8':[-17.289693442797564,96.76119434222076,2.1,3.0481158724312003]};
 const replaceable=p.objects.filter(o=>{const q=originals[o.id];return !!q&&Math.hypot(o.position[0]-q[0],o.position[2]-q[1])<.05&&Math.abs(o.position[1]-q[2])<.05&&Math.abs(o.rotation[1]-q[3])<.001&&Math.abs(o.rotation[0])+Math.abs(o.rotation[2])<.001&&o.scale.every(v=>Math.abs(v-1)<.001)&&o.params.width===9&&o.params.depth===8&&o.params.wallHeight===3.4;});
 const replaceIds=new Set(replaceable.map(o=>o.id)),oldPads=(p.terrain.pads||[]).filter(q=>replaceIds.has(q.ownerId));
 if(previous){p.objects=p.objects.filter(o=>!replaceIds.has(o.id));p.terrain.pads=(p.terrain.pads||[]).filter(q=>!replaceIds.has(q.ownerId));}
 // The existing academy is moved only from the known original pose; preserve user edits.
 const academy=p.objects.find(o=>o.id==='scenic_academy');
 if(academy&&Math.hypot(academy.position[0]-(shop.position[0]+26),academy.position[2]-(shop.position[2]-62))<.15&&Math.abs(academy.position[1]-14)<.15){
  const old=[...academy.position],x=shop.position[0]+11,z=shop.position[2]-22,y=sampleHeight(p.terrain,shop.position[0]-3,shop.position[2]+30),candidate={...academy,position:[x,y,z] as [number,number,number]},box=objectWorldBounds(p,candidate);
  const clear=p.objects.filter(o=>o.id!==academy.id&&!o.id.startsWith('layout_island_house_')).every(o=>!objectWorldBounds(p,o).intersectsBox(box));
  if(clear&&[[box.min.x,box.min.z],[box.min.x,box.max.z],[box.max.x,box.min.z],[box.max.x,box.max.z]].every(([a,b])=>isLand(p.terrain,a,b))){
   academy.position=[x,y,z];p.terrain.pads=(p.terrain.pads||[]).filter(q=>q.ownerId!==academy.id);p.terrain.pads.push({ownerId:academy.id,minX:x-10,maxX:x+10,minZ:z-11,maxZ:z+11,level:y,feather:14});
   for(const m of p.markers)if(m.followId===academy.id)m.position=[x,y,z];
   for(const v of p.cameraPresets)if(v.id==='view_scenic_academy'){for(let i=0;i<3;i++){v.position[i]+=academy.position[i]-old[i];v.target[i]+=academy.position[i]-old[i];}}
  }
 }
 // One shared, gently feathered residential terrace avoids separate steep pits around each house.
 const bayPad={ownerId:'island-town:bay',minX:shop.position[0]-8.5,maxX:shop.position[0]+13.5,minZ:shop.position[2]+23,maxZ:shop.position[2]+45,level:sampleHeight(p.terrain,shop.position[0]-3,shop.position[2]+30),feather:8};
 const padCorners=[[bayPad.minX,bayPad.minZ],[bayPad.minX,bayPad.maxZ],[bayPad.maxX,bayPad.minZ],[bayPad.maxX,bayPad.maxZ]];
 const overlaps=(p.terrain.pads||[]).some(q=>q.ownerId!=='island-town:bay'&&q.minX<bayPad.maxX&&q.maxX>bayPad.minX&&q.minZ<bayPad.maxZ&&q.maxZ>bayPad.minZ);
 if(!overlaps&&padCorners.every(([x,z])=>isLand(p.terrain,x,z)&&coastDistance(p.terrain,[x,z])>1)){p.terrain.pads??=[];if(!p.terrain.pads.some(q=>q.ownerId===bayPad.ownerId))p.terrain.pads.push(bayPad);}
 const roads=planPaths(p).filter(r=>r.status==='connected'&&!r.id.startsWith('town-path-'));
 const obstacles=p.objects.map(o=>objectWorldBounds(p,o));
 const shrine=p.groups?.find(g=>g.id==='shrine_group'),inverse=shrine?transformMatrix(shrine).invert():undefined;
 const insideShrine=(x:number,z:number)=>{if(!inverse||!shrine)return false;const v=new T.Vector3(x,shrine.position[1],z).applyMatrix4(inverse);return v.x>-30&&v.x<40&&v.z>-42&&v.z<24;};
 const safe=(x:number,z:number,half:number,coast=4)=>{
  if(insideShrine(x,z))return false;
  const points=[[x,z],[x-half,z-half],[x-half,z+half],[x+half,z-half],[x+half,z+half]];
  if(points.some(([a,b])=>!isLand(p.terrain,a,b)||coastDistance(p.terrain,[a,b])<coast))return false;
  const heights=points.map(([a,b])=>sampleHeight(p.terrain,a,b));if(Math.max(...heights)-Math.min(...heights)>1.0)return false;
  const box=new T.Box3(new T.Vector3(x-half-1,-100,z-half-1),new T.Vector3(x+half+1,100,z+half+1));return !obstacles.some(o=>o.intersectsBox(box));
 };
 const places:{x:number;z:number;rx:number;rz:number;distance:number}[]=[];
 for(const route of roads)for(let i=10;i<route.points.length-10;i+=24){const a=route.points[i-3],q=route.points[i],c=route.points[i+3],dx=c[0]-a[0],dz=c[1]-a[1],len=Math.hypot(dx,dz)||1;for(const side of [-1,1])for(const offset of [9,13,18,23,28]){const x=q[0]-dz/len*offset*side,z=q[1]+dx/len*offset*side;places.push({x,z,rx:q[0],rz:q[1],distance:Math.hypot(x-shop.position[0],z-shop.position[2])});}}
 places.sort((a,b)=>a.distance-b.distance);
 const add=(id:string,templateId:string,name:string,x:number,z:number,w:number,d:number,h:number,angle:number,coast=4)=>{
  if(p.objects.some(o=>o.id===id))return false;const half=Math.max(w,d)*.5;if(!safe(x,z,half,coast))return false;
  const y=sampleHeight(p.terrain,x,z),o:IslandObject={id,templateId,category:'building',name,position:[x,y,z],rotation:[0,angle,0],scale:[1,1,1],snapToGround:false,locked:false,regionId:'village',locationId:id,params:{width:w,depth:d,wallHeight:h,roofColor:'#bd684b',wallColor:'#eee5ce'}};
  p.objects.push(o);const radius=half+.5;obstacles.push(new T.Box3(new T.Vector3(x-radius,-100,z-radius),new T.Vector3(x+radius,100,z+radius)));
  p.terrain.pads??=[];const common=p.terrain.pads.find(q=>q.ownerId==='island-town:bay');if(!(templateId==='layout_island_house'&&common&&x-half>=common.minX&&x+half<=common.maxX&&z-half>=common.minZ&&z+half<=common.maxZ))p.terrain.pads.push({ownerId:id,minX:x-half,maxX:x+half,minZ:z-half,maxZ:z+half,level:y,feather:4});return true;
 };
 const putRoadside=(id:string,t:string,name:string,w:number,d:number,h:number,predicate:(q:typeof places[number])=>boolean)=>{
  for(const q of places){if(!predicate(q))continue;const angle=Math.atan2(q.rx-q.x,q.rz-q.z);if(add(id,t,name,q.x,q.z,w,d,h,angle))return true;}return false;
 };
 // Compact homes belong in the inside of the C-shaped bay, not the woodland by the treehouse.
 const houseIds=previous?replaceable.map(o=>o.id):['layout_island_house_1','layout_island_house_2','layout_island_house_3','layout_island_house_7','layout_island_house_8'];
 const bay:{x:number;z:number;dist:number}[]=[];for(let x=shop.position[0]-15;x<=shop.position[0]+15;x+=3)for(let z=shop.position[2]+15;z<=shop.position[2]+48;z+=3){const d=roadDistance(roads,x,z);if(d>3.1)bay.push({x,z,dist:Math.hypot(x-(shop.position[0]-1),z-(shop.position[2]+29))});}bay.sort((a,b)=>a.dist-b.dist);
 for(const [i,id] of houseIds.entries()){
  let placed=false;if(id==='layout_island_house_8')placed=putRoadside(id,'layout_island_house','海岛民居 '+(i+1),6.2,5.8,3.1,q=>Math.abs(q.x+17)<25&&q.z>76&&q.z<96);if(!placed)for(const q of bay){const terrace=p.terrain.pads?.find(pad=>pad.ownerId==='island-town:bay');if(terrace&&(q.x-3.1<terrace.minX||q.x+3.1>terrace.maxX||q.z-3.1<terrace.minZ||q.z+3.1>terrace.maxZ))continue;if(!safe(q.x,q.z,3.1,2))continue;const nearest=roads.flatMap(r=>r.points.filter((_,n)=>n%10===0)).reduce((best,a)=>Math.hypot(a[0]-q.x,a[1]-q.z)<Math.hypot(best[0]-q.x,best[1]-q.z)?a:best,[shop.position[0],shop.position[2]] as [number,number]);const angle=Math.atan2(nearest[0]-q.x,nearest[1]-q.z);if(add(id,'layout_island_house','海岛民居 '+(i+1),q.x,q.z,6.2,5.8,3.1,angle,2)){placed=true;break;}}
  if(!placed&&previous){const old=replaceable.find(o=>o.id===id);if(old){p.objects.push(old);const pad=oldPads.find(a=>a.ownerId===id);if(pad)p.terrain.pads?.push(pad);}}
 }
 // Add a few extra compact homes only where an empty site is genuinely available.
 for(let i=1;i<=3;i++){const id='layout_island_house_extra_'+i;if(p.objects.some(o=>o.id===id))continue;for(const q of bay){const terrace=p.terrain.pads?.find(pad=>pad.ownerId==='island-town:bay');if(terrace&&(q.x-3.1<terrace.minX||q.x+3.1>terrace.maxX||q.z-3.1<terrace.minZ||q.z+3.1>terrace.maxZ))continue;if(!safe(q.x,q.z,3.1,2))continue;if(add(id,'layout_island_house','海岛民居 '+(5+i),q.x,q.z,6.2,5.8,3.1,0,2))break;}}
 if(!previous){
  if(!putRoadside('layout_island_park','layout_island_park','绿荫儿童公园',13,11,4,q=>q.distance>25&&q.distance<90))putRoadside('layout_island_park','layout_island_park','绿荫儿童公园',13,11,4,q=>q.distance>=90);
  putRoadside('layout_island_station','layout_island_station','海风公交站',6,4,4,q=>q.distance>30&&q.distance<110);
  putRoadside('layout_island_restaurant','layout_island_restaurant','海边餐厅',10,9,4,q=>q.distance>25&&coastDistance(p.terrain,[q.x,q.z])<32);
 }
 // Southern grove, west of the treehouse: a constructed open tunnel with vines.
 if(!previous)for(const [x,z] of [[12,120],[2,120],[22,122],[-8,120],[-18,120],[12,132]])if(add('layout_island_cave','layout_island_cave','藤蔓山洞',x,z,12,10,6,Math.PI,5))break;
 // Place the dock across the shore, rather than putting it wholly on dry land.
 const shore=mainCoast(p.terrain),dockSites:{x:number;z:number;angle:number;score:number}[]=[];
 for(let i=0;i<shore.length;i++){const a=shore[i],c=shore[(i+1)%shore.length],dx=c[0]-a[0],dz=c[1]-a[1],length=Math.hypot(dx,dz);if(!length)continue;
  for(let j=1;j<Math.ceil(length/5);j++){const t=j/Math.ceil(length/5),ex=a[0]+dx*t,ez=a[1]+dz*t;
   for(const side of [-1,1]){const ix=-dz/length*side,iz=dx/length*side,x=ex+ix*3.5,z=ez+iz*3.5;
    if(!isLand(p.terrain,x,z)||!isLand(p.terrain,ex+ix*7,ez+iz*7)||isLand(p.terrain,ex-ix,ez-iz)||insideShrine(x,z))continue;
    if(obstacles.some(b=>x>b.min.x-4&&x<b.max.x+4&&z>b.min.z-4&&z<b.max.z+4))continue;
    const nearest=Math.min(...places.map(q=>Math.hypot(q.rx-x,q.rz-z)));if(nearest>40)continue;
    const preferred=Math.hypot(shop.position[0]-99.3672616,shop.position[2]+12.8527136)<1?Math.hypot(x-5.98,z-66.76):Math.hypot(x-50,z-58);dockSites.push({x,z,angle:Math.atan2(-ix,-iz),score:preferred+nearest*.05});
   }
  }
 }
 dockSites.sort((a,b)=>a.score-b.score);const dock=dockSites[0];if(!previous&&dock){const y=sampleHeight(p.terrain,dock.x,dock.z);p.objects.push({id:'layout_island_pier',templateId:'layout_island_pier',category:'building',name:'海湾小码头',position:[dock.x,y,dock.z],rotation:[0,dock.angle,0],scale:[1,1,1],snapToGround:false,locked:false,regionId:'village',locationId:'layout_island_pier',params:{width:5,depth:12,wallHeight:3,roofColor:'#bd684b',wallColor:'#eee5ce'}});}
 p.islandTownRevision=2;return finishSettlementGrade(upgradeBusStops(upgradeBayGroups(p,true)));
}
