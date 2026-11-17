import * as T from 'three';
import type {Project,IslandObject} from './model.ts';
import {objectWorldBounds} from '../terrain/placement.ts';
import {isLand,coastDistance,sampleHeight} from '../terrain/terrain.ts';
import {planPaths,omitShrineBackRoad,roadDistance,type Route} from '../environment/paths.ts';

/** Four small editable roadside shelters; preserve the rest of the saved scene. */
export function upgradeBusStops(p:Project):Project{
 if(p.islandTownRevision===3)return p;
 const library=p.objects.find(o=>o.id==='landmark_library'),market=p.objects.find(o=>o.id==='layout_market'),feihua=p.groups?.find(g=>g.id==='feihua_group');if(!library||!market||!feihua)return p;
 const old=p.objects.find(o=>o.id==='layout_island_station'),oldPad=p.terrain.pads?.find(q=>q.ownerId==='layout_island_station');
 p.objects=p.objects.filter(o=>o!==old);p.terrain.pads=(p.terrain.pads||[]).filter(q=>q.ownerId!=='layout_island_station');
 const routes=omitShrineBackRoad(p,planPaths(p)).filter(r=>r.status==='connected'&&!r.id.startsWith('town-path-'));
 const obstacles=p.objects.map(o=>objectWorldBounds(p,o));
 const specs:{id:string;name:string;target:[number,number];routes:string[];max:number}[]=[
  {id:'layout_island_station',name:'市集口公交站',target:[market.position[0],market.position[2]],routes:['west-market','market-shopping-coast'],max:40},
  {id:'layout_island_stop_feihua',name:'绯华楼山下公交站',target:[feihua.position[0],feihua.position[2]],routes:['west-market'],max:48},
  {id:'layout_island_stop_library',name:'图书馆公交站',target:[library.position[0],library.position[2]],routes:['shopping-library','library-lighthouse'],max:35},
  {id:'layout_island_stop_beach',name:'沙滩公交站',target:[library.position[0],library.position[2]-33],routes:['library-lighthouse','shopping-library'],max:52}
 ];
 let placed=0;
 for(const spec of specs){if(p.objects.some(o=>o.id===spec.id)){placed++;continue;}
  const candidates:{x:number;z:number;angle:number;score:number;route:Route}[]=[];
  for(const route of routes.filter(r=>spec.routes.includes(r.id)))for(let i=4;i<route.points.length-4;i+=12){const a=route.points[i-3],q=route.points[i],c=route.points[i+3],dx=c[0]-a[0],dz=c[1]-a[1],length=Math.hypot(dx,dz);if(!length)continue;
   for(const side of [-1,1])for(const offset of [6.3,7.5,9,12,16]){const x=q[0]-dz/length*offset*side,z=q[1]+dx/length*offset*side,dist=Math.hypot(x-spec.target[0],z-spec.target[1]);if(dist>spec.max||routes.some(r=>Math.hypot(x-r.points[0][0],z-r.points[0][1])<11||Math.hypot(x-r.points[r.points.length-1][0],z-r.points[r.points.length-1][1])<11)||roadDistance(routes,x,z)<4.4)continue;const angle=Math.atan2(q[0]-x,q[1]-z),score=dist+offset*.1;candidates.push({x,z,angle,score,route});}
  }
  // The beach lies north of the current highway; offer a shelter behind the sand and join it by a short path.
  if(spec.id==='layout_island_stop_beach')for(let x=spec.target[0]-24;x<=spec.target[0]+24;x+=4)for(let z=spec.target[1]-8;z<=spec.target[1]+16;z+=4){
   if(!isLand(p.terrain,x,z)||coastDistance(p.terrain,[x,z])<14)continue;let closest:{route:Route;point:[number,number];distance:number}|undefined;
   for(const route of routes.filter(r=>spec.routes.includes(r.id)))for(let i=0;i<route.points.length;i+=12){const point=route.points[i],distance=Math.hypot(point[0]-x,point[1]-z);if(!closest||distance<closest.distance)closest={route,point,distance};}
   if(!closest||closest.distance>38||closest.distance<5)continue;candidates.push({x,z,angle:Math.atan2(closest.point[0]-x,closest.point[1]-z),score:Math.hypot(x-spec.target[0],z-spec.target[1])+closest.distance*.12,route:closest.route});
  }
  candidates.sort((a,b)=>a.score-b.score);let inserted=false;
  for(const q of candidates){const corners=[[-3,-3],[-3,3],[3,-3],[3,3],[0,0]].map(([dx,dz])=>[q.x+dx,q.z+dz] as [number,number]);if(corners.some(([x,z])=>!isLand(p.terrain,x,z)||coastDistance(p.terrain,[x,z])<2))continue;
   const heights=corners.map(([x,z])=>sampleHeight(p.terrain,x,z));if(heights[4]>10||Math.max(...heights)-Math.min(...heights)>1.2)continue;
   const o:IslandObject=spec.id==='layout_island_station'&&old?{...old,position:[q.x,heights[4],q.z],rotation:[0,q.angle,0],name:spec.name}:{id:spec.id,templateId:'layout_island_station',category:'building',name:spec.name,position:[q.x,heights[4],q.z],rotation:[0,q.angle,0],scale:[1,1,1],snapToGround:false,locked:false,regionId:'village',locationId:spec.id,params:{width:6,depth:4,wallHeight:4,roofColor:'#bd684b',wallColor:'#eee5ce'}};
   const box=objectWorldBounds(p,o).expandByScalar(.5);if(obstacles.some(b=>b.intersectsBox(box)))continue;
   p.objects.push(o);obstacles.push(box);p.terrain.pads!.push({ownerId:o.id,minX:q.x-3,maxX:q.x+3,minZ:q.z-3,maxZ:q.z+3,level:heights[4],feather:4});placed++;inserted=true;break;
  }
  if(!inserted&&spec.id==='layout_island_station'&&old){p.objects.push(old);if(oldPad)p.terrain.pads!.push(oldPad);}
 }
 if(placed===4)p.islandTownRevision=3;
 else console.warn('Some requested bus stops could not be placed safely',placed);
 return p;
}
