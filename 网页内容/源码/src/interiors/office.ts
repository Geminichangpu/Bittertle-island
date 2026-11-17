import {stylizedMaterials} from './stylized-materials';
import {stationery,teaService} from './furnishing-details';
import {dressShelf} from './shelf-details';
import * as T from 'three';
import {Builder,type Cache} from '../generators/shrine';
import type {IslandObject} from '../data/model';
import {officeDimensions} from './registry';
import type {RoomView} from './room-kit';

/** A separately owned room. Its normalized plan follows the exterior's two window walls. */
export function makeOffice(o:IslandObject){
 const profile=stylizedMaterials({'#937047':'#a58b68','#513c29':'#65503b','#b08a59':'#c1a17a','#b18d60':'#b8a080','#be9a6b':'#c2ac8b','#a98355':'#ad9472'});
 const geos=new Map<string,T.BufferGeometry>(),mats=new Map<string,T.MeshStandardMaterial>();
 const cache:Cache={geo:(k,f)=>{if(!geos.has(k))geos.set(k,f());return geos.get(k)!;},mat:(c,role)=>{const k=c+(role||'');if(!mats.has(k)){const m=new T.MeshStandardMaterial({color:c,roughness:.7,emissive:role?c:0,emissiveIntensity:0});profile.configure(m,c,role);mats.set(k,m);}return mats.get(k)!;},sign:()=>new T.MeshStandardMaterial()};
 const root=new T.Group(),{width:w,depth:d,height:h}=officeDimensions(o),sx=w/9,sz=d/12,sy=h/5;
 const wood='#937047',dark='#513c29',edge='#b08a59',paper='#e3dcc5';
 const b=new Builder(cache),shell=new Builder(cache),ceiling=new Builder(cache);
 b.box([0,-.2,0],[9,.2,12],dark);
 shell.box([0,2.5,-6.1],[9,5,.1],dark);shell.box([4.6,2.5,0],[.1,5,12],dark);
 ceiling.box([0,5.18,0],[9,.1,12],dark);
 // Plank floors and seams; deterministic small grain strokes, not runtime textures.
 for(let x=-4.5;x<4.5;x+=.3)for(let z=-6;z<6;z+=2){const c=['#b18d60','#be9a6b','#a98355'][Math.abs(Math.round(x*10+z))%3];b.box([x+.145,-.08,z+.995],[.288,.16,1.985],c);}
 // Rear wall and right wall. Front wall has the exterior's smaller side window.
 for(let x=-4.5;x<4.5;x+=.3)shell.box([x+.15,2.5,-6],[.29,5,.16],wood);
 for(let z=-6;z<6;z+=.3)shell.box([4.5,2.5,z+.15],[.16,5,.29],wood);
 // Desk-facing wall: timber cladding surrounding a normal hinged wooden door.
 const doorWidth=1.8,doorHeight=3.5;
 for(const x of [-2.7,2.7])shell.box([x,2.5,6.1],[3.6,5,.12],dark);
 shell.box([0,4.25,6.1],[1.8,1.5,.12],dark);
 for(let x=-4.5;x<4.5;x+=.3){const xx=x+.15;if(Math.abs(xx)>doorWidth/2)shell.box([xx,2.5,6],[.288,5,.16],wood);else shell.box([xx,(5+doorHeight)/2,6],[.288,5-doorHeight,.16],wood);}
 for(const x of [-1.02,1.02])b.box([x,1.83,5.84],[.16,3.66,.24],dark);b.box([0,3.62,5.84],[2.2,.18,.24],dark);
 // Door leaf, raised timber panels, hinges and handle face into the room (-Z).
 b.box([0,1.76,5.91],[1.77,3.47,.12],wood);
 for(const y of [.85,2.48]){b.box([0,y,5.825],[1.45,1.27,.07],edge);b.box([0,y,5.78],[1.24,1.06,.035],wood);}
 for(const y of [.45,3.06])b.box([-.86,y,5.79],[.09,.22,.06],'#6a6558');
 b.box([.67,1.62,5.77],[.1,.28,.05],'#a79d84');b.cylinder([.67,1.68,5.68],[.42,1.68,5.68],.035,'#76776d');b.box([0,.025,5.85],[1.9,.055,.35],edge);
 // Four floor-height shoji leaves on two tracks, with paper, lower timber panels and recessed pulls.
 for(const z of [-5.15,5.15])shell.box([-4.5,2.5,z],[.16,5,1.7],wood);
 shell.box([-4.5,4.6,0],[.16,.8,8.6],wood);
 const glass=new T.MeshStandardMaterial({color:paper,roughness:.95,emissive:paper,emissiveIntensity:.18,side:T.DoubleSide});
 const windows=new T.Group();windows.name='office-shoji';
 for(let i=0;i<4;i++){const z=-3.15+i*2.1,x=-4.4+(i%2)*.065,width=2.1,height=3.45,y=2.425;
  const pane=new T.Mesh(new T.PlaneGeometry(width-.18,height-.1),glass);pane.name='shoji-paper-'+i;pane.position.set(x,y,z);pane.rotation.y=Math.PI/2;windows.add(pane);
  b.scoped([x,0,z],Math.PI/2,()=>{for(const xx of [-width/2,width/2])b.box([xx,2.13,.03],[.12,4.12,.15],edge);for(const yy of [.13,.7,4.18])b.box([0,yy,.03],[width+.08,.12,.16],edge);
   b.box([0,.4,.035],[width-.15,.47,.09],wood);
   for(let xx=-width/2+.42;xx<width/2;xx+=.42)b.box([xx,2.43,.065],[.035,3.38,.065],edge);
   for(let yy=1.2;yy<4.1;yy+=.56)b.box([0,yy,.065],[width-.12,.035,.065],edge);
   b.box([width/2-.12,1.75,.12],[.065,.22,.035],dark);
  });
 }
 for(const y of [.045,4.3]){b.box([-4.38,y,0],[.32,.09,8.65],dark);for(const x of [-4.47,-4.33])b.box([x,y+.055,0],[.025,.025,8.6],edge);}
 // Wall posts, skirting and exposed ceiling beams.
 for(const x of [-4.35,4.35])for(const z of [-5.85,5.85])b.box([x,2.5,z],[.22,5,.22],dark);
 for(const y of [.14,4.7]){b.box([0,y,-5.85],[9,.22,.18],dark);b.box([4.35,y,0],[.18,.22,12],dark);b.box([-4.35,y,0],[.18,.22,12],dark);}
 for(let z=-6;z<6;z+=.3)ceiling.box([0,5.05,z+.15],[9,.15,.29],wood);
 for(const z of [-5,-1,3])ceiling.box([0,4.9,z],[9,.22,.24],dark);
 // Rear fitted bookcase: lower cabinets, working counter and four open bays.
 b.box([.1,1.55,-5.28],[7.8,.16,1.25],edge);
 for(let i=0;i<4;i++){const x=-2.85+i*1.95;
  b.box([x,.75,-5.45],[1.8,1.5,.9],wood);b.box([x,.72,-4.97],[1.6,1.18,.08],edge);
  b.box([x,.72,-4.91],[1.4,.98,.04],wood);b.cylinder([x-.17,1.25,-4.87],[x+.17,1.25,-4.87],.025,'#3d3931');
  for(const y of [1.65,2.5,3.35,4.3])b.box([x,y,-5.42],[1.95,.1,1],edge);
  for(const xx of [x-.95,x+.95])b.box([xx,2.95,-5.42],[.13,2.9,1],wood);
  for(let shelf=0;shelf<3;shelf++){if(i===2&&shelf===0)continue;dressShelf(b,x,1.72+shelf*.85,-5.25,1.65,.72,11+i*7+shelf*3,['#d9d4bc','#294651','#486679','#c1b18c','#7e5f4b']);}
 }
 for(const x of [-2.9,2.95]){b.box([x,4.61,-5.38],[.85,.48,.7],'#a29a83');b.box([x,4.87,-5.38],[.91,.06,.75],paper);b.box([x,4.62,-5.02],[.22,.09,.02],dark);}
 b.box([1.15,2.12,-5.01],[.85,.88,.08],dark);b.box([1.15,2.12,-4.96],[.75,.78,.025],paper);
 // Desk with inset panels, drawer and pegged legs; chair behind it.
 b.box([-.4,1.63,.15],[3.5,.17,1.85],edge);
 for(const x of [-1.96,1.16])for(const z of [-.62,.92])b.box([x,.8,z],[.18,1.6,.18],dark);
 b.box([-.4,.86,.94],[3.1,1.25,.12],wood);b.box([-.4,.86,1.015],[2.8,1.04,.03],edge);
 b.box([-.4,.86,1.04],[2.6,.86,.025],wood);
 for(const x of [-1.98,1.18])b.box([x,.86,.15],[.1,1.25,1.65],wood);
 b.box([-.3,1.74,.15],[1.4,.018,.85],paper);
 for(let i=0;i<5;i++)b.box([-.65+i*.17,1.752,.15],[.014,.005,.6], '#849b98');
 b.box([-.3,1.754,.25],[1.2,.005,.014],'#849b98');
 b.scoped([.25,0,-1.7],-.15,()=>{b.box([0,.95,0],[1.05,.14,.95],wood);for(const x of [-.43,.43])for(const z of [-.38,.38])b.beam([x*1.2,.05,z*1.2],[x,.95,z],.1,dark);for(const x of [-.43,.43])b.box([x,1.55,-.39],[.1,1.3,.1],wood);b.box([0,2.12,-.39],[1.05,.2,.14],edge);for(const x of [-.24,0,.24])b.box([x,1.64,-.39],[.05,.75,.05],wood);});
 const plant=(x:number,y:number,z:number,flowers=false)=>{b.cylinder([x,y,z],[x,y+.32,z],.18,paper,16);for(let i=0;i<7;i++){const a=i*2.4,xx=x+Math.sin(a)*.27,zz=z+Math.cos(a)*.22,yy=y+.55+(i%3)*.08;b.cylinder([x,y+.25,z],[xx,yy,zz],.017,'#456849');b.ball([xx,yy-.05,zz],[.14,.08,.1],'#527847');if(flowers)b.ball([xx,yy+.08,zz],[.095,.075,.09],i%2?'#e9b7ba':'#cf7c99');}};
 plant(-1.45,1.73,.15,true);plant(2.45,3.4,-5.2);
 for(const x of [.5,1.85]){b.cylinder([x,1.65,-5.12],[x,1.86,-5.12],.1,'#425f6a',16);for(let i=0;i<4;i++)b.cylinder([x+i*.025-.04,1.8,-5.12],[x+i*.035-.06,2.07,-5.12],.012,dark);}
 // Keep the reference green curtains at the ends of the shoji opening.
 for(const z of [-4.05,4.05])for(let i=0;i<9;i++){const zz=z+(i-4)*.075,tie=z+(i-4)*.035,col=i%2?'#91a16a':'#a7b57d';b.cylinder([-4.13,4.35,zz],[-3.98,1.65,tie],.075,col,8);b.cylinder([-3.98,1.65,tie],[-4.08,.55,zz],.075,col,8);}
 for(const z of [-4.05,4.05])b.box([-3.98,1.65,z],[.12,.16,.75],'#c4bc87');
 b.cylinder([-4.05,4.48,-4.5],[-4.05,4.48,4.5],.045,dark);
 // Ceiling pendant.
 ceiling.cylinder([0,5,0],[0,4.35,0],.025,dark);ceiling.cylinder([0,4.35,0],[0,4.07,0],.35,paper,20);
 const lampMaterial=cache.mat('#fff0c9','lamp');ceiling.litBox([0,4.06,0],[.52,.035,.52],'#fff0c9','lamp');
 // Fine skirting, ceiling moulding and study accessories without moving furniture.
 for(const yy of [.12,4.85]){shell.box([0,yy,-5.84],[8.8,.12,.09],edge);shell.box([4.35,yy,0],[.09,.12,11.8],edge);}
 stationery(b,.68,1.73,.05,.65);teaService(b,-1.35,1.64,-5.05,.55);
 b.box([1.18,.93,-.68],[.12,.85,.04],edge);
 for(const yy of [.5,.88,1.27]){b.box([.72,yy,-.7],[.7,.29,.04],wood);b.cylinder([.61,yy,-.75],[.83,yy,-.75],.022,dark);}
 // Framed botanical print on the side wall: slim frame and asymmetric leaf sprigs.
 b.scoped([4.36,2.8,1.9],-Math.PI/2,()=>{
  b.box([0,0,0],[1.1,1.55,.06],dark);b.box([0,0,.04],[.94,1.39,.025],paper);
  for(let i=0;i<5;i++){const yy=-.48+i*.2;b.beam([0,yy,.065],[.04,yy+.22,.065],.012,'#60745a');b.ball([i%2?.14:-.1,yy+.12,.075],[.15,.045,.008],'#78926f');}
 });
 const furnishings=b.finish(),walls=shell.finish(),lid=ceiling.finish();root.add(furnishings,walls,lid,windows);root.scale.set(sx,sy,sz);
 root.traverse(n=>{if(n instanceof T.Mesh){n.castShadow=true;n.receiveShadow=true;}});windows.traverse(n=>n.castShadow=false);
 const views:RoomView[]=[{id:'reference',label:'参考视角',position:[3.8,3.25,5.3],target:[-.6,2.15,-2.52]},{id:'desk',label:'桌面近景',position:[2.7,2.8,3.3],target:[-.6,2.15,-2.52]},{id:'entrance',label:'木门与隔墙',position:[2.8,2.8,1.7],target:[0,2.15,5.9]},{id:'overview',label:'剖面总览',position:[11,12,14],target:[-.6,2.15,-2.52],cutaway:true}];
 return {root,glass,paperScreens:true,lampMaterial,walls,lid,views:views.map(v=>({...v,position:[v.position[0]*sx,v.position[1]*sy,v.position[2]*sz] as [number,number,number],target:[v.target[0]*sx,v.target[1]*sy,v.target[2]*sz] as [number,number,number]})),dimensions:{w,h,d},dispose(){root.traverse(n=>{if(n instanceof T.InstancedMesh)n.dispose();if(n instanceof T.Mesh&&! (n instanceof T.InstancedMesh))n.geometry.dispose();});geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());glass.dispose();profile.dispose();}};
}

