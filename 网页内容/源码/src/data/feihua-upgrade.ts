import * as T from 'three';
import type {Project,IslandObject,Vec3} from './model.ts';

const matrix=(o:{position:Vec3;rotation:Vec3;scale:Vec3})=>new T.Matrix4().compose(new T.Vector3(...o.position),new T.Quaternion().setFromEuler(new T.Euler(...o.rotation)),new T.Vector3(...o.scale));

/** Derive the mountain shoulder from the editable terrace's current world transform. */
export function syncFeihuaTerrain(p:Project){
 const terrace=p.objects.find(o=>o.id==='feihua_terrace');if(!terrace)return;
 const parent=p.groups?.find(g=>g.id===terrace.parentId),world=matrix(terrace);
 if(parent)world.premultiply(matrix(parent));
 const position=new T.Vector3(),rotation=new T.Quaternion(),scale=new T.Vector3();world.decompose(position,rotation,scale);
 p.terrain.feihua={revision:1,origin:position.toArray() as Vec3,rotationY:new T.Euler().setFromQuaternion(rotation,'YXZ').y,scale:scale.toArray() as Vec3,width:terrace.params.width,depth:terrace.params.depth};
}

/** One-time split of the old single exterior into three buildings plus shared site pieces. */
export function upgradeFeihua(p:Project):Project{
 const main=p.objects.find(o=>o.id==='landmark_feihua');if(!main)return p;
 p.groups??=[];
 if(p.groups.some(g=>g.id==='feihua_group'))return p;
 const world=matrix(main),oldParent=p.groups.find(g=>g.id===main.parentId);if(oldParent)world.premultiply(matrix(oldParent));
 const position=new T.Vector3(),quaternion=new T.Quaternion(),scale=new T.Vector3();world.decompose(position,quaternion,scale);
 const beforeY=position.y;position.y=Math.max(position.y,12);
 const euler=new T.Euler().setFromQuaternion(quaternion);
 const group={id:'feihua_group',name:'绯华楼建筑群',position:position.toArray() as Vec3,rotation:[euler.x,euler.y,euler.z] as Vec3,scale:scale.toArray() as Vec3};
 p.groups.push(group);
 main.parentId=group.id;main.position=[0,0,0];main.rotation=[0,0,0];main.scale=[1,1,1];main.snapToGround=false;main.name='绯华楼 · 主建筑';
 const {width:w,depth:d}=main.params;
 const specs:[string,string,Vec3][]=[
  ['feihua_annex','绯华楼 · 副建筑',[-w*.91,0,d*.02]],
  ['feihua_onsen','绯华楼 · 温泉',[-w*.91,0,-d*1.18]],
  ['feihua_terrace','绯华楼 · 山腰共用高台',[0,0,0]],
  ['feihua_bridge','绯华楼 · 悬空木桥',[0,0,d*1.005]],
 ];
 for(const [id,name,at] of specs){
  if(p.objects.some(o=>o.id===id))continue;
  const object:IslandObject={...structuredClone(main),id,templateId:id,name,position:at,rotation:[0,0,0],scale:[1,1,1],locationId:'',params:{...main.params}};
  p.objects.push(object);
 }
 // Existing low ground pads must not fill the newly exposed rock face or the bridge ravine.
 const siteIds=new Set(['landmark_feihua',...specs.map(s=>s[0])]);
 p.terrain.pads=p.terrain.pads?.filter(pad=>!siteIds.has(pad.ownerId));
 const marker=p.markers.find(m=>m.id==='landmark_feihua_marker');
 if(marker){marker.followId=group.id;marker.description='山腰石砌高台上的绯华楼建筑群：主楼、副楼与副楼后方温泉，前方以悬空木桥跨过山沟接入。';}
 const rise=position.y-beforeY;
 for(const view of p.cameraPresets.filter(v=>v.id==='view_landmark_feihua')){view.position[1]+=rise;view.target[1]+=rise;view.zoom=Math.min(view.zoom,3.4);}
 syncFeihuaTerrain(p);return p;
}
