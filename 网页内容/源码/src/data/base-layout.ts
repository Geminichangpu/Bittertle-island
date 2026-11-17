import {makeObject,type Project,type Point} from './model.ts';
import {sampleHeight} from '../terrain/terrain.ts';

export const baseTemplates:Record<string,string>={base_bedroom:'基地 · 卧室',base_office:'基地 · 办公室',base_pond:'基地 · 鱼塘',base_warehouse:'基地 · 仓库'};

/** Keep the saved hall as the anchor; replace only the reference shrine satellites and base objects. */
export function arrangeShrineAndBase(p:Project){
 const hall=p.objects.find(o=>o.id==='shrine_main')||p.objects.find(o=>o.templateId==='shrine_main');
 if(!hall)throw new Error('工程中没有主殿，请先添加主殿再整理布局。');
 const [hx,,hz]=hall.position,a=hall.rotation[1],c=Math.cos(a),s=Math.sin(a);
 const point=(x:number,z:number):Point=>[hx+x*c+z*s,hz-x*s+z*c];
 const specs:[string,number,number,number,number,number,number][]=[
  ['shrine_torii',0,20,12,3,8,0],['shrine_temizu',-14,12,6.5,5.5,4.6,Math.PI/2],
  ['shrine_office',23,14,12,8,5.2,-Math.PI/2],['shrine_residence',24,-9,15,9,5.3,-Math.PI/2],
  ['shrine_court',0,13,22,14,1,0],['shrine_path',13,10,12,24,1,0],['shrine_garden',14,-8,8,16,1,0]
 ];
 for(const [id,x,z,w,d,h,rotation] of specs){let o=p.objects.find(o=>o.id===id);if(!o){o=makeObject(id);o.id=id;p.objects.push(o);}const at=point(x,z);o.position=[at[0],0,at[1]];o.rotation=[0,a+rotation,0];o.params.width=w;o.params.depth=d;o.params.wallHeight=h;o.regionId='shrine_precinct';}
 // Only grade the former southern precinct. Existing terrain elsewhere stays intact.
 const t=p.terrain,n=t.resolution;
 for(let j=0;j<n;j++)for(let i=0;i<n;i++){const x=(i/(n-1)-.5)*t.size,z=(j/(n-1)-.5)*t.size,edge=Math.min(x-43,104-x,z-70,106-z),blend=Math.max(0,Math.min(1,edge/5));if(blend&&Math.hypot(x-hx,z-hz)>18)t.heights[j*n+i]=t.heights[j*n+i]*(1-blend)+7*blend;}
 const base:[string,number,number,number,number,number][]=[['base_office',52,90,12,9,5],['base_bedroom',70,90,13,11,5],['base_pond',86,87,12,10,1],['base_warehouse',90,76,10,9,5.2]];
 for(const [id,x,z,w,d,h] of base){let o=p.objects.find(o=>o.id===id);if(!o){o=makeObject(id);o.id=id;p.objects.push(o);}o.name=baseTemplates[id];o.regionId='base_precinct';o.position=[x,0,z];o.rotation=[0,0,0];o.params={width:w,depth:d,wallHeight:h,wallColor:'#97632e',roofColor:'#41464b'};}
 const arranged=new Set([...specs,...base].map(row=>row[0]));
 for(const o of p.objects)if(o.snapToGround&&arranged.has(o.id))o.position[1]=sampleHeight(t,o.position[0],o.position[2]);
 const hallHeight=hall.snapToGround?sampleHeight(t,hx,hz):hall.position[1];
 // The main hall's position and author-edited appearance are never reset by this command.
 const marker=p.markers.find(m=>m.id==='marker_shrine');if(marker){const at=point(0,13);marker.position=[at[0],hallHeight+1,at[1]];marker.description='神社建筑群以当前主殿为基准布置，原南侧院址改为生活基地。';}
 p.markers=p.markers.filter(m=>m.id!=='marker_base');p.markers.push({id:'marker_base',name:'生活基地',locationId:'living_base',regionId:'base_precinct',description:'办公室在卧室左侧，鱼塘在卧室右侧，仓库位于鱼塘上方。',visible:true,position:[70,8,90]});
 p.regions=p.regions.filter(r=>!['shrine_precinct','base_precinct'].includes(r.id));p.regions.push({id:'shrine_precinct',name:'神社境内',color:'#bda97b',visible:false,points:[[-20,-20],[34,-20],[34,24],[-20,24]].map(([x,z])=>point(x,z))},{id:'base_precinct',name:'生活基地',color:'#ad874e',visible:false,points:[[43,71],[99,71],[98,96],[43,100]]});
 p.cameraPresets=p.cameraPresets.filter(v=>!v.id.startsWith('view_base'));
 p.cameraPresets.push({id:'view_base_overview',name:'基地 · 建筑群',position:[113,57,146],target:[71,10,86],zoom:5,perspective:false});
 for(const v of p.cameraPresets.filter(v=>v.id.startsWith('view_shrine'))){const dx=v.position[0]-v.target[0],dy=v.position[1]-v.target[1],dz=v.position[2]-v.target[2],at=point(v.id==='view_shrine_garden'?20:8,v.id==='view_shrine_garden'?-7:8);v.target=[at[0],hallHeight+3,at[1]];v.position=[at[0]+dx,v.target[1]+dy,at[1]+dz];}
 return p;
}

export function applyAnchoredLayout(old:Project){return arrangeShrineAndBase(structuredClone(old));}
