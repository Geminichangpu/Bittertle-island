import {scenicRoadFree} from '../terrain/scenic-coast.ts';
import * as T from 'three';
import type {Project,Point} from '../data/model.ts';
import {objectWorldBounds,transformMatrix} from '../terrain/placement.ts';
import {isLand,coastDistance,sampleHeight} from '../terrain/terrain.ts';

export type Route={id:string;name:string;fromId:string;toId:string;width:number;points:Point[];status:'connected'|'unavailable'};
export type Obstacle={id:string;box:T.Box3};
const walkable=new Set(['shrine_court','shrine_path','shrine_garden','island_bridge','feihua_terrace','feihua_bridge','scenic_cliff']);
export function buildingObstacles(p:Project):Obstacle[]{return p.objects.filter(o=>!walkable.has(o.templateId)).map(o=>({id:o.id,box:objectWorldBounds(p,o)}));}
export const blocked=(obstacles:Obstacle[],x:number,z:number,margin=0)=>obstacles.some(({box:b})=>x>=b.min.x-margin&&x<=b.max.x+margin&&z>=b.min.z-margin&&z<=b.max.z+margin);
export function entrance(p:Project,id:string):Point|undefined{
 if(id==='landmark_feihua'){
  const bridge=p.objects.find(o=>o.id==='feihua_bridge');
  if(bridge){const m=transformMatrix(bridge),parent=p.groups?.find(g=>g.id===bridge.parentId);if(parent)m.premultiply(transformMatrix(parent));const end=new T.Vector3(0,0,bridge.params.depth*1.35+2).applyMatrix4(m);return [end.x,end.z];}
 }
 const o=p.objects.find(o=>o.id===id||o.templateId===id);if(!o)return;
 const bb=objectWorldBounds(p,o),m=transformMatrix(o),group=p.groups?.find(g=>g.id===o.parentId);if(group)m.premultiply(transformMatrix(group));
 const center=new T.Vector3().applyMatrix4(m),forward=new T.Vector3(0,0,1).transformDirection(m);
 // Exit the full roof/stair envelope before starting the earth path.
 let r=0;for(;r<100;r+=.5){const x=center.x+forward.x*r,z=center.z+forward.z*r;if(x<bb.min.x-2||x>bb.max.x+2||z<bb.min.z-2||z>bb.max.z+2)return [x,z];}
 return [center.x,center.z];
}

class Heap {
 data:{id:number;score:number}[]=[];
 push(id:number,score:number){const item={id,score},a=this.data;let i=a.length;a.push(item);while(i){const p=(i-1)>>1;if(a[p].score<=score)break;a[i]=a[p];i=p;}a[i]=item;}
 pop(){const a=this.data,first=a[0],last=a.pop()!;if(a.length){let i=0;while(i*2+1<a.length){let c=i*2+1;if(c+1<a.length&&a[c+1].score<a[c].score)c++;if(a[c].score>=last.score)break;a[i]=a[c];i=c;}a[i]=last;}return first;}
}

/** Land-only slope-aware routing; authored buildings are obstacles and are never relocated. */
export function planPaths(p:Project):Route[]{
 const specs=[
  ['base-shrine','基地至神社山路','base_office','shrine_torii',2.4],
  ['shrine-shopping','神社至商店街小路','shrine_torii','layout_shopping',2.3],
  ['market-base','市集至基地','layout_market','base_office',3.0],
  ['west-market','西侧山路','landmark_feihua','layout_market',3.0],
  ['shopping-library','东岸林间路','layout_shopping','landmark_library',2.6],
  ['library-lighthouse','北岸小路','landmark_library','layout_lighthouse',2.4]
 ] as const;
 const size=p.terrain.size,step=2,n=Math.ceil(size/step)+1,count=n*n,obs=buildingObstacles(p),heights=new Float32Array(count),valid=new Uint8Array(count);
 const point=(i:number):Point=>[(i%n)*step-size/2,Math.floor(i/n)*step-size/2];
 for(let i=0;i<count;i++){const [x,z]=point(i);if(scenicRoadFree(p.terrain,x,z)||!isLand(p.terrain,x,z)||coastDistance(p.terrain,[x,z])<2||blocked(obs,x,z,1.25))continue;valid[i]=1;heights[i]=sampleHeight(p.terrain,x,z);}
 const safe=(a:Point,margin=1.2)=>!scenicRoadFree(p.terrain,...a)&&isLand(p.terrain,...a)&&coastDistance(p.terrain,a)>1.8&&!blocked(obs,...a,margin);
 const segmentSafe=(a:Point,b:Point)=>{const steps=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.7);for(let i=0;i<=steps;i++){const t=i/Math.max(1,steps);if(!safe([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]))return false;}return true;};
 function nearest(a:Point){let best=-1,d=Infinity;for(let i=0;i<count;i++)if(valid[i]){const q=point(i),r=Math.hypot(q[0]-a[0],q[1]-a[1]);if(r<d&&r<12&&segmentSafe(a,q)){best=i;d=r;}}return best;}
 return specs.map(([id,name,fromId,toId,width])=>{
  const route:Route={id,name,fromId,toId,width,points:[],status:'unavailable'},start=entrance(p,fromId),end=entrance(p,toId);if(!start||!end)return route;
  const s=nearest(start),goal=nearest(end);if(s<0||goal<0)return route;
  const cost=new Float64Array(count).fill(Infinity),parent=new Int32Array(count).fill(-1),closed=new Uint8Array(count),heap=new Heap();cost[s]=0;heap.push(s,0);
  while(heap.data.length){const current=heap.pop().id;if(closed[current])continue;if(current===goal)break;closed[current]=1;const x=current%n,z=Math.floor(current/n);
   for(const [dx,dz] of [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]]){
    const xx=x+dx,zz=z+dz,j=zz*n+xx;if(xx<0||zz<0||xx>=n||zz>=n||!valid[j]||closed[j])continue;
    if(dx&&dz&&(!valid[z*n+xx]||!valid[zz*n+x]))continue;
    const length=Math.hypot(dx,dz)*step,slope=Math.abs(heights[j]-heights[current])/length;
    if(slope>1.45)continue;
    const next=cost[current]+length*(1+slope*slope*26)+Math.max(0,slope-.35)*10;
    if(next<cost[j]){cost[j]=next;parent[j]=current;const q=point(j);heap.push(j,next+Math.hypot(q[0]-end[0],q[1]-end[1]));}
   }
  }
  if(parent[goal]===-1&&s!==goal)return route;
  const cells:Point[]=[];for(let i=goal;i!==-1;i=parent[i])cells.push(point(i));cells.reverse();
  let points=[start,...cells,end];
  // Corner rounding is accepted only when the new segment still clears water and buildings.
  for(let pass=0;pass<3;pass++){const next=points.map(q=>[...q] as Point);for(let i=1;i<points.length-1;i++){const q:Point=[points[i][0]*.5+(points[i-1][0]+points[i+1][0])*.25,points[i][1]*.5+(points[i-1][1]+points[i+1][1])*.25];if(segmentSafe(points[i-1],q)&&segmentSafe(q,points[i+1]))next[i]=q;}points=next;}
  route.points=[points[0]];for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],steps=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.3));for(let j=1;j<=steps;j++)route.points.push([a[0]+(b[0]-a[0])*j/steps,a[1]+(b[1]-a[1])*j/steps]);}
  for(const [id,at,prepend] of [[fromId,start,true],[toId,end,false]] as const){const o=p.objects.find(o=>o.id===id);if(!o)continue;const center=objectWorldBounds(p,o).getCenter(new T.Vector3()),dx=center.x-at[0],dz=center.z-at[1],n=Math.hypot(dx,dz)||1;const contact:Point=[at[0]+dx/n*1.8,at[1]+dz/n*1.8];if(isLand(p.terrain,...contact)){if(prepend)route.points.unshift(contact);else route.points.push(contact);}}
  route.status='connected';return route;
 });
}

export function roadDistance(routes:Route[],x:number,z:number){let d=Infinity;for(const r of routes)for(let i=1;i<r.points.length;i++){const a=r.points[i-1],b=r.points[i],vx=b[0]-a[0],vz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*vx+(z-a[1])*vz)/(vx*vx+vz*vz||1)));d=Math.min(d,Math.hypot(x-a[0]-vx*t,z-a[1]-vz*t)-r.width/2);}return d;}
