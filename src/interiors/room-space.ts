import type {InteriorRoom,V} from './room-kit';

/** Interior-only roomy proportions; exterior object transforms are never touched. */
export function expandRoomSpace(room:InteriorRoom,id:string,floor:string){
 const factor=id==='base_office'||id==='base_bedroom'?1.25:id==='landmark_liuli'&&floor!=='lobby'?1.15:1;
 room.root.userData.walkUnit=Math.min(...room.root.scale.toArray().map(Math.abs));
 if(factor===1)return;
 room.root.scale.x*=factor;room.root.scale.z*=factor;
 room.dimensions.w*=factor;room.dimensions.d*=factor;
 const widen=(p:V):V=>[p[0]*factor,p[1],p[2]*factor];
 if(room.views)for(const view of room.views){view.position=widen(view.position);view.target=widen(view.target);}
 room.root.userData.interiorWidthFactor=factor;
}
