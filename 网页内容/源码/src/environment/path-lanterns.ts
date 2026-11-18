import * as T from 'three';
import type {Builder} from '../generators/shrine';
import {blocked,roadDistance,type Obstacle,type Route} from './paths';
import type {TerrainSurface} from './surface';
import type {Terrain} from '../data/model';
import {isLand} from '../terrain/terrain';

export function pathLantern(b:Builder,x:number,y:number,z:number,h:number){
 const iron='#455b58',brass='#ac9264';
 b.scoped([x,y,z],0,()=>{
  b.cylinder([0,0,0],[0,.14,0],.216,'#a1a292',12);
  b.cylinder([0,.14,0],[0,.28,0],.136,iron,12);
  b.cylinder([0,.27,0],[0,h-.62,0],.073,iron,12);
  b.cylinder([0,h-.74,0],[0,h-.68,0],.10,brass,12);
  b.emit('lane:lantern-cup',()=>new T.CylinderGeometry(.253,.085,.145,8),iron,[0,h-.58,0]);
  b.litBox([0,h-.325,0],[.284,.39,.284],h>3?'#ffe0a2':'#f6ddac','lamp');
  for(const dx of [-.16,.16])for(const dz of [-.16,.16])b.beam([dx,h-.52,dz],[dx*1.12,h-.11,dz*1.12],.030,iron);
  b.emit('lane:lantern-cap',()=>new T.ConeGeometry(.36,.21,4).rotateY(Math.PI/4),iron,[0,h-.03,0]);
  for(const side of [-1,1])for(const end of [-1,1]){
   b.cylinder([side*.117,.13,end*.117],[side*.117,.161,end*.117],.025,'#787666',6);
   b.beam([side*.16,h-.505,end*.16],[side*.167,h-.40,end*.166],.043,brass);
  }
  for(const y of [h-.49,h-.136])for(const side of [-1,1]){
   b.beam([-.174,y,side*.17],[.174,y,side*.17],.023,iron);
   b.beam([side*.17,y,-.174],[side*.17,y,.174],.023,iron);
  }
  b.emit('lane:vent-band',()=>new T.CylinderGeometry(.108,.144,.078,16),iron,[0,h+.057,0]);
  b.cylinder([0,h+.06,0],[0,h+.16,0],.039,brass);
 });
}

export function addRoadLanterns(b:Builder,routes:Route[],surface:TerrainSurface,obstacles:Obstacle[],terrain:Terrain){
 const locations:T.Vector2[]=[];
 for(const r of routes){
  if(r.status!=='connected'||!['west-market','market-shopping-coast','market-base','shopping-library','library-lighthouse'].includes(r.id))continue;
  const spacing=34;
  let distance=spacing/2,side=1;
  for(let i=1;i+1<r.points.length;i++){
   const a=r.points[i-1],q=r.points[i],dx=q[0]-a[0],dz=q[1]-a[1],length=Math.hypot(dx,dz);
   distance+=length;if(distance<spacing||length<.01)continue;
   // roadDistance already measures signed clearance from the edge of the nearest road.
   const offset=r.width/2+1,roadY=surface.height(...q);
   for(const shoulder of [side,-side]){
    const x=q[0]-shoulder*dz/length*offset,z=q[1]+shoulder*dx/length*offset;
    const y=surface.height(x,z);
    if(y===undefined||roadY===undefined||Math.abs(y-roadY)>1.25||!isLand(terrain,x,z)||blocked(obstacles,x,z,.7))continue;
    if(locations.some(p=>Math.hypot(p.x-x,p.y-z)<25)||roadDistance(routes,x,z)<.35)continue;
    pathLantern(b,x,y,z,3.6);locations.push(new T.Vector2(x,z));distance=0;side=-shoulder;break;
   }
  }
 }
}
