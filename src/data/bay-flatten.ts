import type {Project} from './model';
/** Level the shopping building with the existing low residential terrace. */
export function flattenBay(p:Project){
 if(p.terrain.flatBayRevision===1)return p;
 const shop=p.objects.find(o=>o.id==='layout_shopping'),pad=p.terrain.pads?.find(q=>q.ownerId==='layout_shopping'),bay=p.terrain.pads?.find(q=>q.ownerId==='island-town:bay');
 if(!shop||!pad||!bay||shop.parentId||Math.abs(shop.position[1]-pad.level)>.05)return p;
 const dy=bay.level-shop.position[1];shop.position[1]=bay.level;pad.level=bay.level;pad.feather=Math.max(pad.feather,12);
 for(const m of p.markers)if(m.followId===shop.id)m.position[1]+=dy;
 for(const v of p.cameraPresets)if(v.id==='view_layout_shopping'){v.position[1]+=dy;v.target[1]+=dy;}
 p.terrain.flatBayRevision=1;return p;
}
