import type {Project,IslandObject} from './model.ts';
import {isLand,sampleHeight} from '../terrain/terrain.ts';
/** Add one editable coastal estate only when its intended footprint is available. */
export function upgradeNorthEstate(p:Project){
 if(p.northEstateRevision===2)return p;
 const light=p.objects.find(o=>o.id==='layout_lighthouse');if(!light||light.parentId)return p;
 let villa=p.objects.find(o=>o.id==='layout_villa');
 // Preserve an estate a user has deliberately moved, rotated, or scaled.
 if(villa&&(Math.abs(villa.position[0]-(light.position[0]+24))>.01||Math.abs(villa.position[2]-(light.position[2]-8))>.01||villa.rotation.some(v=>Math.abs(v)>.001)||villa.scale.some(v=>Math.abs(v-1)>.001))){p.northEstateRevision=2;return p;}
 if(!villa&&p.northEstateRevision===1){p.northEstateRevision=2;return p;}
 const x=-50,z=-80,w=26,d=24;
 if(![[-w/2,-d/2],[-w/2,d/2],[w/2,-d/2],[w/2,d/2]].every(([dx,dz])=>isLand(p.terrain,x+dx,z+dz)))return p;
 const y=sampleHeight(p.terrain,x,z);
 if(!villa){villa={id:'layout_villa',templateId:'layout_villa',name:'北岸欧式别墅',category:'building',position:[x,y,z],rotation:[0,0,0],scale:[1,1,1],snapToGround:false,locked:false,regionId:'north_coast',locationId:'north_villa',params:{width:w,depth:d,wallHeight:11,wallColor:'#eee7d8',roofColor:'#505a64'}};p.objects.push(villa);}
 else{villa.position=[x,y,z];villa.params={...villa.params,width:w,depth:d,wallHeight:11,roofColor:'#505a64'};}
 p.terrain.pads??=[];const pad=p.terrain.pads.find(q=>q.ownerId===villa!.id);
 const area={ownerId:villa.id,minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2,level:y,feather:14};if(pad)Object.assign(pad,area);else p.terrain.pads.push(area);
 let marker=p.markers.find(m=>m.id==='layout_villa_marker');if(marker)marker.position=[x,y,z];else p.markers.push({id:'layout_villa_marker',followId:villa.id,name:'北岸欧式别墅',locationId:'north_villa_view',regionId:'north_coast',description:'面向沿岸道路的欧式宅邸，带前院与后院。',visible:true,position:[x,y,z]});
 p.northEstateRevision=2;return p;
}
