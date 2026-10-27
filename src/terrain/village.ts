import type {Terrain} from '../data/model.ts';
const smooth=(v:number)=>{const u=Math.max(0,Math.min(1,v));return u*u*(3-2*u);};
export function villageHeight(t:Terrain,x:number,z:number,base:number){
 const v=t.village;if(!v)return base;
 const dx=Math.max(0,Math.abs(x-v.center[0])-v.halfSize[0]),dz=Math.max(0,Math.abs(z-v.center[1])-v.halfSize[1]);
 let w=1-smooth(Math.hypot(dx,dz)/14);
 for(const pad of t.pads||[]){if(pad.ownerId==='layout_shopping'||pad.ownerId==='scenic_academy')continue;const distance=Math.hypot(Math.max(pad.minX-x,0,x-pad.maxX),Math.max(pad.minZ-z,0,z-pad.maxZ));w*=smooth(distance/8);}
 return base*(1-w)+v.level*w;
}
export function villageCuts(t:Terrain){const v=t.village;return v?[[0,v.center[0]-v.halfSize[0]],[0,v.center[0]+v.halfSize[0]],[1,v.center[1]-v.halfSize[1]],[1,v.center[1]+v.halfSize[1]]]:[];}
