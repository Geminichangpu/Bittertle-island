import * as T from 'three';
import type {Builder} from '../generators/shrine';
import {blocked,roadDistance,type Obstacle,type Route} from './paths';
import type {TerrainSurface} from './surface';

export function pathLantern(b:Builder,x:number,y:number,z:number,h:number){
 const iron='#455b58',brass='#ac9264';
 b.scoped([x,y,z],0,()=>{
  b.cylinder([0,0,0],[0,.14,0],.216,'#a1a292',12);
  b.cylinder([0,.14,0],[0,.28,0],.136,iron,12);
  b.cylinder([0,.27,0],[0,h-.62,0],.073,iron,12);
  b.cylinder([0,h-.74,0],[0,h-.68,0],.10,brass,12);
  b.emit('lane:lantern-cup',()=>new T.CylinderGeometry(.253,.085,.145,8),iron,[0,h-.58,0]);
  b.litBox([0,h-.325,0],[.284,.39,.284],'#f6ddac','lamp');
  for(const dx of [-.16,.16])for(const dz of [-.16,.16])b.beam([dx,h-.52,dz],[dx*1.12,h-.11,dz*1.12],.030,iron);
  b.emit('lane:lantern-cap',()=>new T.ConeGeometry(.36,.21,4).rotateY(Math.PI/4),iron,[0,h-.03,0]);
  b.cylinder([0,h+.06,0],[0,h+.16,0],.039,brass);
 });
}

export function addRoadLanterns(b:Builder,routes:Route[],surface:TerrainSurface,obstacles:Obstacle[]){
 const locations:T.Vector2[]=[];
 for(const r of routes){
  if(r.status!=='connected'||!['west-market','market-shopping-coast','market-base','shopping-library','library-lighthouse'].includes(r.id))continue;
  let distance=0,side=1;
  for(let i=1;i+1<r.points.length;i++){
   const a=r.points[i-1],q=r.points[i],dx=q[0]-a[0],dz=q[1]-a[1],length=Math.hypot(dx,dz);
   distance+=length;if(distance<27||length<.01)continue;
   const offset=r.width/2+.98,x=q[0]-side*dz/length*offset,z=q[1]+side*dx/length*offset,y=surface.height(x,z);
   if(y===undefined||blocked(obstacles,x,z,1)||roadDistance(routes,x,z)<r.width*.5+.33||locations.some(p=>p.distanceToSquared(new T.Vector2(x,z))<220))continue;
   pathLantern(b,x,y,z,3.12);locations.push(new T.Vector2(x,z));distance=0;side*=-1;
  }
 }
}
