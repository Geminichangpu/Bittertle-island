import type {Project,IslandObject,Point} from './model.ts';
import {COAST_EDGE} from './scenic-site.ts';

/** Reposition whole sites once, including their bearing surfaces and saved labels. */
function repositionSites(p:Project){
 if(p.settlementPlacementRevision===1)return p;
 const base=p.groups?.find(g=>g.id==='base_group'),academy=p.objects.find(o=>o.id==='scenic_academy');
 if(!base||!academy)return p;
 const south=8,east=12,north=-32;
 const academyRise=(p.terrain.scenicCoast?.level??academy.position[1])-academy.position[1];
 base.position[2]+=south;
 academy.position[0]+=east;academy.position[1]+=academyRise;academy.position[2]+=north;
 const baseMembers=new Set(p.objects.filter(o=>o.parentId===base.id).map(o=>o.id));
 for(const pad of p.terrain.pads||[]){
  if(baseMembers.has(pad.ownerId)){pad.minZ+=south;pad.maxZ+=south;}
  if(pad.ownerId===academy.id){pad.minX+=east;pad.maxX+=east;pad.minZ+=north;pad.maxZ+=north;pad.level=academy.position[1];}
 }
 const grade=p.terrain.grading;if(grade){grade.base[1]+=south;grade.baseRect[2]+=south;grade.baseRect[3]+=south;}
 for(const m of p.markers){
  if(m.parentId===base.id)continue;
  if(m.followId===base.id||baseMembers.has(m.followId||''))m.position[2]+=south;
  if(m.followId===academy.id)m.position=[...academy.position];
 }
 for(const v of p.cameraPresets){
  if(v.id==='view_base'){v.position[2]+=south;v.target[2]+=south;}
  if(v.id==='view_scenic_academy'){v.position[0]+=east;v.position[1]+=academyRise;v.position[2]+=north;v.target[0]+=east;v.target[1]+=academyRise;v.target[2]+=north;}
 }
 p.settlementPlacementRevision=1;return p;
}

/** One-time requested extensions; other authored buildings retain their transforms. */
export function upgradeSettlement(p:Project):Project{
 if(p.expansionRevision===1)return repositionSites(p);
 const shop=p.objects.find(o=>o.id==='layout_shopping'),base=p.groups?.find(g=>g.id==='base_group'),shrine=p.groups?.find(g=>g.id==='shrine_group'),market=p.objects.find(o=>o.id==='layout_market');
 if(!shop||!base||!shrine||!market)return p;
 const coast=p.terrain.scenicCoast,cliff=p.objects.find(o=>o.id==='scenic_cliff');
 if(coast&&cliff){
  const old=[...coast.center] as Point;
  for(const q of p.terrain.outer)if(COAST_EDGE.some(v=>Math.hypot(q[0]-old[0]-v[0],q[1]-old[1]-v[1])<.02))q[1]+=8;
  coast.center[1]+=8;cliff.position[2]+=8;coast.revision=3;
  for(const m of p.markers)if(m.followId===cliff.id)m.position[2]+=8;
  const view=p.cameraPresets.find(v=>v.id==='view_scenic_coast');if(view){view.position[2]+=8;view.target[2]+=8;}
 }
 p.terrain.village={revision:1,center:[shop.position[0],shop.position[2]],level:shop.position[1],halfSize:[21,25]};
 const academy:IslandObject={id:'scenic_academy',templateId:'scenic_academy',category:'building',name:'研究学堂',position:[shop.position[0]+14,shop.position[1],shop.position[2]-30],rotation:[0,0,0],scale:[.85,.85,.85],snapToGround:false,locked:false,regionId:'village',locationId:'research_academy',params:{width:22,depth:25,wallHeight:11,roofColor:'#444e59',wallColor:'#eee2c7'}};
 const farm:IslandObject={id:'scenic_farm',templateId:'scenic_farm',category:'nature',name:'林间奇幻农田',position:[(base.position[0]+shrine.position[0]+market.position[0])/3,(base.position[1]+shrine.position[1]+market.position[1])/3,(base.position[2]+shrine.position[2]+market.position[2])/3],rotation:[0,0,0],scale:[1,1,1],snapToGround:false,locked:false,regionId:'forest_farm',locationId:'fantasy_farm',params:{width:38,depth:34,wallHeight:8,roofColor:'#507e80',wallColor:'#a88154'}};
 p.terrain.pads=p.terrain.pads||[];
 for(const o of [academy,farm]){
  if(p.objects.some(a=>a.id===o.id))continue;p.objects.push(o);
  const halfX=o.id===farm.id?24:10,halfZ=o.id===farm.id?22:12;
  p.terrain.pads.push({ownerId:o.id,minX:o.position[0]-halfX,maxX:o.position[0]+halfX,minZ:o.position[2]-halfZ,maxZ:o.position[2]+halfZ,level:o.position[1],feather:o.id===farm.id?14:9});
  p.markers.push({id:o.id+'_marker',followId:o.id,name:o.name,locationId:o.locationId+'_view',regionId:o.regionId,visible:true,position:[...o.position],description:o.id===farm.id?'森林环绕的种植空地，药草、晶簇作物和奇幻瓜果生长在田畦之间。':'灰瓦木楼与围墙门楼组成的研学院落，目前开放外景观察。'});
 }
 p.expansionRevision=1;return repositionSites(p);
}
