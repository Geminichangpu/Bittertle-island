import type {Project} from './model.ts';
import {isLand,coastDistance,sampleHeight} from '../terrain/terrain.ts';
import {objectWorldBounds} from '../terrain/placement.ts';
import {planPaths,roadDistance} from '../environment/paths.ts';

/** Move only the automatically placed stops; respect any user-edited positions. */
export function adjustRoadsideStops(p:Project):Project{
 if(p.terrain.roadsideStopRevision===2||p.islandTownRevision!==3)return p;
 const sites=[
  {id:'layout_island_stop_feihua',old:p.terrain.roadsideStopRevision===1?[-67,76]:[-78.7938,71.9220],at:[-53,77],facing:[-53,70],route:'west-market'},
  {id:'layout_island_stop_library',old:p.terrain.roadsideStopRevision===1?[74,-46]:[59.9037,-78.9491],at:[60,-56],facing:[60,-60],route:'shopping-library'},
  {id:'layout_island_stop_beach',old:[46.1476,-102.0967],at:[39,-93],facing:[46,-93]},
 ];
 const routes=planPaths(p);let complete=true;
 for(const s of sites){const o=p.objects.find(q=>q.id===s.id);if(!o||Math.hypot(o.position[0]-s.old[0],o.position[2]-s.old[1])>1)continue;
  const oldPad=p.terrain.pads?.find(q=>q.ownerId===o.id);if(oldPad)p.terrain.pads=p.terrain.pads!.filter(q=>q!==oldPad);
  const candidates:{x:number;z:number;score:number}[]=[];for(let dx=-12;dx<=12;dx+=2)for(let dz=-12;dz<=12;dz+=2)candidates.push({x:s.at[0]+dx,z:s.at[1]+dz,score:dx*dx+dz*dz});candidates.sort((a,b)=>a.score-b.score);let moved=false;
  const compact=s.id==='layout_island_stop_library',half=compact?2.2:3;
  for(const {x,z} of candidates){const corners=[[-half,-half],[-half,half],[half,-half],[half,half],[0,0]].map(([dx,dz])=>[x+dx,z+dz] as [number,number]);if(corners.some(q=>!isLand(p.terrain,...q)||coastDistance(p.terrain,q)<1.5))continue;
   const route=s.route&&routes.find(r=>r.id===s.route&&r.status==='connected'&&r.points.length>0),d=route?roadDistance([route],x,z):5;if((s.route&&!route)||d<(compact?1.5:3.2)||d>(compact?5:10))continue;
   const heights=corners.map(q=>sampleHeight(p.terrain,...q)),y=heights[4];let front=s.facing;if(route){front=route.points.reduce((a,b)=>Math.hypot(b[0]-x,b[1]-z)<Math.hypot(a[0]-x,a[1]-z)?b:a,route.points[0]);}
   const candidate={...o,scale:(compact?o.scale.map(v=>v*.72):o.scale) as [number,number,number],position:[x,y,z] as [number,number,number],rotation:[0,Math.atan2(front[0]-x,front[1]-z),0] as [number,number,number]};const box=objectWorldBounds(p,candidate).expandByScalar(.2);
   if(p.objects.some(q=>q!==o&&objectWorldBounds(p,q).intersectsBox(box))||Math.max(...heights)-Math.min(...heights)>(s.id==='layout_island_stop_library'?2.5:1.2))continue;
   o.position=candidate.position;o.rotation=candidate.rotation;o.scale=candidate.scale;(p.terrain.pads||=[]).push({ownerId:o.id,minX:x-half,maxX:x+half,minZ:z-half,maxZ:z+half,level:y,feather:4});moved=true;break;
  }
  if(!moved){if(oldPad)p.terrain.pads!.push(oldPad);complete=false;console.warn('Roadside stop blocked:',s.id);}
 }
 if(complete)p.terrain.roadsideStopRevision=2;return p;
}
