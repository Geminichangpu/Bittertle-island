import type {Terrain} from '../data/model.ts';
const smooth=(u:number)=>{u=Math.max(0,Math.min(1,u));return u*u*(3-2*u);};
export function scenicCoastHeight(t:Terrain,x:number,z:number,base:number){
 const s=t.scenicCoast;if(!s)return base;
 const dx=x-s.center[0],dz=z-s.center[1];
 // Feather the outside of one connected highland, not two isolated scenic pads.
 const west=smooth((dx+70)/20),north=smooth((dz+48)/18),south=1-smooth((dz-70)/24);
 const weight=west*north*south;
 let height=base*(1-weight)+s.level*weight;
 const r=Math.hypot(x-s.sakura[0],z-s.sakura[1]),w=1-smooth((r-9)/10);
 height=height*(1-w)+(s.sakuraLevel+.75*Math.max(0,1-r/9)**2)*w;
 return height;
}
export function scenicCoastEdge(t:Terrain,x:number,z:number){const s=t.scenicCoast;return !!s&&x>=s.center[0]-14.01&&z>=s.center[1]-27.01&&z<=s.center[1]+31.51;}
// A wider continuous hill connects the shrine to the cliff, including its coastal
// shoulder. Coast vertices must not be forced back down to the old beach height.
export function scenicHighland(t:Terrain,x:number,z:number){const s=t.scenicCoast;return !!s&&x>=s.center[0]-70&&z>=s.center[1]-48&&z<=s.center[1]+94;}
export function scenicRoadFree(t:Terrain,x:number,z:number){const s=t.scenicCoast;return !!s&&x>=s.sakura[0]-16&&z>=s.center[1]-38&&z<=s.center[1]+34;}
export function scenicCoastCuts(t:Terrain){const s=t.scenicCoast;if(!s)return [];return [[0,s.center[0]-70],[0,s.center[0]-50],[0,s.center[0]-24],[1,s.center[1]-30],[1,s.center[1]+34],[1,s.center[1]+70],[1,s.center[1]+94]];}
