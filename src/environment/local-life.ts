import * as T from 'three';
import type {Project} from '../data/model';
import type {Builder} from '../generators/shrine';
import type {TerrainSurface} from './surface';
import {blocked,roadDistance,type Obstacle,type Route} from './paths';
import {transformMatrix} from '../terrain/placement';
import {coastDistance,isLand} from '../terrain/terrain';
import {inNorthBeach} from './north-beach';
import {crownGeometry,leafSprigGeometry,boulderGeometry} from './nature-geometry';

/** Small static clusters follow the saved layout; paths and building footprints stay clear. */
export function addLocalLife(p:Project,b:Builder,surface:TerrainSurface,routes:Route[],obstacles:Obstacle[]){
 const solid=obstacles.filter(o=>!['scenic_cliff','shrine_path','shrine_court','shrine_garden','island_bridge'].includes(o.id));
 const counts={shrine:0,mountain:0,mountainTrees:0,rest:0,campus:0,caveTrees:0,caveRoots:[] as [number,number,number][]};
 const valid=(x:number,z:number,clearance=1.6)=>{const y=surface.height(x,z);if(y===undefined||!isLand(p.terrain,x,z)||inNorthBeach(p,x,z)||coastDistance(p.terrain,[x,z])<4||blocked(solid,x,z,.8)||roadDistance(routes,x,z)<clearance)return;return y;};
 const leaf=(x:number,y:number,z:number,r:number,c:string)=>b.emit('life:shrub',crownGeometry,c,[x,y+r*.45,z],[r,r*.65,r]);
 const sprig=(x:number,y:number,z:number,r:number,c:string,a:number)=>b.emit('life:sprig',leafSprigGeometry,c,[x,y+.03,z],[r,r,r],new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),a));
 const stone=(x:number,y:number,z:number,r:number)=>b.emit('life:rock',()=>boulderGeometry(1),'#9d9c88',[x,y+r*.25,z],[r,r*.55,r*.8]);
 const plant=(x:number,y:number,z:number,i:number)=>{leaf(x,y,z,.85+(i%3)*.16,i%2?'#76936a':'#63815c');for(let j=0;j<4;j++){const a=i*2.4+j*1.57,xx=x+Math.cos(a)*(.65+j*.08),zz=z+Math.sin(a)*(.65+j*.08);sprig(xx,y,zz,.55,j%2?'#9dad70':'#829b62',a);if((i+j)%3===0)b.ball([xx,y+.33,zz],[.16,.16,.16],j%2?'#e9c6ba':'#f0e2bd');}};
 const group=p.groups?.find(g=>g.id==='shrine_group');
 if(group){const m=transformMatrix(group),garden=p.objects.find(o=>o.id==='shrine_garden');
  const spots:[number,number][]=[[-24,-19],[-19,-20],[-19,-12],[-19,-7],[-19,-2],[-18,2],[-12,-21],[-1,-21],[16,-25],[23,-24],[28,-18],[29,-9],[30,0],[30,14],[24,21],[12,23],[3,23],[-14,22],[-25,16],[-27,5],[-27,-6]];
  for(let i=0;i<spots.length;i++){const [lx,lz]=spots[i];if(garden&&Math.abs(lx-garden.position[0])<7&&Math.abs(lz-garden.position[2])<10)continue;const v=new T.Vector3(lx,0,lz).applyMatrix4(m),y=valid(v.x,v.z,2);if(y===undefined)continue;plant(v.x,y,v.z,i);if(i%4===0)stone(v.x+.9,y,v.z-.55,.38);counts.shrine++;}
  // Two small pots and a bench sit away from the main entrance and the stepping stones.
  for(const [lx,lz] of [[-25,10],[28,-20]] as [number,number][]){const v=new T.Vector3(lx,0,lz).applyMatrix4(m),y=valid(v.x,v.z,2.2);if(y===undefined)continue;b.box([v.x,y+.38,v.z],[1.7,.14,.5],'#a1825e',group.rotation[1]);b.box([v.x-.55,y+.2,v.z],[.13,.4,.4],'#71583f');b.box([v.x+.55,y+.2,v.z],[.13,.4,.4],'#71583f');counts.rest++;}
 }
 // Patchy, low vegetation on the north mountain; deterministic and bounded.
 let seed=((p.environment?.seed??1)^0x61793)|0;const rnd=()=>{seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t^=t+Math.imul(t^t>>>7,61|t);return ((t^t>>>14)>>>0)/4294967296;};
 for(let i=0;i<420&&counts.mountain<135;i++){const x=-98+rnd()*112,z=-133+rnd()*52,y=valid(x,z,3);if(y===undefined||y<5||y>38)continue;const slope=Math.max(Math.abs((surface.height(x+1,z)??y)-y),Math.abs((surface.height(x,z+1)??y)-y));if(slope>2.2)continue;const i0=counts.mountain;for(let j=0;j<3;j++){const a=rnd()*Math.PI*2,d=rnd()*1.3,xx=x+Math.cos(a)*d,zz=z+Math.sin(a)*d,yy=surface.height(xx,zz)??y;sprig(xx,yy,zz,.75+rnd()*.5,j%2?'#91a66e':'#a8b77b',a);}if(i0%3===0)leaf(x,y,z,.7+rnd()*.5,'#78926a');if(i0%7===0)stone(x+.7,surface.height(x+.7,z-.4)??y,z-.4,.5+rnd()*.5);counts.mountain++;}
 // A few irregular small trees break up the broad slope behind the villa.
 const mountainTrees:[number,number][]=[];
 for(let i=0;i<100&&mountainTrees.length<10;i++){const x=-74+rnd()*62,z=-119+rnd()*25,y=valid(x,z,3);if(y===undefined||y<8||y>38||mountainTrees.some(q=>Math.hypot(q[0]-x,q[1]-z)<5))continue;const slope=Math.max(Math.abs((surface.height(x+1,z)??y)-y),Math.abs((surface.height(x,z+1)??y)-y));if(slope>2.2)continue;const h=3.3+rnd()*1.8;b.cylinder([x,y-.08,z],[x,y+h,z],.16,'#766246',8);for(let j=0;j<3;j++){const a=rnd()*Math.PI*2,r=.7+rnd()*.45;leaf(x+Math.cos(a)*.55,y+h-.35+j*.3,z+Math.sin(a)*.55,r,j%2?'#7b996b':'#66865d');}mountainTrees.push([x,z]);}counts.mountainTrees=mountainTrees.length;
 // Sparse rest points follow existing roads but never occupy their walking surface.
 for(const r of routes.filter(r=>r.status==='connected'&&['library-lighthouse','base-shrine','market-base'].includes(r.id))){for(let i=70;i<r.points.length-1&&counts.rest<9;i+=190){const a=r.points[i-1],c=r.points[i+1],dx=c[0]-a[0],dz=c[1]-a[1],len=Math.hypot(dx,dz)||1,off=r.width/2+3,x=r.points[i][0]-dz/len*off,z=r.points[i][1]+dx/len*off,y=valid(x,z,1.2);if(y===undefined)continue;b.box([x,y+.43,z],[1.8,.14,.55],'#a1825e',-Math.atan2(dz,dx));b.box([x,y+.72,z-.2],[1.8,.45,.1],'#8a6b4c',-Math.atan2(dz,dx));plant(x+1.5,y,z+.8,counts.rest);counts.rest++;}}
 const campus=p.terrain.campus;if(campus){const [cx,cz]=campus.center;for(const i of [3,5,11,13,19,21,27,29]){const a=i*Math.PI/16,x=cx+Math.cos(a)*(campus.radius-4),z=cz+Math.sin(a)*(campus.radius-4);if(Math.abs(z-campus.center[1])<3&&x>cx)continue;const y=surface.height(x,z);if(y===undefined)continue;leaf(x,y,z,.65,i%2?'#809b70':'#668a62');for(let j=0;j<3;j++)b.ball([x+Math.cos(a+j*2.1)*.55,y+.42,z+Math.sin(a+j*2.1)*.55],[.13,.14,.13],j%2?'#ebc9be':'#f1e6c9');counts.campus++;}}
 // Preserve a clear north-south opening through the cave while adding small woodland groups around it.
 const cave=p.objects.find(o=>o.id==='layout_island_cave');if(cave){const cx=cave.position[0],cz=cave.position[2];
  for(let i=0;i<120&&counts.caveRoots.length<12;i++){const a=i*2.399963,r=8+(i%6)*1.7,x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r;if(Math.abs(x-cx)<3.8)continue;
   const y=valid(x,z,3.5);if(y===undefined||counts.caveRoots.some(q=>Math.hypot(q[0]-x,q[2]-z)<4.2))continue;
   if(Math.max(Math.abs((surface.height(x+1,z)??y)-y),Math.abs((surface.height(x,z+1)??y)-y))>.7)continue;
   const h=4.8+(i%4)*.35;b.emit('life:cave-trunk',()=>new T.CylinderGeometry(.72,1,1,8),'#766246',[x,y+h*.32,z],[.2,h*.64,.2]);
   for(let k=0;k<3;k++)b.emit('life:cave-canopy',crownGeometry,k%2?'#76936a':'#63815c',[x+Math.cos(a+k*2.1)*.45,y+h*.72+k*.32,z+Math.sin(a+k*2.1)*.45],[1.4,1.25,1.4]);
   counts.caveRoots.push([x,y,z]);
  }counts.caveTrees=counts.caveRoots.length;
 }
 return counts;
}
