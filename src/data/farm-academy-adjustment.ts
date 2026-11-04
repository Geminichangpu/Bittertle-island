import type {Project,IslandObject} from './model.ts';
import {isLand} from '../terrain/terrain.ts';
import {objectWorldBounds} from '../terrain/placement.ts';

/** Apply the requested settlement changes once, preserving unrelated authored objects. */
export function adjustFarmAndAcademy(p:Project){
 if(p.terrain.farmAcademyRevision===1)return p;
 const farm=p.objects.find(o=>o.id==='scenic_farm'),farmPad=p.terrain.pads?.find(q=>q.ownerId==='scenic_farm'),bay=p.terrain.pads?.find(q=>q.ownerId==='island-town:bay');
 if(farm&&farmPad&&bay&&!farm.parentId&&Math.abs(farm.position[1]-farmPad.level)<.05){const delta=bay.level-farm.position[1];farm.position[1]=bay.level;farmPad.level=bay.level;farmPad.feather=Math.max(farmPad.feather,18);for(const m of p.markers)if(m.followId===farm.id)m.position[1]+=delta;for(const v of p.cameraPresets)if(v.id==='view_scenic_farm'){v.position[1]+=delta;v.target[1]+=delta;}}
 const a=p.objects.find(o=>o.id==='scenic_academy');if(!a||a.parentId||!bay)return p;
 const old=[...a.position] as [number,number,number],x=old[0]-4,z=old[2]-26,y=bay.level,candidate={...a,position:[x,y,z] as [number,number,number]},box=objectWorldBounds(p,candidate);
 const corners=[[box.min.x,box.min.z],[box.min.x,box.max.z],[box.max.x,box.min.z],[box.max.x,box.max.z]];
 if(corners.some(q=>!isLand(p.terrain,q[0],q[1]))||p.objects.some(o=>o!==a&&objectWorldBounds(p,o).intersectsBox(box))){console.warn('Academy target is occupied');return p;}
 a.position=candidate.position;const pad=p.terrain.pads?.find(q=>q.ownerId===a.id);if(pad){pad.minX+=x-old[0];pad.maxX+=x-old[0];pad.minZ+=z-old[2];pad.maxZ+=z-old[2];pad.level=y;pad.feather=Math.max(pad.feather,18);}
 (p.terrain.pads||=[]).push({ownerId:'island-town:academy-village',minX:old[0]-11,maxX:old[0]+11,minZ:old[2]-11,maxZ:old[2]+11,level:old[1],feather:14});
 for(const m of p.markers)if(m.followId===a.id){m.position[0]+=x-old[0];m.position[1]+=y-old[1];m.position[2]+=z-old[2];}
 for(const v of p.cameraPresets)if(v.id==='view_scenic_academy')for(let i=0;i<3;i++){const d=a.position[i]-old[i];v.position[i]+=d;v.target[i]+=d;}
 for(const [i,dx] of [-4.5,4.5].entries()){
  const id='layout_island_academy_home_'+(i+1);if(p.objects.some(o=>o.id===id))continue;
  const home:IslandObject={id,templateId:'layout_island_house',category:'building',name:'学院旧址民房 '+(i+1),position:[old[0]+dx,old[1],old[2]],rotation:[0,0,0],scale:[1,1,1],snapToGround:false,locked:false,regionId:'village',locationId:id,params:{width:6.2,depth:5.8,wallHeight:3.1,roofColor:'#bd684b',wallColor:'#eee5ce'}};
  const bounds=objectWorldBounds(p,home).expandByScalar(.3);if(p.objects.some(o=>objectWorldBounds(p,o).intersectsBox(bounds)))continue;
  p.objects.push(home);(p.terrain.pads||=[]).push({ownerId:id,minX:home.position[0]-3.1,maxX:home.position[0]+3.1,minZ:home.position[2]-3.1,maxZ:home.position[2]+3.1,level:home.position[1],feather:5});
 }
 p.terrain.farmAcademyRevision=1;return p;
}
