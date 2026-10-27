import * as T from 'three';
import type {Project,Point} from './model';

/** One-time terrain upgrade. Authored object and group transforms are never changed. */
export function upgradeCentralCampus(p:Project){
 const t=p.terrain,tower=p.objects.find(o=>o.templateId==='landmark_liuli');
 if(t.campus||!tower)return p;
 const at=new T.Vector3(...tower.position),group=p.groups?.find(g=>g.id===tower.parentId);
 if(group)at.multiply(new T.Vector3(...group.scale)).applyEuler(new T.Euler(...group.rotation)).add(new T.Vector3(...group.position));
 const center:Point=[at.x,at.z],radius=Math.max(24,Math.min(30,Math.max(...t.islet.map(q=>Math.hypot(q[0]-at.x,q[1]-at.z))))),level=at.y;
 t.campus={revision:1,center,radius,level};
 t.islet=Array.from({length:64},(_,i)=>[at.x+Math.cos(i*Math.PI/32)*radius,at.z+Math.sin(i*Math.PI/32)*radius] as Point);
 const n=t.resolution;
 for(let j=0;j<n;j++)for(let i=0;i<n;i++){const x=(i/(n-1)-.5)*t.size,z=(j/(n-1)-.5)*t.size;if(Math.hypot(x-at.x,z-at.z)<radius+t.size/n*2)t.heights[j*n+i]=Math.max(0,level-.9);}
 const bridge=p.objects.find(o=>o.templateId==='island_bridge');
 if(bridge){const start=bridge.position[0]-bridge.params.width/2,z=bridge.position[2],end=at.x+radius+1,half=bridge.params.depth/2+.25;
  t.pads=t.pads||[];
  for(let x=Math.max(at.x+9,start-9);x<end;x+=1){const u=Math.max(0,(x-start)/bridge.params.width),blend=Math.max(0,Math.min(1,(x-(start-9))/9)),deck=bridge.position[1]+(bridge.params.bridgeEndHeight||0)*u+Math.sin(Math.PI*u)*1.5;
   const h=x<start?level+(deck-.17-level)*blend:deck-.17;
   t.pads.push({ownerId:'campus:approach:'+Math.round(x*10),minX:x-.5,maxX:x+.5,minZ:z-half,maxZ:z+half,level:h,feather:2});
  }
 }
 return p;
}
