import {makeObject,type Project,type Vec3} from './model.ts';
import {sampleHeight,isLand} from '../terrain/terrain.ts';

/** One-time, in-place layout migration. Keep authored transforms and terrain samples. */
export function upgradeM1(p:Project):Project {
 if(p.layoutRevision===1)return p;
 const t=p.terrain,old=structuredClone(t);
 // Add a border to the height grid: existing samples stay at exactly the same world coordinates.
 const border=8,n=old.resolution+border*2,step=old.size/(old.resolution-1);
 t.resolution=n;t.size=step*(n-1);t.heights=Array.from({length:n*n},(_,k)=>{const i=Math.max(0,Math.min(old.resolution-1,k%n-border)),j=Math.max(0,Math.min(old.resolution-1,Math.floor(k/n)-border));return old.heights[j*old.resolution+i];});
 t.outer=t.outer.map(([x,z])=>[x*1.25,z*1.25]);
 t.islet=t.islet.map(([x,z])=>[9+(x-9)*1.12,z*1.12]);
 // Freeze current world-space ground contact before adding parents; grouped children use local positions.
 for(const o of p.objects){if(o.snapToGround&&!o.parentId)o.position[1]=sampleHeight(old,o.position[0],o.position[2]);o.snapToGround=false;}
 const specs=[
  {id:'layout_lighthouse',name:'灯塔',x:-137,z:-90,w:10,d:10,h:23,color:'#ede3c7',roof:'#b95e43'},
  {id:'layout_shopping',name:'商店街',x:121,z:13,w:23,d:29,h:7,color:'#d5b984',roof:'#668d91'},
  {id:'layout_market',name:'市集',x:10,z:91,w:25,d:20,h:5,color:'#ba8b49',roof:'#cab86a'},
  {id:'layout_treehouse',name:'树屋',x:46,z:70,w:17,d:17,h:20,color:'#9b7445',roof:'#a6b764'}
 ];
 for(const s of specs){if(p.objects.some(o=>o.id===s.id||o.templateId===s.id))continue;
  // Grade only new footprints and feather their edges, avoiding existing authored buildings.
  const level=Math.max(3,sampleHeight(t,s.x,s.z)-.9);
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){const x=i*step-t.size/2,z=j*step-t.size/2,edge=Math.min(s.w/2+6-Math.abs(x-s.x),s.d/2+6-Math.abs(z-s.z));if(edge<=0||!isLand(t,x,z))continue;if(p.objects.some(o=>!o.parentId&&Math.abs(o.position[0]-x)<o.params.width*o.scale[0]/2+3&&Math.abs(o.position[2]-z)<o.params.depth*o.scale[2]/2+3))continue;const f=Math.min(1,edge/5);t.heights[j*n+i]=t.heights[j*n+i]*(1-f)+level*f;}
  const o=makeObject(s.id);o.id=s.id;o.name=s.name;o.regionId='m1_additions';o.position=[s.x,sampleHeight(t,s.x,s.z),s.z];o.snapToGround=false;o.params={width:s.w,depth:s.d,wallHeight:s.h,wallColor:s.color,roofColor:s.roof};p.objects.push(o);
  if(!p.markers.some(m=>m.id===s.id+'_marker'))p.markers.push({id:s.id+'_marker',name:s.name,locationId:s.id,regionId:o.regionId,description:s.name+' · M1 布局模型',visible:true,position:[...o.position]});
  if(!p.cameraPresets.some(v=>v.id==='view_'+s.id))p.cameraPresets.push({id:'view_'+s.id,name:s.name+' · 近景',position:[s.x+42,o.position[1]+36,s.z+56],target:[s.x,o.position[1]+s.h/2,s.z],zoom:5,perspective:false});
 }
 p.groups??=[];
 for(const [id,name,prefix,markerId] of [['shrine_group','神社建筑群','shrine_','marker_shrine'],['base_group','生活基地','base_','marker_base']]){
  if(p.groups.some(g=>g.id===id))continue;
  const members=p.objects.filter(o=>o.templateId.startsWith(prefix)&&!o.parentId);if(!members.length)continue;
  const origin:Vec3=[(Math.min(...members.map(o=>o.position[0]))+Math.max(...members.map(o=>o.position[0])))/2,Math.min(...members.map(o=>o.position[1])),(Math.min(...members.map(o=>o.position[2]))+Math.max(...members.map(o=>o.position[2])))/2];
  p.groups.push({id,name,position:origin,rotation:[0,0,0],scale:[1,1,1]});
  for(const o of members){o.parentId=id;o.position=o.position.map((v,i)=>v-origin[i]) as Vec3;}
  const marker=p.markers.find(m=>m.id===markerId);if(marker&&!marker.parentId){marker.parentId=id;marker.position=marker.position.map((v,i)=>v-origin[i]) as Vec3;}
 }
 p.layoutRevision=1;return p;
}
