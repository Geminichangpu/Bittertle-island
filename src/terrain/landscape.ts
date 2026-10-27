import * as T from 'three';
import type {Project} from '../data/model.ts';
import {objectWorldBounds,transformMatrix} from './placement.ts';
import {inside,isLand,sampleHeight} from './terrain.ts';

/** Derive the clearing and uphill direction from the current authored layout. */
export function updateLandscapeGrade(p:Project){
 if(!p.terrain.landscapeRevision)return;
 const base=p.objects.filter(o=>o.templateId.startsWith('base_')),hall=p.objects.find(o=>o.templateId==='shrine_main');
 if(!base.length||!hall){delete p.terrain.grading;return;}
 const box=base.reduce((bb,o)=>bb.union(objectWorldBounds(p,o)),new T.Box3()),c=box.getCenter(new T.Vector3()),h=objectWorldBounds(p,hall).getCenter(new T.Vector3());
 const originY=(o:typeof hall)=>{const m=transformMatrix(o),g=p.groups?.find(g=>g.id===o.parentId);if(g)m.premultiply(transformMatrix(g));return new T.Vector3().applyMatrix4(m).y;};
 p.terrain.grading={base:[c.x,c.z],hill:[h.x,h.z],baseRect:[box.min.x-3,box.max.x+3,box.min.z-2,box.max.z+10],baseLevel:Math.min(...base.map(originY)),hillLevel:originY(hall)};
}

/** Keep a crossing over water; unlike buildings it must not be squeezed onto one shore. */
export function groundBridge(p:Project){
 for(const o of p.objects.filter(o=>o.templateId==='island_bridge')){
  // Search the selected east/west line for both shores, inset enough for the full deck width.
  const z=o.position[2],half=o.params.depth/2+.5;
  const fits=(x:number,islet:boolean)=>[-half,0,half].every(d=>isLand(p.terrain,x,z+d)&&inside([x,z+d],p.terrain.islet)===islet);
  const islandXs=Array.from({length:801},(_,i)=>-200+i*.5).filter(x=>fits(x,true));
  if(!islandXs.length)throw new Error('桥梁需要沿中心小岛与右侧主岛之间布置。');
  const start=islandXs.at(-1)!-3;
  let end=start+8;while(end<195&&!fits(end,false))end+=.5;
  if(end>=195)throw new Error('桥梁右端找不到主岛岸边。');
  end+=3;
  const a=sampleHeight(p.terrain,start,z)+.16,b=sampleHeight(p.terrain,end,z)+.16;
  o.position=[(start+end)/2,a,z];o.rotation=[0,0,0];o.scale=[1,1,1];o.snapToGround=false;
  o.params.width=end-start;o.params.bridgeEndHeight=b-a;
  for(const [side,x,level] of [['west',start,a-.16],['east',end,b-.16]] as const){
   p.terrain.pads!.push({ownerId:o.id+':'+side,minX:x-1.2,maxX:x+1.2,minZ:z-half,maxZ:z+half,level,feather:4});
  }
 }
}

export function addLandscapeRevision(p:Project){
 if(p.terrain.landscapeRevision)return false;
 // Local outward bulge on the southeast arc; preserve the other authored coast points.
 p.terrain.outer=p.terrain.outer.map(([x,z])=>{const f=Math.exp(-((x-118)**2/1100+(z-118)**2/700));return [x+18*f,z+20*f];});
 p.terrain.landscapeRevision=2;
 if(!p.objects.some(o=>o.id==='island_bridge'))p.objects.push({id:'island_bridge',templateId:'island_bridge',name:'中心岛 · 东向木桥',category:'building',position:[60,0,5],rotation:[0,0,0],scale:[1,1,1],snapToGround:false,locked:false,regionId:'bay',locationId:'',params:{width:60,depth:4.8,wallHeight:2,wallColor:'#a58359',roofColor:'#6c553d'}});
 return true;
}
