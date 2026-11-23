import * as T from 'three';
import type {Point,Project} from '../data/model.ts';
import {COAST_PATH,COAST_ROCK} from '../data/scenic-site.ts';
import {coastDistance,inside} from '../terrain/terrain.ts';
import {transformMatrix} from '../terrain/placement.ts';
import {blocked,type Obstacle} from './paths.ts';
import type {TerrainSurface} from './surface.ts';

export type TreeRoot=[number,number,number];
export type TreeClearings={young?:T.Vector3;mature?:T.Vector3;gate?:T.Vector3};
export const YOUNG_CLEAR_RADIUS=12, MATURE_CLEAR_RADIUS=11;

function siteMatrix(p:Project,id:string) {
  const o=p.objects.find(o=>o.id===id);if(!o)return;
  const matrix=transformMatrix(o),group=p.groups?.find(g=>g.id===o.parentId);
  return group?matrix.premultiply(transformMatrix(group)):matrix;
}

export function shrineTreeClearings(p:Project):TreeClearings {
  const torii=siteMatrix(p,'shrine_torii'),cherry=siteMatrix(p,'scenic_sakura');
  const gate=torii?new T.Vector3().setFromMatrixPosition(torii):undefined;
  return {gate,young:gate?.clone().add(new T.Vector3(15,0,12)),mature:cherry?new T.Vector3().setFromMatrixPosition(cherry):undefined};
}

function segmentDistance(x:number,z:number,ax:number,az:number,bx:number,bz:number) {
  const dx=bx-ax,dz=bz-az;
  const u=T.MathUtils.clamp(((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz||1),0,1);
  return Math.hypot(x-ax-u*dx,z-az-u*dz);
}

/** Keep a crown-free ring around both blossoms and an open sightline from the torii. */
export function inCherryClearing(x:number,z:number,canopy:number,sites:TreeClearings,youngRadius=YOUNG_CLEAR_RADIUS) {
  const {young,mature,gate}=sites;
  if(mature&&Math.hypot(x-mature.x,z-mature.z)<MATURE_CLEAR_RADIUS+canopy)return true;
  if(!young)return false;
  if(Math.hypot(x-young.x,z-young.z)<youngRadius+canopy)return true;
  return !!gate&&segmentDistance(x,z,gate.x,gate.z,young.x,young.z)<3.1+canopy;
}

// The inland face and the smaller south-east shoulder of the promontory in the marked view.
// Coordinates follow the authored cliff object's local frame, including in edited projects.
const mainSlope:Point[]=[[-38,-24],[-29,-31],[-14,-30],[-9,-26],[-12,-16],[-12,-6],[-8,1],[-1,10],[1,19],[-1,31],[-18,36],[-31,29],[-38,17],[-40,3],[-41,-10]];
const seasideShoulder:Point[]=[[1,18],[8,12],[16,12],[19,17],[15,26],[8,31],[0,30]];

export function shrineSlopeTrees(p:Project,surface:TerrainSurface,obstacles:Obstacle[],
  road:(x:number,z:number,padding:number)=>boolean,otherTrees:TreeRoot[],random:()=>number) {
  const cliff=siteMatrix(p,'scenic_cliff'),result:TreeRoot[]=[],zones=shrineTreeClearings(p);
  if(!cliff||!p.terrain.scenicCoast)return result;
  const frame=cliff;
  const structures=obstacles.filter(o=>o.id!=='scenic_cliff');
  const trail=COAST_PATH.map(([x,z])=>new T.Vector3(x,0,z).applyMatrix4(cliff));
  if(zones.mature)trail.unshift(zones.mature);
  const seat=new T.Vector3(...COAST_ROCK).applyMatrix4(cliff);trail.push(seat);
  const keep=4.9;
  function patch(poly:Point[],count:number) {
    const xs=poly.map(q=>q[0]),zs=poly.map(q=>q[1]);
    const minX=Math.min(...xs),maxX=Math.max(...xs),minZ=Math.min(...zs),maxZ=Math.max(...zs);
    const start=result.length;
    for(let i=0;i<1250&&result.length-start<count;i++) {
      const lx=minX+(maxX-minX)*random(),lz=minZ+(maxZ-minZ)*random();
      if(!inside([lx,lz],poly))continue;
      const v=new T.Vector3(lx,0,lz).applyMatrix4(frame),x=v.x,z=v.z,y=surface.height(x,z);
      if(y===undefined||coastDistance(p.terrain,[x,z])<keep+1.1||blocked(structures,x,z,keep)||road(x,z,keep))continue;
      if(inCherryClearing(x,z,keep,zones)||Math.hypot(x-seat.x,z-seat.z)<7+keep)continue;
      // From the sitting stone the sea is east. Leave a view cone as well as the rock itself.
      if(lx>=COAST_ROCK[0]&&Math.abs(lz-COAST_ROCK[2])<4.8+.25*(lx-COAST_ROCK[0]))continue;
      if(trail.some((a,i)=>i>0&&segmentDistance(x,z,trail[i-1].x,trail[i-1].z,a.x,a.z)<2.1+keep))continue;
      const dx=(surface.height(x+1,z)??y)-(surface.height(x-1,z)??y);
      const dz=(surface.height(x,z+1)??y)-(surface.height(x,z-1)??y);
      if(Math.hypot(dx,dz)>2.25)continue;
      if(result.some(q=>Math.hypot(q[0]-x,q[2]-z)<5.5)||otherTrees.some(q=>Math.hypot(q[0]-x,q[2]-z)<4.6))continue;
      result.push([x,y,z]);
    }
  }
  patch(mainSlope,36);patch(seasideShoulder,8);
  return result;
}

export function seededLandscapeRandom(seed: number) {
  return () => {
    seed=(seed+0x6d2b79f5)|0;
    let t=Math.imul(seed^(seed>>>15),1|seed);
    t^=t+Math.imul(t^(t>>>7),61|t);
    return ((t^(t>>>14))>>>0)/4294967296;
  };
}
