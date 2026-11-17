import {makeObject,type Project} from './model.ts';
import {isLand,sampleHeight} from '../terrain/terrain.ts';

export const landmarkTemplates:Record<string,string>={
 landmark_liuli:'琉璃塔',landmark_library:'璃光图书馆',landmark_feihua:'绯华楼'
};
const specs=[
 {id:'landmark_liuli',x:9,z:0,w:14,d:14,h:46,wall:'#d5f0ed',roof:'#548cc4',level:4.5,pad:[-2,20,-10,10],description:'湾中独立小岛上的琉璃塔。银白支翼环绕蓝青色晶体尖塔，悬浮感以静态几何表达。',view:[44,47,66,0,21,0,4.5]},
 {id:'landmark_library',x:52,z:-80,w:22,d:22,h:12,wall:'#e3e2d3',roof:'#619bb7',level:12,pad:[34,70,-97,-61],description:'北岸偏右的璃光图书馆。白色环柱、蓝色穹顶、金色饰边与面向内湾的入口台阶。',view:[40,33,56,0,8,0,6]},
 {id:'landmark_feihua',x:-93,z:50,w:26,d:16,h:21,wall:'#e5d4b5',roof:'#525d77',level:9,pad:[-113,-73,32,72],description:'西侧山脚面向内湾的绯华楼。层叠瓦顶、红栏回廊、灯笼与紫色门帘；门厅设接待台和楼梯。',view:[46,36,68,0,13,3,4.6]}
] as const;

/** Add missing landmarks only. Existing authored objects, terrain outside new pads and views stay intact. */
export function addReferenceLandmarks(p:Project){
 for(const s of specs){
  const existing=p.objects.find(o=>o.id===s.id||o.templateId===s.id);
  if(existing)continue;
  const t=p.terrain,n=t.resolution,[left,right,north,south]=s.pad;
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){
   const x=(i/(n-1)-.5)*t.size,z=(j/(n-1)-.5)*t.size,edge=Math.min(x-left,right-x,z-north,south-z);
   if(edge<=0||!isLand(t,x,z))continue;
   const f=Math.min(1,edge/5);t.heights[j*n+i]=t.heights[j*n+i]*(1-f)+s.level*f;
  }
  const o=makeObject(s.id);o.id=s.id;o.name=landmarkTemplates[s.id];o.regionId=s.id+'_area';o.position=[s.x,sampleHeight(t,s.x,s.z),s.z];o.rotation=[0,0,0];
  o.params={width:s.w,depth:s.d,wallHeight:s.h,wallColor:s.wall,roofColor:s.roof};p.objects.push(o);
  const markerId=s.id+'_marker',viewId='view_'+s.id;
  if(!p.markers.some(m=>m.id===markerId||m.locationId===s.id))p.markers.push({id:markerId,name:o.name,locationId:s.id,regionId:o.regionId,description:s.description,visible:true,position:[s.x,o.position[1],s.z]});
  if(!p.cameraPresets.some(v=>v.id===viewId)){const [px,py,pz,tx,ty,tz,zoom]=s.view;p.cameraPresets.push({id:viewId,name:o.name+' · 近景',position:[s.x+px,o.position[1]+py,s.z+pz],target:[s.x+tx,o.position[1]+ty,s.z+tz],zoom,perspective:false});}
 }
 return p;
}
export function applyLandmarks(old:Project){return addReferenceLandmarks(structuredClone(old));}
