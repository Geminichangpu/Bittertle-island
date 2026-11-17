import * as T from 'three';
import type {Project,IslandObject,Point,Vec3} from './model.ts';
import {COAST_CENTER,COAST_EDGE} from './scenic-site.ts';

function assignScenicOwnership(p:Project){
 const shrine=p.groups?.find(g=>g.id==='shrine_group'),coast=p.groups?.find(g=>g.id==='coast_group'),tree=p.objects.find(o=>o.id==='scenic_sakura');
 if(coast&&coast.name==='樱花与海崖')coast.name='海边山崖';
 const cliff=p.objects.find(o=>o.id==='scenic_cliff');if(cliff)cliff.category='building';
 const stone=p.objects.find(o=>o.id==='scenic_north_rock');
 if(stone&&cliff&&stone.name==='北侧望海石'){
  stone.position=[cliff.position[0]-5,cliff.position[1],cliff.position[2]-11];stone.name='海崖后侧 · 望海石';
 }
 if(stone)stone.locationId='';
 p.markers=p.markers.filter(m=>m.followId!=='scenic_north_rock');
 const coastMarker=p.markers.find(m=>m.followId==='scenic_cliff');if(coastMarker)coastMarker.description='向北延伸的临海石径，右侧是大海；山崖内部后侧有一块宽厚的望海石。';
 if(shrine&&tree&&tree.parentId==='coast_group'){
  const matrix=(o:{position:Vec3;rotation:Vec3;scale:Vec3})=>new T.Matrix4().compose(new T.Vector3(...o.position),new T.Quaternion().setFromEuler(new T.Euler(...o.rotation)),new T.Vector3(...o.scale));
  const world=matrix(tree);if(coast)world.premultiply(matrix(coast));
  const local=matrix(shrine).invert().multiply(world),position=new T.Vector3(),rotation=new T.Quaternion(),scale=new T.Vector3();local.decompose(position,rotation,scale);const euler=new T.Euler().setFromQuaternion(rotation);
  tree.parentId=shrine.id;tree.position=position.toArray() as Vec3;tree.rotation=[euler.x,euler.y,euler.z];tree.scale=scale.toArray() as Vec3;tree.regionId='shrine';
 }
 const marker=p.markers.find(m=>m.followId==='scenic_sakura');if(marker)marker.regionId='shrine';
 const view=p.cameraPresets.find(v=>v.id==='view_scenic_coast');if(view&&view.name==='樱花与海崖')view.name='海边山崖';
 // A scenic site is one selectable object; the seat stone is inside its mesh.
 if(cliff&&p.terrain.scenicCoast){
  const site=p.terrain.scenicCoast,upgraded=site.revision===1;
  if(site.revision===1){
   const oldStart=p.terrain.outer.findIndex(q=>Math.abs(q[0]-(site.center[0]-14))<.1&&Math.abs(q[1]-(site.center[1]-27))<.1);
   const oldEnd=p.terrain.outer.findIndex(q=>Math.abs(q[0]-(site.center[0]+8.5))<.1&&Math.abs(q[1]-(site.center[1]+31.5))<.1);
   if(oldStart>=0&&oldEnd>oldStart)p.terrain.outer.splice(oldStart,oldEnd-oldStart+1,...COAST_EDGE.map(q=>[site.center[0]+q[0],site.center[1]+q[1]] as Point));
   site.level=site.sakuraLevel;cliff.position[1]=site.level;cliff.params.wallHeight=site.level;site.revision=2;
  }
  if(cliff.parentId==='coast_group'){
   if(coast){const m=new T.Matrix4().compose(new T.Vector3(...coast.position),new T.Quaternion().setFromEuler(new T.Euler(...coast.rotation)),new T.Vector3(...coast.scale)).multiply(new T.Matrix4().compose(new T.Vector3(...cliff.position),new T.Quaternion().setFromEuler(new T.Euler(...cliff.rotation)),new T.Vector3(...cliff.scale)));const pos=new T.Vector3(),rot=new T.Quaternion(),scale=new T.Vector3();m.decompose(pos,rot,scale);const e=new T.Euler().setFromQuaternion(rot);cliff.position=pos.toArray() as Vec3;cliff.rotation=[e.x,e.y,e.z];cliff.scale=scale.toArray() as Vec3;}
   delete cliff.parentId;
  }
  p.objects=p.objects.filter(o=>o.id!=='scenic_north_rock');
  p.groups=p.groups?.filter(g=>g.id!=='coast_group');
  p.terrain.pads=p.terrain.pads?.filter(pad=>!['scenic_cliff','scenic_north_rock'].includes(pad.ownerId));
  for(const m of p.markers){if(m.followId==='coast_group')m.followId=cliff.id;if(m.parentId==='coast_group')delete m.parentId;}
  if(view&&upgraded){view.name='海边山崖';view.target=[site.center[0],site.level+2,site.center[1]];}
 }
 return p;
}

/** Additive, one-time addition; previously authored buildings remain in place. */
export function upgradeScenicCoast(p:Project):Project{
 if(p.terrain.scenicCoast)return assignScenicOwnership(p);
 if(!p.groups?.some(g=>g.id==='shrine_group'))return p;
 const shrine=p.groups.find(g=>g.id==='shrine_group')!;
 const tree=new T.Vector3(-5,0,-37).multiply(new T.Vector3(...shrine.scale)).applyEuler(new T.Euler(...shrine.rotation)).add(new T.Vector3(...shrine.position));
 const center:Point=[...COAST_CENTER],level=shrine.position[1]+2;
 p.terrain.scenicCoast={revision:1,center,level,sakura:[tree.x,tree.z],sakuraLevel:shrine.position[1]};
 // Replace just the north-east shoulder. The coast remains clockwise and the sea lies east.
 const outer=p.terrain.outer,at=outer.findIndex(q=>Math.abs(q[0]-150)<.1&&Math.abs(q[1]+71.25)<.1);
 if(at>=0)outer.splice(at,1,...COAST_EDGE.slice(0,-1).map(q=>[center[0]+q[0],center[1]+q[1]] as Point));
 p.groups.push({id:'coast_group',name:'樱花与海崖',position:[0,0,0],rotation:[0,0,0],scale:[1,1,1]});
 const specs:[string,string,Vec3,number,number,number][]=[
  ['scenic_sakura','神社后山 · 樱花树',[tree.x,shrine.position[1],tree.z],28,26,18],
  ['scenic_cliff','海边山崖',[center[0],level,center[1]],44,56,level],
  ['scenic_north_rock','海崖后侧 · 望海石',[center[0]-5,level,center[1]-11],8,6,3.4]
 ];
 for(const [id,name,position,width,depth,wallHeight] of specs){
  if(p.objects.some(o=>o.id===id))continue;
  const o:IslandObject={id,parentId:'coast_group',category:'nature',templateId:id,name,position,rotation:[0,0,0],scale:[1,1,1],snapToGround:false,locked:false,regionId:'shrine_coast',locationId:id,params:{width,depth,wallHeight,roofColor:'#f8cddd',wallColor:'#c1c7c6'}};p.objects.push(o);
  p.markers.push({id:id+'_marker',followId:id,name,locationId:id+'_view',regionId:'shrine_coast',description:id==='scenic_sakura'?'神社后山的樱花树，沿花瓣小径前往临海山崖。':id==='scenic_cliff'?'向北漫步的临海石径，海面在右侧，北端是宽厚的望海石。':'海崖北面的扁宽巨石，石顶平缓，岩缝间长着细草。',visible:true,position:[...position]});
 }
 p.cameraPresets.push({id:'view_scenic_coast',name:'樱花与海崖',position:[center[0]-18,level+36,center[1]+62],target:[center[0]-8,level+4,center[1]-2],zoom:2.4,perspective:true});
 return assignScenicOwnership(p);
}
