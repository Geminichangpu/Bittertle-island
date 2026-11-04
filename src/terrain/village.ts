import type {Terrain} from '../data/model.ts';
const smooth=(v:number)=>{const u=Math.max(0,Math.min(1,v));return u*u*(3-2*u);};
export function villageHeight(t:Terrain,x:number,z:number,base:number,shoreDistance:number,includeBay=true){
 const v=t.village;if(!v)return base;
 const dx=Math.max(0,Math.abs(x-v.center[0])-v.halfSize[0]),dz=Math.max(0,Math.abs(z-v.center[1])-v.halfSize[1]);
 let w=1-smooth(Math.hypot(dx,dz)/14);
 for(const pad of t.pads||[]){if(pad.ownerId==='layout_shopping'||pad.ownerId==='scenic_academy')continue;const distance=Math.hypot(Math.max(pad.minX-x,0,x-pad.maxX),Math.max(pad.minZ-z,0,z-pad.maxZ));w*=smooth(distance/8);}
 let result=base*(1-w)+v.level*w;
 // Continue the market's existing level into a modest apron around its footprint.
 // Adjacent building pads retain their own elevations and a soft transition.
 const market=t.pads?.find(p=>p.ownerId==='layout_market');
 if(market){
  const mx=Math.max(market.minX-5-x,0,x-market.maxX-5),mz=Math.max(market.minZ-5-z,0,z-market.maxZ-5);
  let mw=1-smooth(Math.hypot(mx,mz)/10);
  for(const pad of t.pads||[]){if(pad===market)continue;const d=Math.hypot(Math.max(pad.minX-x,0,x-pad.maxX),Math.max(pad.minZ-z,0,z-pad.maxZ));mw*=smooth(d/8);}
  result=result*(1-mw)+market.level*mw;
  // Blend the inhabited side of the bay from the bridge landing to the market.
  // Keep the natural water edge and adjacent buildings' independent pads intact.
  const bridge=t.pads?.find(p=>p.ownerId==='island_bridge:east');
  if(bridge&&includeBay){
   const ax=(bridge.minX+bridge.maxX)/2,az=(bridge.minZ+bridge.maxZ)/2,bx=(market.minX+market.maxX)/2,bz=(market.minZ+market.maxZ)/2;
   const dx=bx-ax,dz=bz-az,len2=dx*dx+dz*dz,u=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/(len2||1)));
   const d=Math.hypot(x-(ax+u*dx),z-(az+u*dz));
   if(d<25){
    let bay=(1-smooth((d-12)/13))*smooth((shoreDistance-1.5)/6);
    for(const pad of t.pads||[]){if(pad===market||pad===bridge)continue;const pd=Math.hypot(Math.max(pad.minX-x,0,x-pad.maxX),Math.max(pad.minZ-z,0,z-pad.maxZ));bay*=smooth(pd/10);if(bay<.0001)break;}
    const level=bridge.level*(1-u)+market.level*u;
    result=result*(1-bay*.88)+level*bay*.88;
   }
  }
 }
 return result;
}
export function villageCuts(t:Terrain){const v=t.village,market=t.pads?.find(p=>p.ownerId==='layout_market');return [...(v?[[0,v.center[0]-v.halfSize[0]],[0,v.center[0]+v.halfSize[0]],[1,v.center[1]-v.halfSize[1]],[1,v.center[1]+v.halfSize[1]]]:[]),...(market?[[0,market.minX-5],[0,market.maxX+5],[1,market.minZ-5],[1,market.maxZ+5]]:[])];}
