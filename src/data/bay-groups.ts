import * as T from 'three';
import type {Project,IslandObject} from './model.ts';
import {objectWorldBounds} from '../terrain/placement.ts';
import {isLand,coastDistance,sampleHeight} from '../terrain/terrain.ts';
import {planPaths,roadDistance} from '../environment/paths.ts';

/** Space only the unchanged automatically placed bay homes; keep user-customized homes intact. */
export function upgradeBayGroups(p:Project,justGenerated=false):Project{
 const shop=p.objects.find(o=>o.id==='layout_shopping'),pad=p.terrain.pads?.find(q=>q.ownerId==='island-town:bay');if(!shop||!pad)return p;
 const expected:Record<string,[number,number]>={layout_island_house_1:[shop.position[0],shop.position[2]+30],layout_island_house_2:[shop.position[0],shop.position[2]+39],layout_island_house_3:[shop.position[0]+9,shop.position[2]+30],layout_island_house_7:[shop.position[0]+9,shop.position[2]+39]};
 const angles:Record<string,number>={layout_island_house_1:1.8246226799790408,layout_island_house_2:2.0919278623517212,layout_island_house_3:2.0291073061718032,layout_island_house_7:2.371198775826165};
 const homes=p.objects.filter(o=>{const q=expected[o.id];return !!q&&Math.hypot(o.position[0]-q[0],o.position[2]-q[1])<.08&&o.templateId==='layout_island_house'&&o.params.width===6.2&&o.params.depth===5.8&&o.scale.every(v=>Math.abs(v-1)<.001)&&(justGenerated||Math.abs(o.rotation[1]-angles[o.id])<.01);});if(!homes.length)return p;
 const slots:Record<string,[number,number]>={layout_island_house_1:[shop.position[0]-2,shop.position[2]+26.5],layout_island_house_2:[shop.position[0]-2,shop.position[2]+35],layout_island_house_3:[shop.position[0]+9,shop.position[2]+35],layout_island_house_7:[shop.position[0]+9,shop.position[2]+43.5]};
 const excluded=new Set(homes.map(o=>o.id)),other=p.objects.filter(o=>!excluded.has(o.id)).map(o=>objectWorldBounds(p,o));const placed:T.Box3[]=[],changes:{o:IslandObject;position:[number,number,number]}[]=[];
 for(const home of homes){const [x,z]=slots[home.id],position:[number,number,number]=[x,pad.level,z],trial={...home,position,rotation:[0,0,0] as [number,number,number]},box=objectWorldBounds(p,trial);if(x<pad.minX||x>pad.maxX||z<pad.minZ||z>pad.maxZ||other.some(b=>b.intersectsBox(box))||placed.some(b=>b.intersectsBox(box)))return p;placed.push(box);changes.push({o:home,position});}
 for(const {o,position} of changes){const old=[...o.position];o.position=position;o.rotation=[0,0,0];for(const m of p.markers)if(m.followId===o.id)m.position=[...position];for(const view of p.cameraPresets)if(view.id==='view_'+o.id)for(let i=0;i<3;i++){view.position[i]+=position[i]-old[i];view.target[i]+=position[i]-old[i];}}
 // A small upper group uses a separate clear, naturally level site by the shopping area.
 if(!p.objects.some(o=>o.id==='layout_island_house_extra_1')){
  const x=shop.position[0]+17,z=shop.position[2]+9,points=[[x-4,z-4],[x-4,z+4],[x+4,z-4],[x+4,z+4],[x,z]],heights=points.map(([a,b])=>sampleHeight(p.terrain,a,b));
  const candidate:IslandObject={...homes[0],id:'layout_island_house_extra_1',name:'海岛民居 6',locationId:'layout_island_house_extra_1',position:[x,heights[4],z],rotation:[0,0,0],params:{...homes[0].params}};
  const box=objectWorldBounds(p,candidate),clear=points.every(([a,b])=>isLand(p.terrain,a,b)&&coastDistance(p.terrain,[a,b])>2)&&Math.max(...heights)-Math.min(...heights)<1.0&&!p.objects.some(o=>objectWorldBounds(p,o).intersectsBox(box));
  if(clear&&roadDistance(planPaths(p),x,z)>4.4)p.objects.push(candidate);
 }
 return p;
}
