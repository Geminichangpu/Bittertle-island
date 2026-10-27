import * as T from 'three';
import type {IslandObject} from '../data/model';
import {roomKit,palette as p,type RoomView} from './room-kit';
import {teaService,stationery} from './furnishing-details';
import {bedroomKit} from './bedroom-kit';

export function makeBedroom(o:IslandObject){
 const k=bedroomKit(),{b}=k,w=Number(o.params.width)||13,d=Number(o.params.depth)||11,h=Number(o.params.wallHeight)||5;
 // Author locally, then reflect Z for the reference's reverse-L plan orientation. Door in short recess,
 // desk on the adjacent x=-6.5 wall, bed head on x=.26, window at the long wing end.
 k.floor(0,-2.53,13,5.94);k.floor(3.38,2.97,6.24,5.06);
 k.wall(0,-5.5,13,5,0,0,true);k.wall(-6.5,-2.53,5.94,5,0,Math.PI/2,true);k.wall(6.5,0,11,5,0,-Math.PI/2,true);
 k.wall(.73,5.5,.94,5,0,Math.PI,true);k.wall(6.02,5.5,.96,5,0,Math.PI,true);
 k.wall(3.38,5.5,4.36,1.35,0,Math.PI,true);k.wall(3.38,5.5,4.36,.65,4.35,Math.PI,true);k.glass.transparent=true;k.glass.opacity=.18;k.glass.depthWrite=false;
 b.emit('bedroom:glass',()=>new T.BoxGeometry(1,1,1),'window',[3.38,2.85,5.38],[4.36,3,.035],new T.Quaternion(),k.glass);
 for(const x of [1.2,3.38,5.56])b.box([x,2.85,5.28],[.13,3.12,.18],p.wood);
 for(const y of [1.35,3.62,4.35])b.box([3.38,y,5.28],[4.55,.14,.2],p.wood);
 b.box([3.38,1.25,5.16],[4.7,.16,.42],p.trim);
 for(const x of [3.18,3.58]){b.box([x,2.45,5.14],[.055,.27,.07],'#b5aaa0');b.cylinder([x,2.37,5.07],[x,2.56,5.07],.027,'#8a897b');}
 for(let i=0;i<8;i++)k.outside.ball([.4+i*.83,.9+Math.sin(i)*.4,7.2],[.75,.8,.45],i%2?'#779b56':'#95b96a');
 for(const [x,y] of [[1.5,4.4],[4.5,4.1],[3.5,5.6]]){k.outside.ball([x,y,9],[.62,.2,.2],'#f7faf3');k.outside.ball([x+.4,y+.14,9],[.4,.25,.2],'#f7faf3');}
 k.wall(-4.55,.44,3.9,5,0,Math.PI,true);k.wall(-.42,.44,1.34,5,0,Math.PI,true);k.wall(-1.82,.44,1.5,1.7,3.3,Math.PI,true);k.wall(.26,2.97,5.06,5,0,Math.PI/2,true);
 for(const x of [-2.65,-1.05])b.box([x,1.66,.44],[.1,3.32,.2],p.dark);
 b.box([-1.85,3.29,.44],[1.7,.1,.2],p.trim);
 b.scoped([-2.57,0,.44],-Math.PI*.42,()=>{
  b.box([.7,1.65,0],[1.38,3.22,.12],p.wood);
  for(const y of [.25,3.05])b.box([.7,y,-.08],[1.26,.1,.07],p.trim);
  for(const side of [-1,1]){
   b.box([1.18,1.6,side*.075],[.1,.25,.035],'#9a9d96');
   b.cylinder([1.18,1.64,side*.09],[1.18,1.64,side*.18],.03,'#9a9d96');
   b.cylinder([1.18,1.64,side*.18],[.98,1.64,side*.18],.035,'#9a9d96');
  }
  for(const y of [.35,2.85])b.cylinder([.015,y-.09,0],[.015,y+.09,0],.045,'#9a9d96');
 });
 k.roof(0,-2.53,13,5.94,5);k.roof(3.38,2.97,6.24,5.06,5);
 // Study rotated onto the adjacent wall indicated by the reference arrow.
 b.scoped([-5.55,0,-2.55],Math.PI/2,()=>{k.desk(0,0,0,4.1,1.3);k.shelf(0,1.7,-.64,4.1,2.95);k.plant(1.45,1.6,.12);b.box([-1.4,.45,0],[.8,.7,.7],'#b0a58c');});b.scoped([-4,0,-2.55],-Math.PI/2,()=>k.chair(0,0,0));
 // Bed projects away from the inside long wall towards +X; foot space stays clear at x=6.5.
 b.box([2.98,.55,2.65],[4.7,.3,2.75],p.wood);for(const x of [.76,5.2])for(const zz of [1.42,3.88])b.box([x,.32,zz],[.18,.64,.18],p.dark);
 b.box([2.98,.92,2.65],[4.55,.45,2.65],'#e7dfce');b.box([3.65,1.19,2.65],[3.15,.12,2.68],'#f0e9db');b.box([.54,1.32,2.65],[.16,1.7,2.85],p.trim);
 for(const zz of [2,3.3])b.ball([1.25,1.25,zz],[.46,.15,.6],'#f5eee0');
 b.scoped([.7,0,.9],Math.PI/2,()=>k.shelf(0,0,0,.85,2.7));b.scoped([.7,0,4.72],Math.PI/2,()=>k.shelf(0,0,0,1.25,4.5));
 // Static pleated cloth gathered at the tie, with a clear view through the broad panes.
 for(const cx of [1.42,5.8]){const points:number[]=[],indices:number[]=[],nx=18,ny=24;for(let j=0;j<=ny;j++){const y=.2+j/ny*4.4,spread=.22+.5*(1-Math.exp(-Math.pow((y-1.5)/.7,2)));for(let i=0;i<=nx;i++){const t=i/nx;points.push(cx+(t-.5)*spread,y,5.05+Math.sin(t*Math.PI*10)*.045);}}for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i;indices.push(a,a+1,a+nx+1,a+1,a+nx+2,a+nx+1);}const cloth=k.cache.mat('#efeee7');cloth.side=T.DoubleSide;b.emit('bedroom:curtain:'+cx,()=>{const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(points,3));g.setIndex(indices);g.computeVertexNormals();return g;},'#efeee7',[0,0,0],[1,1,1],new T.Quaternion(),cloth);b.box([cx,1.5,4.99],[.28,.13,.06],'#d5cfbe');}
 b.cylinder([.95,4.63,5.1],[6.2,4.63,5.1],.035,p.dark);
 for(const cx of [1.42,5.8])for(let i=0;i<5;i++)b.emit('bedroom:curtain-ring',()=>new T.TorusGeometry(.06,.012,5,10),'#a58c5c',[cx+(i-2)*.13,4.6,5.1],[1,1,1],new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),Math.PI/2));
 for(const cx of [1.02,6.12])b.box([cx,4.62,5.25],[.12,.12,.28],p.wood);
 // Low storage and a basket use the empty rear corner without blocking circulation.
 b.box([4.6,.72,-4.8],[2.8,1.4,.85],p.wood);b.box([4.6,1.48,-4.8],[2.95,.12,.95],p.trim);
 for(const x of [3.93,5.27])for(const y of [.4,1.02]){b.box([x,y,-4.35],[1.2,.5,.06],p.trim);b.cylinder([x-.13,y,-4.29],[x+.13,y,-4.29],.025,p.dark);}
 k.plant(5.5,1.56,-4.75);b.box([3.8,1.74,-4.7],[.55,.43,.06],p.dark);b.box([3.8,1.74,-4.66],[.44,.32,.015],'#9bb3a0');b.box([4.4,.06,-2.95],[2.9,.045,1.45],'#a09b7d');b.cylinder([5.75,.08,-1.5],[5.75,.6,-1.5],.38,'#a88c60',16);b.ball([5.75,.65,-1.5],[.32,.13,.32],'#e1d7bf');
 k.lantern(2,4.2,-1,.65);for(let i=0;i<7;i++)k.outside.ball([-6+i,.3,4],[.8,.6,.8],i%2?'#6a8c56':'#8ca86a');
 return k.finish({w,h,d},[{id:'reference',label:'卧室全景',position:[6.05,3.2,-3.8],target:[.3,1.9,1]},{id:'bed',label:'床铺与侧窗',position:[5.8,2.7,-.3],target:[1.8,1.8,2.9]},{id:'study',label:'书桌与入口',position:[4,3.1,-2.5],target:[-3,1.9,-1.9]},{id:'desk-detail',label:'书桌细节',position:[-2.9,2.5,-3.25],target:[-5.55,1.9,-2.55]},{id:'shelf-detail',label:'书柜细节',position:[-3.4,3.35,-2.6],target:[-6.05,3.05,-2.55]},{id:'overview',label:'反 L 平面',position:[0,23,-.01],target:[0,0,0],cutaway:true}],[w/13,h/5,-d/11]);
}

export function makeResidence(o:IslandObject){
 const k=roomKit(true),{b}=k,w=Number(o.params.width)||15,d=Number(o.params.depth)||9,h=Number(o.params.wallHeight)||5.3;
 k.floor(0,0,15,9);k.tatami(0,0,14.5,8.6,.04);k.wall(0,-4.5,15,5.3);k.wall(-7.5,0,9,5.3,0,Math.PI/2);k.wall(7.5,0,9,5.3,0,Math.PI/2);k.roof(0,.8,16,11,5.3);
 // Sliding front partitions, with one open bay continuous with the veranda.
 for(const x of [-5.4,-1.8,5.4])k.shoji(x,2.45,4.42,3.4,4.6,0,true);
 for(const x of [-7.4,-3.6,0,3.6,7.4])b.box([x,2.65,4.6],[.18,5.3,.18],p.dark);
 k.floor(0,5.75,15,2.4);for(const x of [-6.8,0,6.8])b.box([x,-.5,5.8],[.22,1,.22],p.dark);
 // A restrained unseen living area, inferred from the tatami and timber structure in the reference.
 b.box([-1,.65,0],[3.6,.14,2.1],p.wood);for(const x of [-2.45,.45])for(const z of [-.8,.8])b.box([x,.3,z],[.14,.6,.14],p.dark);
 for(const z of [-1.8,1.8])b.box([-1,.2,z],[1.6,.2,1.1],'#7d8171');
 b.box([4.6,.4,-2.7],[3.3,.4,2.7],'#d5ceb4');b.box([4.6,.65,-3.45],[1.7,.2,.65],'#e7dec7');
 b.box([-5.7,1,-3.8],[2.7,2,.8],p.wood);for(const x of [-6.35,-5.05])k.shoji(x,1.05,-3.33,1.18,1.7,0,true);
 b.box([.9,2.7,-4.36],[1.4,2.4,.05],'#99845f');b.box([.9,2.7,-4.31],[1.15,2.05,.025],p.paper);k.plant(1.8,0,-3.7);k.lantern(-3,4.25,.8,.7);
 // Finished living-room details stay on the existing furniture footprints.
 teaService(b,-1,.73,0,1.05);
 b.box([4.6,.63,-2],[3.12,.075,1.2],'#7d8171');
 for(const x of [3.2,6])b.box([x,.675,-2],[.045,.015,1.18],'#e7dec7');
 for(const x of [-6.3,-5.1])b.box([x,1.05,-3.21],[.04,.2,.035],p.dark);
 b.box([-5.7,2.06,-3.8],[2.85,.1,.9],p.trim);k.plant(-6.35,2.13,-3.72,true,.6);
 for(let i=0;i<3;i++)b.box([-5.05,2.16+i*.09,-3.7],[.6,.075,.4],i%2?p.paper:'#607c7d');
 // Ink branch on the scroll, rather than an empty rectangular panel.
 for(let i=0;i<6;i++){const yy=1.93+i*.27,xx=.82+Math.sin(i*.8)*.12;b.beam([.82,yy-.2,-4.285],[xx,yy,-4.285],.018,p.dark);for(const side of [-1,1])b.beam([xx,yy,-4.28],[xx+side*.2,yy+.14,-4.28],.014,'#60745a');}
 // Reference veranda details: static wind chime, stepping stones, foliage and stone lantern.
 b.cylinder([-5.2,5.2,5.8],[-5.2,4.65,5.8],.015,p.dark);b.ball([-5.2,4.42,5.8],[.2,.2,.2],'#a2b7b4');b.box([-5.2,3.91,5.8],[.15,.55,.02],'#b6c9b6');
 for(let i=0;i<9;i++)k.outside.ball([-6.4+i*1.6,-.85,8.7],[.64,.14,.52],i%2?'#9a9b8d':'#aab0a0');
 k.outside.box([0,-1.2,11],[22,.35,12],'#45613b');
 for(let i=0;i<23;i++){const a=i*2.4,x=Math.cos(a)*(9+i%3),z=8+Math.sin(a)*4;if(z<7)continue;k.outside.ball([x,-.3,z],[1.2,1,1],i%2?'#365b3d':'#527147');}
 b.cylinder([-5.9,-1,7.6],[-5.9,.3,7.6],.24,'#77796c');b.box([-5.9,.4,7.6],[.9,.2,.9],'#96988a');k.lantern(-5.9,.95,7.6,.8);b.box([-5.9,1.5,7.6],[1.3,.18,1.3],'#74796f');b.ball([-5.9,1.78,7.6],[.65,.3,.65],'#74796f');
 return k.finish({w,h,d},[{id:'reference',label:'缘侧与庭院',position:[-8.7,2.7,11.3],target:[.3,1.9,3.8]},{id:'living',label:'榻榻米起居室',position:[2.4,3.1,3.5],target:[-1,1.7,-1.7]},{id:'garden',label:'庭院回望',position:[3.7,2.5,12],target:[0,2,2.3]},{id:'overview',label:'剖面总览',position:[18,17,21],target:[0,1,1],cutaway:true}],[w/15,h/5.3,d/9]);
}

export function makeFeihua(o:IslandObject){
 const k=roomKit(true),{b}=k,w=Number(o.params.width)||26,d=Number(o.params.depth)||16,h=Number(o.params.wallHeight)||21;
 // User's hall plan: rear (-Z) = room / corridor / room / stair;
 // front (+Z) = entrance on left / open lobby / reception on right.
 // The rear wall encloses the ground floor and upstairs office only.
 // Upstairs x=1.5..13 is an open, railed gallery with no perimeter wall.
 k.floor(0,0,26,16);k.wall(0,-8,26,7);k.wall(-5.75,-8,14.5,7,7);k.wall(13,0,16,7,0,-Math.PI/2);k.wall(0,8,26,7);
 k.wall(-13,-4,8,14,0,Math.PI/2);k.wall(-13,.8,1.6,7,0,Math.PI/2);k.wall(-13,7.2,1.6,7,0,Math.PI/2);k.wall(-13,4,4.8,1.5,5.5,Math.PI/2);
 b.scoped([-12.85,0,4],Math.PI/2,()=>{k.curtain(0,4.9,0,4.6,1.2);for(const xx of [-2.35,2.35])b.box([xx,2.75,0],[.18,5.5,.2],p.dark);});b.box([-11.7,.08,4],[1.5,.07,3.8],p.purple);
 // Rear corridor x=-8..-4, with two small rooms on each side. All doors face this corridor.
 for(const side of [-1,1]){const x=side<0?-8:-4,center=side<0?-10.5:-1.5,angle=side<0?Math.PI/2:-Math.PI/2;
  for(const zz of [-1.8,-5.5]){k.shoji(x-side*.1,2.25,zz,2.5,4.4,angle,true);b.scoped([x-side*.23,0,zz],angle,()=>{k.curtain(0,3.7,0,2.5,1.15);b.beam([-1.45,4.6,0],[0,5.2,0],.13,p.trim);b.beam([0,5.2,0],[1.45,4.6,0],.13,p.trim);});k.tatami(center,zz,4.6,3.2,.05);}
  for(const [zz,len] of [[-.25,.5],[-3.65,1.2],[-7.35,1.3]])k.wall(x,zz,len,7,0,angle);k.wall(x,-4,8,2.4,4.6,angle);
  for(const zz of [0,-3.65])k.wall(center,zz,5,7);
 }
 k.wall(1,-4,8,7,0,Math.PI/2);
 // L-shaped reception at the front-right, with a clear aisle to the stair behind it.
 b.scoped([9,0,4.3],-Math.PI/2,()=>{k.desk(0,0,0,4.7,1.8,true);k.plant(1.7,1.6,0,true);k.lantern(-1.65,2,0,.55);b.ball([0,1.68,.35],[.16,.1,.16],p.gold);});b.box([10.7,1.5,6.55],[3.4,.16,1],p.wood);b.box([7.25,.07,4.3],[1,.08,4.8],p.purple);
 for(const zz of [-1.8,-5.5]){k.lantern(-6,6.1,zz,.7);b.cylinder([-6,7,zz],[-6,6.5,zz],.025,p.dark);}k.lantern(0,6.1,3.7,1);k.plant(11.5,0,7,true,1.5);
 // The right stair arrives at the back landing; the right gallery leads to the front veranda.
 const steps=24;for(let i=0;i<steps;i++){const rise=(i+1)*7/steps,z=1-(i+.5)*7/steps;b.box([7.3,rise/2,z],[3.1,rise,7/steps+.01],p.wood);b.box([7.3,rise+.025,z+.13],[3.15,.04,.08],p.trim);}
 k.railing([5.7,0,1],[5.7,7,-6]);k.railing([8.9,0,1],[8.9,7,-6]);
 k.floor(-5.75,0,14.5,16,7);k.floor(7.25,-7,11.5,2,7);k.floor(10.95,-1,4.1,10,7);k.floor(7.25,6,11.5,4,7);k.floor(3.625,-1,4.25,10,7);
 k.railing([8.95,7,-6],[8.95,7,1]);k.railing([5.7,7,-6],[5.7,7,1]);k.roof(0,0,26,16,14);
 // Restore the open gallery: stair -> rear landing -> side walk -> front veranda -> office.
 // Fill the unused gap beyond the bottom of the stair well as a turning platform.
 k.floor(7.325,2.5,3.15,3,7);
 k.railing([5.7,7,1],[8.95,7,1]);
 // Guard the exposed landing and outer edges; leave the stair arrival at z=-6 open.
 // Rear landing now joins the planted area without an internal railing.
 k.railing([13,7,-7.85],[13,7,7.85]);
 k.railing([1.5,7,-7.85],[13,7,-7.85]);
 k.railing([1.5,7,7.5],[1.5,7,7.85]);
 k.railing([1.5,7,7.85],[13,7,7.85]);
 // Roof posts stand on the veranda perimeter, clear of the walking route.
 for(const x of [2.5,6,10]){b.box([x,10.5,7.85],[.2,7,.2],p.dark);k.lantern(x,12.4,6.5,.75);b.cylinder([x,14,6.5],[x,12.85,6.5],.025,p.dark);}
 // Former small room becomes an open planted area, fully floored to the rear landing.
 // Keep planting beside the office partition and away from the stair and doorway.
 k.plant(2.4,7.05,-4.7,false,1.3);
 k.plant(2.3,7.05,.5,false,.95);
 k.plant(4.3,7.05,2.8,true,.75);
 // Separate the office, with a full-height opening at the end of the veranda.
 k.wall(1.5,-2,12,6.8,7,Math.PI/2);k.wall(1.5,7.75,.5,6.8,7,Math.PI/2);k.wall(1.5,5.75,3.5,2,11.8,Math.PI/2);
 b.scoped([1.64,7,5.75],Math.PI/2,()=>{for(const x of [-1.8,1.8])b.box([x,2.4,0],[.16,4.8,.22],p.dark);b.box([0,4.8,0],[3.9,.22,.22],p.trim);b.beam([-2.05,5.05,0],[0,5.7,0],.16,p.dark);b.beam([0,5.7,0],[2.05,5.05,0],.16,p.dark);k.crest(0,5.25,.08,.22);});
 // The office occupies 14.5 rather than 9 units of the same exterior shell.
 k.wall(-13,0,16,7,7,Math.PI/2);k.wall(-5.75,8,14.5,7,7);k.tatami(-5.75,0,14.1,15.5,7.05);
 k.desk(-5.5,7.18,-4.5,8.7,1.9,true);k.chair(-5.5,7.2,-6,true);k.lantern(-2.3,9.4,-4.4,.75);
 b.box([-5.5,11,-7.77],[8.6,3.5,.12],p.gold);b.box([-5.5,11,-7.68],[8.4,3.3,.08],'#37363e');
 const blossom=(x:number,y:number,z:number,r:number)=>{for(let j=0;j<5;j++){const a=j*Math.PI*2/5;b.ball([x+Math.sin(a)*r*.55,y+Math.cos(a)*r*.55,z],[r*.35,r*.4,.016],p.gold);}b.ball([x,y,z+.014],[r*.13,r*.13,.025],'#ebc96e');};
 for(const x of [-11,.1]){b.box([x,10.8,-7.75],[1.8,4,.08],p.red);for(let j=0;j<8;j++){const yy=9.2+j*.43,xx=x+Math.sin(j*2.3)*.5;b.beam([x,yy-.4,-7.62],[xx,yy,-7.62],.018,p.gold);blossom(xx,yy,-7.6,.23+j%2*.07);}}
 for(const x of [-11.5,-8.9,-6.3,-3.7,-1.1])k.shoji(x,13.1,-7.66,2.35,1.1,0,true);
 for(const cx of [-8.4,-5.5,-2.6]){for(const yy of [7.46,8.48])b.box([cx,yy,-3.42],[2.65,.035,.035],p.gold);for(const xx of [cx-1.32,cx+1.32])b.box([xx,7.97,-3.42],[.035,1.04,.035],p.gold);for(const xx of [cx-1.2,cx+1.2])for(const yy of [7.56,8.38])blossom(xx,yy,-3.39,.07);}
 b.box([-5.5,8.82,-4.4],[2,.07,.68],'#383635');b.box([-8.6,8.91,-4.65],[1.1,.25,.5],p.gold);b.box([-8.6,9.05,-4.65],[1.12,.06,.52],'#6e402d');b.box([-7.4,8.9,-4.55],[.55,.22,.4],p.dark);
 for(let i=0;i<4;i++){const x=-12+i*.9,z=-.5+(i%2)*.18;b.box([x,9.3,z],[.94,4,.08],p.gold,i%2?.22:-.22);b.beam([x-.2,7.4,z+.08],[x+.1,10.9,z+.08],.045,p.dark);for(let j=0;j<9;j++){const xx=x+Math.sin(j*2.4)*.35,yy=8+j*.3;b.beam([x,yy-.2,z+.08],[xx,yy,z+.08],.025,p.dark);b.ball([xx,yy,z+.11],[.08,.06,.02],'#b55a53');}}
 b.box([-11.6,8.4,-5.5],[2.1,.12,1.3],p.wood);b.box([-11.6,7.7,-5.5],[2.1,1.3,1.2],p.paper);k.plant(-11.3,8.5,-5.5,false,1.3);b.ball([-12.2,8.85,-5.5],[.24,.4,.24],p.red);b.box([-12.68,11,-3.5],[.08,2.9,1.25],p.purple);b.box([-12.6,11,-3.5],[.035,2.45,1],p.gold);
 b.box([-6.4,7.85,1.5],[5.6,.16,2.8],'#6e402d');for(const x of [-8.85,-3.95])for(const z of [.35,2.65])b.box([x,7.5,z],[.15,.7,.15],p.dark);
 b.box([-6.4,7.95,1.5],[1.35,.03,2.85],p.purple);for(const z of [-.9,3.9])for(const x of [-8,-4.8]){b.box([x,7.37,z],[2,.25,1.25],p.purple);for(let j=0;j<6;j++)b.ball([x+(j%3-1)*.4,7.51,z+(Math.floor(j/3)-.5)*.4],[.11,.008,.14],p.gold);}
 for(let j=0;j<8;j++)b.ball([-6.4+Math.sin(j*2)*.35,7.976,.35+j*.32],[.15,.008,.1],p.gold);b.box([-6.4,8.01,1.5],[1.3,.07,.65],p.gold);b.cylinder([-6.4,8.06,1.5],[-6.4,8.3,1.5],.18,p.dark);
 b.box([.1,7.8,-4.8],[1.7,1.2,1.3],'#6e402d');for(const yy of [7.45,7.85,8.23]){b.box([.1,yy,-4.12],[1.55,.3,.04],p.wood);b.cylinder([-.08,yy,-4.05],[.28,yy,-4.05],.025,p.gold);}k.lantern(.1,9,-4.8,.85);k.lantern(.4,8.1,3.7,1);
 for(const zz of [-5.8,-3.3,-.8,1.7,4.2])k.shoji(-12.8,13,zz,2.2,1.25,Math.PI/2,true);
 for(const xx of [-11.5,-8.5,-5.5,-2.5,.5])k.ceiling.box([xx,13.75,0],[.12,.2,15.7],p.dark);k.lantern(-5.5,12.65,0,1.65);
 k.outside.box([0,-2,42],[100,.1,55],'#4f9aab');for(let i=0;i<12;i++)k.outside.ball([-18+i*2,-1,26+i*.7],[5,3+i%3,6],i%2?'#4f7657':'#74965c');
 // Small lived-in objects on the reception, writing and tea surfaces.
 b.scoped([9,0,4.3],-Math.PI/2,()=>stationery(b,-.8,1.59,0,.9));
 stationery(b,-4.3,8.77,-4.55,1.05,p.purple);
 teaService(b,-7.8,7.99,1.5,1.15,'#e4dfd2');
 b.box([-3.9,7.99,1.5],[.72,.05,1.35],p.paper);
 for(let i=0;i<4;i++)b.box([-3.9,8.02,1.1+i*.22],[.47,.004,.012],'#9c8a6a');
 const views:RoomView[]=[{id:'reference',label:'一楼大厅',position:[-11.7,3.7,6.5],target:[.2,3.3,-.8]},{id:'corridor',label:'二楼走廊',position:[10.5,9.8,6.4],target:[.5,9.4,5.75]},{id:'office',label:'二楼办公室',position:[-2.8,10.4,6.5],target:[-5.7,9.9,-3.4]},{id:'ground-plan',label:'一楼平面',position:[0,31,.01],target:[0,0,0],cutaway:true,clipHeight:6.8},{id:'overview',label:'楼层总览',position:[30,28,33],target:[0,6,0],cutaway:true}];
 return k.finish({w,h:h*2/3,d},views,[w/26,h/21,d/16]);
}




