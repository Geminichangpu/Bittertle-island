import * as T from 'three';
import type {IslandObject,Point,Project} from '../data/model';
import {transformMatrix} from '../terrain/placement';
import {coastDistance,isLand,mainCoast,sampleHeight} from '../terrain/terrain';
import {roadDistance,type Obstacle,type Route} from './paths';
import {at,Craft,type Site} from './settlement-craft';
import type {TerrainSurface} from './surface';

const stone=['#a6a392','#8e9183','#aaa692','#98998b','#b4ae99','#8d9288'];
const cedar='#91775c', oldWood='#685d4e', silverWood='#aa9980', hemp='#afa183';
const glassGreen='#729891', slate='#677e81';
type Anchor=Site&{halfWidth:number;halfDepth:number};

function salt(id:string){
  let n=37;
  for(let i=0;i<id.length;i++)n=(Math.imul(n,31)+id.charCodeAt(i))>>>0;
  return n%997;
}

function noise(key:number){
  let n=Math.imul(key^0x9e3779b9,0x85ebca6b);
  n=Math.imul(n^(n>>>13),0xc2b2ae35);
  return ((n^(n>>>16))>>>0)/4294967296;
}

function frame(p:Project,o:IslandObject):Anchor {
  const matrix=transformMatrix(o), parent=p.groups?.find(g=>g.id===o.parentId);
  if(parent)matrix.premultiply(transformMatrix(parent));
  const e=matrix.elements;
  return {x:e[12],y:e[13],z:e[14],yaw:Math.atan2(e[8],e[10]),
    halfWidth:o.params.width*Math.hypot(e[0],e[1],e[2])/2,
    halfDepth:o.params.depth*Math.hypot(e[8],e[9],e[10])/2};
}

function nearestPoint(x:number,z:number,points:Point[],closed=false){
  let best=Infinity, px=x,pz=z;
  for(let i=1;i<points.length+(closed?1:0);i++){
    const a=points[i-1], b=points[i%points.length];
    const dx=b[0]-a[0], dz=b[1]-a[1];
    const t=T.MathUtils.clamp(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1),0,1);
    const qx=a[0]+t*dx,qz=a[1]+t*dz, dist=(x-qx)**2+(z-qz)**2;
    if(dist<best){best=dist;px=qx;pz=qz;}
  }
  return {x:px,z:pz,distance:Math.sqrt(best)};
}

class Ground {
  readonly clearings:[number,number,number][]=[];
  private readonly roadCache=new Map<string,number>();
  constructor(readonly p:Project,private surface:TerrainSurface,readonly roads:Route[],private obstacles:Obstacle[]){}

  height(x:number,z:number){
    if(!isLand(this.p.terrain,x,z))return;
    return this.surface.height(x,z)??sampleHeight(this.p.terrain,x,z);
  }
  roadGap(x:number,z:number){
    const ix=Math.round(x*4),iz=Math.round(z*4),key=ix+','+iz;
    let gap=this.roadCache.get(key);
    if(gap===undefined){gap=roadDistance(this.roads,ix/4,iz/4);this.roadCache.set(key,gap);}
    return gap;
  }
  free(x:number,z:number,r:number,owner:string){
    if(this.roadGap(x,z)<r+.19||this.height(x,z)===undefined)return false;
    if(this.clearings.some(([a,b,s])=>(a-x)**2+(b-z)**2<(s+r)**2))return false;
    return !this.obstacles.some(({id,box})=>id!==owner&&x>box.min.x-r&&x<box.max.x+r&&z>box.min.z-r&&z<box.max.z+r);
  }
  site(x:number,z:number,yaw:number,w:number,d:number,owner:string,tolerance=.55){
    const y=this.height(x,z);
    if(y===undefined)return;
    const s={x,y,z,yaw}, heights=[y];
    for(const [u,v] of [[-.5,-.5],[0,-.5],[.5,-.5],[-.5,0],[0,0],[.5,0],[-.5,.5],[0,.5],[.5,.5]]){
      const q=at(s,u*w,0,v*d);
      if(!this.free(q.x,q.z,.12,owner))return;
      heights.push(this.height(q.x,q.z)!);
    }
    if(Math.max(...heights)-Math.min(...heights)>tolerance)return;
    return s;
  }
}

function inlaidSteps(g:Ground,kit:Craft,s:Anchor,owner:string,seed:number){
  const start=at(s,0,0,s.halfDepth+.42), nearest=g.roads
    .map(r=>({...nearestPoint(start.x,start.z,r.points),width:r.width}))
    .sort((a,b)=>(a.distance-a.width/2)-(b.distance-b.width/2))[0];
  if(!nearest||nearest.distance<.01)return;
  const span=nearest.distance-nearest.width/2-.36;
  if(span<1.2||span>9)return;
  const dx=(nearest.x-start.x)/nearest.distance,dz=(nearest.z-start.z)/nearest.distance;
  if(dx*Math.sin(s.yaw)+dz*Math.cos(s.yaw)<.05)return;
  const length=Math.max(2,Math.ceil(span/.92)),yaw=Math.atan2(dx,dz);
  for(let j=0;j<length;j++){
    const t=(j+.5)/length, bend=Math.sin(t*Math.PI)*.27;
    const x=start.x+dx*span*t+dz*bend,z=start.z+dz*span*t-dx*bend;
    if(!g.free(x,z,.35,owner))continue;
    const yy=g.height(x,z)!, left=g.height(x-.56*dz,z+.56*dx), right=g.height(x+.56*dz,z-.56*dx);
    if(left===undefined||right===undefined||Math.max(yy,left,right)-Math.min(yy,left,right)>.29)continue;
    const turn=yaw+(noise(seed+j)-.5)*.18;
    kit.add('flagstone',new T.Vector3(x,Math.max(yy,left,right)+.022,z),[1.08+.25*noise(seed+31*j),.14,.56+.12*noise(j+41)],stone[(seed+j*3)%stone.length],turn);
  }
}

function wall(g:Ground,kit:Craft,start:T.Vector3,end:T.Vector3,owner:string,seed:number,courses=2){
  const dx=end.x-start.x,dz=end.z-start.z,length=Math.hypot(dx,dz);
  if(length<1)return;
  const nx=-dz/length,nz=dx/length, yaw=-Math.atan2(dz,dx);
  for(let row=0;row<courses;row++){
    let distance=0,index=0;
    while(distance<length-.19){
      const n=seed+index*31+row*211;
      let width=.74+.42*noise(n);
      if(row%2&&index===0)width*=.55;
      width=Math.min(width,length-distance);
      const middle=distance+width/2,t=middle/length, across=.13*Math.sin(Math.PI*t)+.037*row;
      const x=start.x+dx*t+nx*across,z=start.z+dz*t+nz*across;
      if(g.free(x,z,.27,owner)){
        const ax=dx/length*width*.43,az=dz/length*width*.43;
        const left=g.height(x-ax,z-az),right=g.height(x+ax,z+az);
        if(left!==undefined&&right!==undefined&&Math.abs(left-right)<.54){
          const low=Math.min(left,right),high=Math.max(left,right);
          const base=row===0?low-.14:(low+high)*.5-.07+row*.28;
          const top=(low+high)*.5+.255+row*.28+.03*noise(n+83);
          kit.add('stone',new T.Vector3(x,(base+top)/2,z),[width+.045,top-base,.69+.09*noise(n+93)-row*.065],
            stone[Math.floor(noise(n+29)*stone.length)],yaw+(noise(n+5)-.5)*.075);
        }
      }
      distance+=width;index++;
    }
  }
}

function hydrangea(kit:Craft,x:number,y:number,z:number,seed:number,bloom:boolean){
  const greens=['#608064','#6e926b','#779572','#537760'];
  for(let i=0;i<3;i++){
    const a=i*2.39996+seed,r=i*.16,xx=x+Math.cos(a)*r,zz=z+Math.sin(a)*r;
    const size=.60+.2*noise(seed+i);
    kit.add('leaves',new T.Vector3(xx,y+.025+i*.045,zz),[size,.76, size],greens[(seed+i)%greens.length],a);
  }
  if(bloom)for(let i=0;i<4;i++){
    const a=seed+i*2.4,r=.11+.28*noise(seed+17*i);
    const x1=x+Math.cos(a)*r,z1=z+Math.sin(a)*r;
    kit.add('flowers',new T.Vector3(x1,y+.49+.12*noise(seed+3*i),z1),[.34,.42,.34],['#a6b5be','#b9b3c4','#c9c9b0'][(i+seed)%3],a);
  }
}

function laundry(g:Ground,kit:Craft,s:Site){
  const n=1.20;
  for(const x of [-n,n]){
    const p=at(s,x,0,0);p.y=g.height(p.x,p.z)??s.y;
    kit.add('stone',p.clone().add(new T.Vector3(0,.09,0)),[.39,.27,.39],stone[0],s.yaw+.12);
    kit.beam(p,at(s,x,1.64,.02),.048,silverWood,true);
  }
  kit.cord(at(s,-n,1.60,0),at(s,n,1.60,0),.077,.015,hemp);
  const laundryColors=['#cfdbd0','#98afb7','#dbc6ad'];
  for(let i=0;i<3;i++){
    const x=-.70+i*.68;
    const y=1.60-.077*(1-(x/n)**2);
    kit.add('cloth',at(s,x,y-.015,0),[i===2?.41:.51,i===1?.78:.63,1],laundryColors[i],s.yaw);
    for(const sign of [-1,1])kit.add('timber',at(s,x+sign*.16,y+.014,0),[.027,.07,.038],cedar,s.yaw);
  }
}

function cottageGarden(g:Ground,kit:Craft,o:IslandObject,s:Anchor){
  const seed=salt(o.id);
  if(s.halfWidth<1.5||s.halfDepth<1.45)return;
  inlaidSteps(g,kit,s,o.id,seed);
  const length=Math.min(5.3,s.halfDepth*1.55), preferred=seed%2?1:-1;
  for(const extra of [1.45,2.4,3.25])for(const side of [preferred,-preferred]){
    const cent=at(s,side*(s.halfWidth+extra),0,-.08*s.halfDepth);
    const garden=g.site(cent.x,cent.z,s.yaw,1.6,length,o.id,.62);
    if(!garden)continue;
    const a=at(garden,side*.56,0,-length/2),b=at(garden,side*.56,0,length/2);
    wall(g,kit,a,b,o.id,seed,seed%3===1?1:2);
    for(let j=0;j<3;j++){
      const q=at(garden,-side*(.22+.10*j),0,-length*.36+j*length*.30);
      const y=g.height(q.x,q.z);
      if(y!==undefined)hydrangea(kit,q.x,y,q.z,seed+j,seed%4!==2&&j!==1);
    }
    if(seed%3===0&&length>3.6){
      const q=at(garden,-side*.36,0,.17*length);
      laundry(g,kit,{x:q.x,y:g.height(q.x,q.z)??garden.y,z:q.z,yaw:s.yaw+Math.PI/2});
    }
    g.clearings.push([garden.x,garden.z,Math.min(2.35,length*.48)]);
    return;
  }
}

function bridgeBank(g:Ground,kit:Craft,s:Anchor,owner:string){
  // The island end already has the campus's broad sandstone stairs.
  const end=s.halfWidth, width=Math.min(3.0,s.halfDepth);
  for(const side of [-1,1]){
    const a=at(s,end-.28,0,side*(width+.48)),b=at(s,end+4.4,0,side*(width+1.10));
    wall(g,kit,a,b,owner,71+(side+1)*29);
    const q=at(s,end+1.2,0,side*(width+2.15));
    if(g.free(q.x,q.z,.8,owner))hydrangea(kit,q.x,g.height(q.x,q.z)!,q.z,703+side,false);
  }
}

function fishingShed(g:Ground,kit:Craft,s:Site){
  const p=(x:number,y:number,z:number)=>at(s,x,y,z);
  for(const x of [-1.63,1.63])for(const z of [-.73,.73]){
    const bottom=p(x,0,z);bottom.y=(g.height(bottom.x,bottom.z)??s.y)-.13;
    const top=z<0?2.42:2.14;
    kit.beam(bottom,p(x,top,z),.071,cedar,true);
    kit.beam(p(x,top-.42,z),p(x-Math.sign(x)*.39,top-.025,z),.071,oldWood);
  }
  for(const z of [-.73,.73])kit.beam(p(-1.77,z<0?2.40:2.12,z),p(1.77,z<0?2.40:2.12,z),.12,oldWood);
  const pitch=Math.atan2(.28,1.46),rotation=new T.Quaternion().setFromEuler(new T.Euler(pitch,s.yaw,0,'YXZ'));
  kit.add('timber',p(0,2.32,0),[3.92,.09,2.03],slate,rotation);
  for(let i=0;i<=13;i++){
    const x=-1.84+i*(3.68/13);
    kit.beam(p(x,2.548,-.98),p(x,2.17,.98),.021,'#87999a',true);
  }
  // A slack diamond-mesh net hangs below the roof, clear of the approach.
  const cols=12,rows=4;
  const net=(u:number,v:number)=>p((u-.5)*2.84,1.94-.23*Math.sin(Math.PI*u)-.97*v,-.30+.12*Math.sin(u*6.3+v*2.1));
  for(let i=0;i<cols;i++)kit.beam(net(i/cols,0),net((i+1)/cols,0),.023,hemp,true);
  for(let j=0;j<rows;j++)for(let i=0;i<=cols;i++){
    for(const dir of [-1,1])if(i+dir>=0&&i+dir<=cols&&(i+j)%2===0)
      kit.beam(net(i/cols,j/rows),net((i+dir)/cols,(j+1)/rows),.013,'#819486',true);
  }
  for(let i=0;i<6;i++){
    const q=net((i+.5)/6,0);
    kit.add('pole',q,[.061,.14,.061],i%3===0?'#c1926f':'#b7b59c');
  }
  for(const [x,z] of [[-1.02,.15],[-.35,.29]]){
    const q=p(x,0,z);q.y=g.height(q.x,q.z)??s.y;
    kit.add('pole',q.clone().add(new T.Vector3(0,.20,0)),[.25,.36,.25],oldWood);
    for(let i=0;i<7;i++){
      const a=i*2*Math.PI/7;
      kit.beam(p(x+.20*Math.cos(a),q.y-s.y+.035,z+.20*Math.sin(a)),
        p(x+.25*Math.cos(a),q.y-s.y+.37,z+.25*Math.sin(a)),.021,hemp,true);
    }
    const ring=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),Math.PI/2);
    kit.add('ropeRing',q.clone().add(new T.Vector3(0,.36,0)),[.249,.249,.108],hemp,ring);
  }
}

function harbor(g:Ground,kit:Craft,s:Anchor,owner:string){
  const sea=g.p.world.seaLevel;
  const ring=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),Math.PI/2);
  for(const side of [-1,1]){
    const q=at(s,side*Math.min(2.22,s.halfWidth*.9),0,s.halfDepth+1.72);
    if(isLand(g.p.terrain,q.x,q.z))continue;
    const head=new T.Vector3(q.x,sea+1.35,q.z);
    for(const shift of [-.20,.20]){
      const foot=at(s,side*Math.min(2.22,s.halfWidth*.9)+shift,0,s.halfDepth+1.72+shift);
      foot.y=sea-1.35;
      kit.beam(foot,head.clone().add(new T.Vector3(shift*.24,shift*.4,0)),.107,oldWood,true);
    }
    for(const h of [.91,1.025,1.14])kit.add('ropeRing',new T.Vector3(q.x,sea+h,q.z),[.205,.205,.13],hemp,ring);
    const tie=at(s,side*s.halfWidth*.8,.98,s.halfDepth*.86);
    kit.cord(tie,new T.Vector3(q.x,sea+1.03,q.z),.24,.030,hemp);
  }
  for(const z of [-s.halfDepth*.82,-s.halfDepth*1.28,-s.halfDepth*1.8])for(const offset of [2.65,4,6,7.6,9.4])for(const side of [1,-1]){
    const q=at(s,side*(s.halfWidth+offset),0,z),shed=g.site(q.x,q.z,s.yaw,4.15,2.28,owner);
    if(!shed||coastDistance(g.p.terrain,[shed.x,shed.z])<1.7)continue;
    fishingShed(g,kit,shed);g.clearings.push([shed.x,shed.z,2.45]);return;
  }
}

function shelter(g:Ground,kit:Craft,site:Site){
  const levels:number[]=[];
  for(const x of [-1.88,0,1.88])for(const z of [-1.2,0,1.2]){
    const q=at(site,x,0,z);levels.push(g.height(q.x,q.z)??site.y);
  }
  const high=Math.max(...levels), slope=high-Math.min(...levels);
  const deck=slope>.27;
  const s=deck?{...site,y:high+.10}:site;
  const p=(x:number,y:number,z:number)=>at(s,x,y,z);
  const eaves=2.37;
  for(const x of [-1.63,1.63])for(const z of [-1.02,1.02]){
    const base=p(x,0,z);base.y=g.height(base.x,base.z)??s.y;
    kit.add('stone',base.clone().add(new T.Vector3(0,.09,0)),[.40,.33,.40],stone[3],s.yaw+.08);
    kit.beam(base.clone().add(new T.Vector3(0,.11,0)),p(x,eaves,z),.139,cedar);
    kit.beam(p(x,1.91,z),p(x-Math.sign(x)*.44,2.33,z),.085,oldWood);
    kit.beam(p(x,1.98,z),p(x,2.32,z-Math.sign(z)*.34),.073,oldWood);
  }
  if(deck){
    // The raised timber floor meets the uphill side; its shorter and longer feet
    // are individually grounded without cutting a flat shelf into the headland.
    for(let i=0;i<12;i++)
      kit.add('timber',p(0,-.042,(i-5.5)*.205),[3.78,.087,.196],i%3?cedar:silverWood,s.yaw);
    for(const x of [-1.63,1.63])kit.add('timber',p(x,-.17,0),[.14,.18,2.48],oldWood,s.yaw);
    for(const z of [-1.16,1.16])kit.add('timber',p(0,-.15,z),[3.77,.18,.14],cedar,s.yaw);
  }
  for(const side of [-1,1]){
    kit.beam(p(-1.83,eaves,side*1.02),p(1.83,eaves,side*1.02),.15,oldWood);
    kit.beam(p(side*1.63,eaves,-1.19),p(side*1.63,eaves,1.19),.15,oldWood);
  }
  kit.add('timber',p(0,2.43,0),[4.28,.12,2.96],silverWood,s.yaw);
  kit.add('hipRoof',p(0,2.49,0),[4.37,.91,3.06],slate,s.yaw);
  kit.beam(p(-1.07,3.423,0),p(1.07,3.423,0),.079,glassGreen,true);
  for(const x of [-1,1])for(const z of [-1,1]){
    kit.beam(p(x*1.01,3.408,0),p(x*2.19,2.52,z*1.53),.057,glassGreen,true);
  }
  for(const x of [-1.03,1.03]){
    const q=p(x,0,-.54);q.y=g.height(q.x,q.z)??s.y;
    kit.beam(q,p(x,.47,-.54),.16,oldWood);
  }
  for(const z of [-.78,-.55,-.32])kit.add('timber',p(0,.48,z),[2.89,.09,.20],cedar,s.yaw);
  for(const x of [-1.11,1.11])kit.beam(p(x,.42,-.77),p(x,.96,-.88),.078,oldWood);
  kit.add('timber',p(0,.86,-.85),[2.80,.16,.081],silverWood,s.yaw);
}

function lighthouseRest(g:Ground,kit:Craft,s:Anchor,owner:string){
  const outline=mainCoast(g.p.terrain), candidates:{x:number;z:number;yaw:number;score:number}[]=[];
  const radii=[10.7,13.6,16,19,22,25,28];
  for(const [j,r] of radii.entries())for(let i=0;i<28;i++){
    const a=i*Math.PI/14+.22+(j%2)*.065,x=s.x+Math.cos(a)*r,z=s.z+Math.sin(a)*r;
    if(!isLand(g.p.terrain,x,z))continue;
    const coast=nearestPoint(x,z,outline,true),road=g.roadGap(x,z);
    if(coast.distance<3.7||coast.distance>19||road<1.6)continue;
    candidates.push({x,z,yaw:Math.atan2(coast.x-x,coast.z-z),
      score:Math.abs(coast.distance-7.8)+Math.min(20,Math.abs(road-5.5))*.62+r*.09});
  }
  candidates.sort((a,b)=>a.score-b.score);
  for(const tolerance of [.64,1.02])for(const q of candidates){
    const site=g.site(q.x,q.z,q.yaw,4.55,3.22,owner,tolerance);
    if(!site)continue;
    shelter(g,kit,site);
    g.clearings.push([site.x,site.z,2.85]);return;
  }
}

/** Derived, disposable exterior details. No edits to the saved layout or walk meshes. */
export function makeSettlementLife(p:Project,surface:TerrainSurface,routes:Route[],obstacles:Obstacle[]){
  const g=new Ground(p,surface,routes.filter(r=>r.status==='connected'),obstacles),kit=new Craft();
  const harborClearings:[number,number,number][]=[];
  const sites=new Set(['layout_island_pier','island_bridge','layout_lighthouse','layout_island_house','layout_island_restaurant']);
  for(const o of p.objects){
    if(!sites.has(o.templateId))continue;
    const s=frame(p,o);
    if(!o.snapToGround&&o.templateId!=='island_bridge'&&Math.abs(s.y-(g.height(s.x,s.z)??s.y))>2.8)continue;
    if(o.templateId==='layout_island_pier'){
      harbor(g,kit,s,o.id);
      const depth=Math.min(6,s.halfDepth),width=Math.min(2.5,s.halfWidth);
      // A working apron and a narrower gap through the landward trees reveal the dock.
      const apron=at(s,.6*width,0,-.8*depth),approach=at(s,4.15*width,0,-2.35*depth);
      for(const [q,r] of [[apron,7.2],[approach,5.8]] as const){
        if(g.height(q.x,q.z)!==undefined)harborClearings.push([q.x,q.z,r]);
      }
    }
    else if(o.templateId==='island_bridge')bridgeBank(g,kit,s,o.id);
    else if(o.templateId==='layout_lighthouse')lighthouseRest(g,kit,s,o.id);
    else cottageGarden(g,kit,o,s);
  }
  const root=kit.finish();root.userData.clearings=[...g.clearings,...harborClearings];
  return root;
}
