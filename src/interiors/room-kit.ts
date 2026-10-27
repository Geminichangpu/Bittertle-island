import {wallPanels} from './furnishing-details';
import {dressShelf} from './shelf-details';
import {stylizedMaterials} from './stylized-materials';
import * as T from 'three';
import {Builder,type Cache} from '../generators/shrine';
export type V=[number,number,number];
export type RoomView={id:string;label:string;position:V;target:V;cutaway?:boolean;clipHeight?:number};
export type InteriorRoom={root:T.Group;paperScreens?:boolean;walls:T.Group;lid:T.Group;glass:T.MeshStandardMaterial;lampMaterial:T.MeshStandardMaterial;dimensions:{w:number;h:number;d:number};views?:RoomView[];scenery?:T.Group;dispose:()=>void};
export const palette={wood:'#916340',dark:'#493126',trim:'#b58b5b',paper:'#e5d9b6',red:'#9e3f30',purple:'#604575',gold:'#c69a47'};

/** Interior-only caches. Dispose on room changes without touching exterior resources. */
export function roomKit(refined=false){
 const profile=refined?stylizedMaterials():undefined;
 const geometries=new Map<string,T.BufferGeometry>(),materials=new Map<string,T.MeshStandardMaterial>();
 const cache:Cache={geo:(k,f)=>{if(!geometries.has(k))geometries.set(k,f());return geometries.get(k)!;},mat:(c,role)=>{const k=c+(role||'');if(!materials.has(k)){const m=new T.MeshStandardMaterial({color:c,roughness:.7,emissive:role?c:0,emissiveIntensity:0});profile?.configure(m,c,role);materials.set(k,m);}return materials.get(k)!;},sign:()=>cache.mat(palette.paper)};
 const b=new Builder(cache),shell=new Builder(cache),ceiling=new Builder(cache),outside=new Builder(cache);
 const glass=cache.mat('#cde3e3','window'),lampMaterial=cache.mat('#ffe1a0','lamp');
 const woodColors=new Set<string>([palette.wood,palette.dark,palette.trim,'#ad8258','#b48a60','#a77d54','#6e402d']);
 function floor(x:number,z:number,w:number,d:number,y=0){b.box([x,y-.14,z],[w,.25,d],palette.dark);const n=Math.ceil(w/.42);for(let i=0;i<n;i++)for(let j=0;j<Math.ceil(d/2.5);j++){const dd=d/Math.ceil(d/2.5);b.box([x-w/2+(i+.5)*w/n,y,z-d/2+(j+.5)*dd],[w/n-.012,.04,dd-.018],['#ad8258','#b48a60','#a77d54'][(i+j)%3]);}}
 function wall(x:number,z:number,w:number,h:number,y=0,angle=0,planks=false){shell.scoped([x,y,z],angle,()=>{shell.box([0,h/2,0],[w,h,.17],planks?palette.wood:palette.paper);if(planks)for(let xx=-w/2;xx<w/2;xx+=.38)shell.box([xx,h/2,.09],[.012,h,.018],palette.trim);for(const yy of [.15,h-.18])shell.box([0,yy,.1],[w,.18,.15],palette.dark);for(let xx=-w/2;xx<=w/2+.01;xx+=w/Math.ceil(w/3))shell.box([xx,h/2,.12],[.16,h,.18],palette.dark);if(refined&&!planks&&h>3)wallPanels(shell,w,h);});}
 function roof(x:number,z:number,w:number,d:number,y:number){ceiling.box([x,y+.1,z],[w,.2,d],palette.wood);for(let zz=z-d/2;zz<z+d/2;zz+=.45)ceiling.box([x,y-.015,zz],[w,.025,.014],palette.trim);for(let zz=z-d/2;zz<=z+d/2;zz+=3)ceiling.box([x,y-.12,zz],[w,.2,.2],palette.dark);}
 function shoji(x:number,y:number,z:number,w:number,h:number,angle=0,paper=false){b.scoped([x,y,z],angle,()=>{b.emit('room:pane',()=>new T.BoxGeometry(1,1,1),paper?palette.paper:'#cde3e3',[0,0,0],[w,h,.045],new T.Quaternion(),paper?cache.mat(palette.paper):glass);for(const xx of [-w/2,w/2])b.box([xx,0,.05],[.1,h+.1,.12],palette.dark);for(const yy of [-h/2,h/2])b.box([0,yy,.05],[w,.1,.12],palette.dark);for(let xx=-w/2+.45;xx<w/2;xx+=.45)b.box([xx,0,.055],[.035,h,.06],palette.trim);for(let yy=-h/2+.55;yy<h/2;yy+=.55)b.box([0,yy,.06],[w,.035,.06],palette.trim);});}
 function tatami(x:number,z:number,w:number,d:number,y=0){b.box([x,y,z],[w,.16,d],palette.dark);const nx=Math.ceil(w/1.6),nz=Math.ceil(d/2.6);for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){const xx=x-w/2+(i+.5)*w/nx,zz=z-d/2+(j+.5)*d/nz;b.box([xx,y+.1,zz],[w/nx-.045,.1,d/nz-.06],(i+j)%2?'#b8ae7c':'#d0c18b');for(let k=0;k<28;k++)b.box([xx,y+.153,zz-d/nz/2+(k+.5)*d/nz/28],[w/nx-.08,.003,.006],'#a9a174');}}
 function plant(x:number,y:number,z:number,flowers=false,scale=1){b.scoped([x,y,z],0,()=>{
  b.emit('room:ceramic-pot',()=>new T.LatheGeometry([new T.Vector2(.16,0),new T.Vector2(.18,.03),new T.Vector2(.25,.35),new T.Vector2(.26,.4),new T.Vector2(.22,.4),new T.Vector2(.21,.34)],16),'#79958d',[0,0,0],[scale,scale,scale]);
  b.cylinder([0,.35*scale,0],[0,.36*scale,0],.21*scale,'#493126',16);
  for(let i=0;i<9;i++){const a=i*2.4,xx=Math.sin(a)*.38*scale,zz=Math.cos(a)*.3*scale,yy=(.7+i%3*.13)*scale;
   b.cylinder([0,.3*scale,0],[xx,yy,zz],.014*scale,'#4c6d3d');
   b.emit('room:leaf',()=>new T.SphereGeometry(1,8,6),i%2?'#638348':'#7b955d',[xx,yy,zz],[.21*scale,.035*scale,.11*scale],new T.Quaternion().setFromEuler(new T.Euler(.2,a,.3)));
   if(flowers){for(let j=0;j<5;j++){const aa=j*Math.PI*2/5;b.emit('room:petal',()=>new T.SphereGeometry(1,8,6),i%2?'#9672a5':'#ce98ad',[xx+Math.cos(aa)*.06*scale,yy+.1*scale,zz+Math.sin(aa)*.06*scale],[.055*scale,.035*scale,.055*scale]);}b.ball([xx,yy+.12*scale,zz],[.03*scale,.025*scale,.03*scale],'#d4b569');}
  }
 });}

 let shelfSerial=0;
 function shelf(x:number,y:number,z:number,w:number,h:number){
  const serial=++shelfSerial;for(const xx of [-w/2,w/2])b.box([x+xx,y+h/2,z],[.12,h,.75],palette.wood);
  b.box([x,y+h/2,z-.34],[w,h,.055],palette.dark);
  for(let j=0;j<4;j++){const yy=y+.15+j*h/4;b.box([x,yy,z],[w,.1,.75],palette.trim);dressShelf(b,x,yy+.06,z,w-.16,h/4-.12,serial*7+j*3,['#d8c6a2','#3a5562','#607c7d','#9c6947','#725465']);}
 }
 function desk(x:number,y:number,z:number,w:number,d:number,ornate=false){const wood=ornate?'#6e402d':palette.wood;b.box([x,y+1.5,z],[w,.16,d],wood);for(const xx of [-w/2+.12,w/2-.12])for(const zz of [-d/2+.1,d/2-.1])b.box([x+xx,y+.72,z+zz],[.15,1.44,.15],palette.dark);b.box([x,y+.8,z+d/2-.1],[w-.2,1.3,.1],wood);for(const yy of [y+.22,y+1.38])b.box([x,yy,z+d/2-.03],[w-.28,.03,.03],ornate?palette.gold:palette.trim);for(const xx of [-w/2+.25,w/2-.25])b.box([x+xx,y+.8,z+d/2-.02],[.06,1.12,.05],ornate?palette.gold:palette.trim);for(const side of [-1,1]){b.box([x+side*(w/2-.08),y+.8,z],[.06,1.13,d-.22],wood);b.box([x+side*(w/2-.04),y+1.32,z],[.04,.05,d-.24],palette.trim);}if(ornate)crest(x,y+.82,z+d/2,.38);b.box([x,y+1.6,z],[w*.28,.025,d*.4],palette.paper);}
 function chair(x:number,y:number,z:number,ornate=false){b.box([x,y+.85,z],[1.1,.14,1],ornate?palette.purple:palette.wood);for(const xx of [-.43,.43])for(const zz of [-.36,.36])b.beam([x+xx*1.2,y,z+zz*1.2],[x+xx,y+.9,z+zz],.1,palette.dark);b.box([x,y+1.65,z-.4],[1.08,.85,.12],ornate?palette.purple:palette.wood);for(const xx of [-.52,.52])b.box([x+xx,y+1.5,z-.4],[.1,1.3,.15],palette.trim);}
 function crest(x:number,y:number,z:number,r:number){b.emit('room:crest-ring',()=>new T.TorusGeometry(1,.04,6,40),palette.gold,[x,y,z],[r,r,r]);for(let i=0;i<5;i++){const a=i*Math.PI*2/5;b.ball([x+Math.sin(a)*r*.43,y+Math.cos(a)*r*.43,z],[r*.27,r*.32,.015],palette.gold);}}
 function lantern(x:number,y:number,z:number,h=.8){b.emit('room:lamp',()=>new T.BoxGeometry(1,1,1),'lamp',[x,y,z],[h*.6,h,h*.6],new T.Quaternion(),lampMaterial);for(const xx of [-1,1])for(const zz of [-1,1])b.box([x+xx*h*.32,y,z+zz*h*.32],[.045,h+.1,.045],palette.dark);for(const yy of [-h/2,h/2])b.box([x,y+yy,z],[h*.72,.06,h*.72],palette.dark);for(const zz of [-1,1])for(const xx of [-.15,.15])b.box([x+xx*h,y,z+zz*h*.31],[.025,h,.02],palette.dark);}
 function railing(a:V,c:V){const d=new T.Vector3(...c).sub(new T.Vector3(...a)),n=Math.ceil(d.length()/1.7);for(let i=0;i<=n;i++){const p=new T.Vector3(...a).addScaledVector(d,i/n);b.box([p.x,p.y+.65,p.z],[.14,1.3,.14],palette.red);b.ball([p.x,p.y+1.35,p.z],[.13,.1,.13],palette.dark);}for(const dy of [.4,.9,1.25])b.beam([a[0],a[1]+dy,a[2]],[c[0],c[1]+dy,c[2]],.1,palette.red);}
 function curtain(x:number,y:number,z:number,w:number,h:number,color=palette.purple){for(let i=0;i<2;i++)b.box([x+(i?1:-1)*w*.255,y,z],[w*.48,h,.045],color);b.cylinder([x-w*.56,y+h*.55,z],[x+w*.56,y+h*.55,z],.035,palette.dark);if(color===palette.purple)crest(x,y,z+.035,Math.min(w,h)*.25);}
 function finish(dimensions:{w:number;h:number;d:number},views:RoomView[],scale:V=[1,1,1]):InteriorRoom{
  const root=new T.Group(),walls=shell.finish(),lid=ceiling.finish(),scenery=outside.finish();root.add(b.finish(),walls,lid,scenery);root.scale.fromArray(scale);root.traverse(n=>{if(n instanceof T.Mesh){n.castShadow=n.material!==glass;n.receiveShadow=true;}});
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const ctx=canvas.getContext('2d')!;ctx.fillStyle='#eae0ce';ctx.fillRect(0,0,256,256);let seed=43;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};for(let i=0;i<320;i++){ctx.strokeStyle=`rgba(70,43,24,${.04+random()*.09})`;const x=random()*256,y=random()*256;ctx.beginPath();ctx.moveTo(x,y);ctx.bezierCurveTo(x+2,y+20,x-3,y+45,x,y+110);ctx.stroke();}const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;if(!refined)for(const color of woodColors)cache.mat(color).map=texture;
  return {root,walls,lid,scenery,glass,lampMaterial,dimensions,views:views.map(v=>({...v,clipHeight:v.clipHeight===undefined?undefined:v.clipHeight*scale[1],position:v.position.map((n,i)=>n*scale[i]) as V,target:v.target.map((n,i)=>n*scale[i]) as V})),dispose(){root.traverse(n=>{if(n instanceof T.InstancedMesh)n.dispose();});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());texture.dispose();profile?.dispose();}};
 }
 return {b,shell,ceiling,outside,cache,glass,lampMaterial,floor,wall,roof,shoji,tatami,plant,shelf,desk,chair,crest,lantern,railing,curtain,finish};
}


