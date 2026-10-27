import {modernMaterials} from './modern-materials';
import {teaService,stationery,wallPanels} from './furnishing-details';
import {dressShelf} from './shelf-details';
import * as T from 'three';
import {roomKit,type V,type RoomView} from './room-kit';

export const TOWER_FLOORS=[
 {id:'lobby',label:'1F · 琉璃塔大厅'},
 {id:'hecate',label:'2F · 赫卡忒的房间'},
 {id:'hebe',label:'3F · 赫伯的房间'},
 {id:'dolly',label:'4F · 多莉的房间'},
 {id:'owner',label:'5F · 岛主的房间'},
] as const;
export type TowerFloor=typeof TOWER_FLOORS[number]['id'];

/** Individually loaded static floors. The lift switches scenes without an animation loop. */
export function makeTowerInterior(floor:TowerFloor='lobby'){
 const k=roomKit(),{b,shell,ceiling,outside,cache}=k,textures:T.Texture[]=[];
 const lobby=floor==='lobby',owner=floor==='owner',hebe=floor==='hebe',dolly=floor==='dolly';
 const w=lobby?24:owner?22:16,d=lobby?22:owner?18:14,h=lobby?15:owner?9:6.5;
 const white='#eef0f2',ivory='#e7e9ee',silver='#a9c0cf',gold='#c5a66d',blue='#729dcc',ink='#304e72',accent=hebe?'#873b51':floor==='hecate'?'#a6544a':'#84acd9';
 for(const color of [white,ivory,silver,gold]){cache.mat(color).roughness=.28;cache.mat(color).metalness=color===gold||color===silver?.45:0;}
 const finishes=modernMaterials(cache);
 const disc=(x:number,y:number,z:number,r:number,height:number,color:string,rz=r)=>b.emit('tower:disc',()=>new T.CylinderGeometry(1,1,1,48),color,[x,y,z],[r,height,rz]);
 const ring=(x:number,y:number,z:number,r:number,color:string,vertical=false)=>b.emit('tower:ring:'+vertical,()=>{const g=new T.TorusGeometry(1,.025,8,64);if(!vertical)g.rotateX(-Math.PI/2);return g;},color,[x,y,z],[r,r,r]);
 const text=(value:string,at:V,width:number,height:number,color=ink)=>{
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256;const ctx=canvas.getContext('2d')!;ctx.clearRect(0,0,1024,256);ctx.fillStyle=color;ctx.font='bold 70px "Microsoft YaHei",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(value,512,128,990);
  const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;textures.push(map);const mat=cache.mat('#ffffff','window').clone();mat.map=map;mat.transparent=true;mat.depthWrite=false;mat.emissive.set(0);labelMaterials.push(mat);
  b.emit('tower:text',()=>{const geometry=new T.PlaneGeometry(1,1);geometry.userData.preserveNativeLabel=true;return geometry;},'text:'+value,at,[width,height,1],new T.Quaternion(),mat);
 };
 const labelMaterials:T.Material[]=[];
 const light=(at:V,size:V)=>b.emit('tower:light',()=>new T.BoxGeometry(1,1,1),'tower-light',at,size,new T.Quaternion(),k.lampMaterial);
 const plant=(x:number,y:number,z:number,scale=1,flower=false)=>{
  b.emit('tower:ceramic-planter',()=>new T.LatheGeometry([new T.Vector2(.23,0),new T.Vector2(.25,.04),new T.Vector2(.32,.57),new T.Vector2(.33,.64),new T.Vector2(.29,.64),new T.Vector2(.28,.56)],20),white,[x,y,z],[scale,scale,scale]);disc(x,y+.56*scale,z,.28*scale,.02*scale,'#675e51');
  for(let i=0;i<9;i++){const a=i*2.4,xx=x+Math.cos(a)*.55*scale,zz=z+Math.sin(a)*.45*scale,yy=y+(1.1+i%3*.26)*scale;b.cylinder([x,y+.5*scale,z],[xx,yy,zz],.025*scale,'#6d9463');b.emit('tower:leaf',()=>new T.SphereGeometry(1,8,6),i%2?'#7b9b70':'#5f8057',[xx,yy,zz],[.28*scale,.035*scale,.14*scale],new T.Quaternion().setFromEuler(new T.Euler(.25,a,.35)));if(flower)b.ball([xx,yy+.15*scale,zz],[.15*scale,.15*scale,.15*scale],hebe?'#a44859':'#f3efdc');}
 };
 let shelfSerial=0;
 const books=(x:number,y:number,z:number,count=7)=>dressShelf(b,x+(count-1)*.14/2,y,z,count*.14,.75,++shelfSerial*11,[blue,ivory,ink,'#ceb997',accent]);
 const shelf=(x:number,z:number,width:number,height=4.8)=>{
  const serial=++shelfSerial;
  b.box([x,height/2+.2,z-.25],[width,height,.15],ivory);
  for(const xx of [x-width/2,x+width/2])b.box([xx,height/2+.2,z],[.1,height,.65],white);
  for(let i=0;i<5;i++){const y=.25+i*height/5;b.box([x,y,z],[width,.09,.75],white);light([x,y+.08,z+.26],[width-.15,.025,.035]);dressShelf(b,x,y+.06,z,width-.2,height/5-.18,serial*13+i*7,[blue,ivory,ink,'#ceb997',accent]);}
 };
 const chair=(x:number,z:number,color=white)=>{
  b.box([x,.85,z],[1.1,.18,1],color);b.ball([x,1.45,z-.4],[.6,.65,.16],color);
  b.cylinder([x,.1,z],[x,.8,z],.09,silver);for(const dx of [-.5,.5])for(const dz of [-.4,.4])b.cylinder([x,.16,z],[x+dx,.08,z+dz],.055,silver);
 };
 const sofa=(x:number,z:number,width:number,color=white,angle=0)=>b.scoped([x,0,z],angle,()=>{
  b.box([0,.42,0],[width,.65,1.5],color);b.box([0,1.05,-.6],[width,1,.3],color);for(const side of [-1,1]){b.box([side*(width/2-.15),.78,0],[.3,.9,1.5],color);b.box([side*width*.24,.85,-.25],[.65,.55,.18],accent,-side*.16);}for(let i=0;i<3;i++)b.box([(i-1)*width*.28,.8,.05],[width*.27,.14,1],white);
 });
 const table=(x:number,z:number,r=1.25)=>{disc(x,.68,z,r,.12,white);ring(x,.08,z,r*.85,gold);for(let i=0;i<4;i++){const a=i*Math.PI/2;b.cylinder([x+Math.cos(a)*r*.75,.08,z+Math.sin(a)*r*.75],[x+Math.cos(a)*r*.75,.63,z+Math.sin(a)*r*.75],.035,gold);}plant(x,.76,z,.35,true);};
 const desk=(x:number,z:number,width:number)=>{
  b.box([x,1.45,z],[width,.15,1.55],white);for(const side of [-1,1]){const xx=x+side*(width/2-.48);b.box([xx,.7,z],[.88,1.4,1.4],ivory);for(let i=0;i<3;i++){b.box([xx,.25+i*.4,z+.72],[.8,.35,.05],white);b.box([xx,.26+i*.4,z+.76],[.22,.035,.035],gold);}}
  b.box([x-.4,1.56,z],[1.1,.035,.6],ink);b.box([x-.4,1.96,z-.3],[1.2,.75,.07],silver);b.box([x-.4,1.96,z-.25],[1.08,.63,.025],blue);b.box([x-.4,1.57,z+.3],[.9,.025,.27],silver);
  b.cylinder([x+width*.3,1.55,z],[x+width*.3,2.35,z],.035,gold);b.box([x+width*.3-.22,2.35,z],[.55,.07,.25],gold);plant(x-width*.36,1.56,z,.5,true);
  chair(x,z-1.3,white);
 };
 const crest=(x:number,y:number,z:number,r=1)=>{
  ring(x,y,z,r*.43,silver,true);
  for(const side of [-1,1])for(let i=0;i<4;i++)b.beam([x+side*r*.2,y+r*.2,z],[x+side*(r*.7+i*.2),y+r*(.5+i*.13),z],r*.13,silver);
 };
 // Polished pale stone tiles, tall glazing and white curved structural ribs.
 b.box([0,-.15,0],[w,.3,d],silver);
 for(let x=-w/2+.5;x<w/2;x++)for(let z=-d/2+.5;z<d/2;z++)b.box([x,.015,z],[.994,.03,.994],(Math.round(x+z)%3)?white:'#dfe9f2');
 if(lobby||owner){shell.box([0,h/2,-d/2],[w,h,.16],white);shell.box([w/2,h/2,0],[.16,h,d],ivory);}
 else{
  // Character references: bedhead wall on the left, sea window at the back,
  // desk/storage/entry on the right. These are not the lobby's corner-glass shell.
  shell.box([-w/2,h/2,0],[.16,h,d],white);
  shell.box([w/2,h/2,0],[.16,h,d],ivory);
  shell.box([-5.55,h/2,-d/2],[4.9,h,.16],white);
  shell.box([7.25,h/2,-d/2],[1.5,h,.16],white);
  shell.box([1.7,h-.22,-d/2],[9.6,.44,.16],white);
 }
 // Thin architectural finishes follow solid walls; elevator approach is left clear.
 if(lobby||owner){
  const spans=lobby?[[1.9,19.8]]:[[-2.2,17.6]];
  for(const [cx,span] of spans)shell.scoped([cx,0,-d/2+.09],0,()=>wallPanels(shell,span,h,true));
  shell.scoped([w/2-.09,0,0],-Math.PI/2,()=>wallPanels(shell,d,h,true));
 }else{
  shell.scoped([-w/2+.09,0,0],Math.PI/2,()=>wallPanels(shell,d,h,true));
  shell.scoped([w/2-.09,0,-2.5],-Math.PI/2,()=>wallPanels(shell,9,h,true));
  for(const [cx,span] of [[-5.55,4.9],[7.25,1.5]])shell.scoped([cx,0,-d/2+.09],0,()=>wallPanels(shell,span,h,true));
 }
 ceiling.box([0,h+.1,0],[w,.2,d],white);
 for(const zz of [-d/2+.3,d/2-.3])light([0,h-.12,zz],[w-.6,.04,.05]);
 for(const xx of [-w/2+.3,w/2-.3])light([xx,h-.12,0],[.05,.04,d-.6]);
 k.glass.transparent=true;k.glass.opacity=.19;k.glass.depthWrite=false;k.glass.roughness=.15;
 if(lobby||owner){
  for(const side of ['front','left']){
   const len=side==='front'?w:d,count=Math.ceil(len/3);
   for(let i=0;i<count;i++){const along=-len/2+(i+.5)*len/count;
    const pos:V=side==='front'?[along,h/2,d/2]:[-w/2,h/2,along];
    b.emit('tower:glazing',()=>new T.BoxGeometry(1,1,1),'glass',pos,side==='front'?[len/count-.06,h,.04]:[.04,h,len/count-.06],new T.Quaternion(),k.glass);
    const post:V=side==='front'?[along-len/count/2,h/2,d/2]:[-w/2,h/2,along-len/count/2];b.box(post,side==='front'?[.08,h,.11]:[.11,h,.08],silver);
   }
  }
  for(let x=-w/2+1;x<w/2;x+=w/3){let last:V=[x,0,d/2-.2];for(let i=1;i<=12;i++){const u=i/12,next:V=[x+Math.sin(u*Math.PI/2)*.75,u*h,d/2-.2-Math.sin(u*Math.PI)*.55];b.beam(last,next,.24,white);last=next;}}
 }else{
  const left=-3.1,right=6.5;
  for(let i=0;i<4;i++){const x=left+(i+.5)*(right-left)/4;
   b.emit('tower:glazing',()=>new T.BoxGeometry(1,1,1),'glass',[x,3.1,-6.96],[2.35,6.05,.04],new T.Quaternion(),k.glass);
   b.box([left+i*2.4,3.1,-6.82],[.065,6.1,.09],silver);
  }
  b.box([1.7,.12,-6.8],[9.7,.18,.27],white);b.box([1.7,6.1,-6.8],[9.7,.18,.27],white);
  for(const x of [left,right]){let last:V=[x,0,-6.7];for(let i=1;i<=16;i++){const u=i/16,next:V=[x+(x<0?1:-1)*.45*Math.sin(u*Math.PI/2),h*u,-6.7+.16*Math.sin(u*Math.PI)];b.beam(last,next,.18,white);last=next;}}
  // Gathered full-height curtains flanking the ocean window.
  const curtainColor=dolly?'#f7f4ef':accent,curtainMaterial=cache.mat(curtainColor);curtainMaterial.side=T.DoubleSide;
  for(const x of [-2.7,6.1]){
   b.emit('tower:pleated-curtain',()=>{
    const g=new T.PlaneGeometry(1,1,24,24),a=g.attributes.position;
    for(let i=0;i<a.count;i++){const u=a.getX(i)+.5,v=a.getY(i)+.5,spread=.5+.5*(1-Math.exp(-Math.pow((v-.35)/.2,2)));a.setXYZ(i,(u-.5)*spread,v-.5,Math.sin(u*Math.PI*12)*.075);}
    g.computeVertexNormals();return g;
   },curtainColor,[x,3.1,-6.48],[.85,6,1],new T.Quaternion(),curtainMaterial);
   b.box([x,2.2,-6.35],[.5,.1,.06],gold);
   for(let i=0;i<6;i++)b.emit('tower:curtain-ring',()=>new T.TorusGeometry(.055,.012,5,10),gold,[x+(i-2.5)*.14,6.13,-6.48]);
  }
  b.cylinder([-3.3,6.17,-6.48],[6.7,6.17,-6.48],.025,gold);
  outside.box([0,-2,-50],[180,.1,90],'#419fd4');
  for(let i=0;i<18;i++){outside.box([-35+i*4,-1.92,-22-i%4*7],[2,.015,.1],'#c1eaf5');outside.ball([-35+i*4,13+i%3,-55],[4,1.2,2],'#f2f8ff');}
 }
 outside.box([0,-2,45],[220,.1,130],'#419fd4');outside.box([-45,-2,0],[90,.1,150],'#419fd4');
 for(let i=0;i<28;i++){const x=-70+i*5;outside.box([x,-1.92,25+i%5*9],[2.2,.015,.12],'#b2e5ed');outside.ball([x,17+i%3*2,65],[5,1.6,2.3],'#edf7ff');}
 // Lobby lift moves to the opposite (left) end of the same rear wall.
 // Private-room entrances are on the right return wall, outside the reference furniture zones.
 const ex=lobby?-w/2+2.1:owner?w/2-2.1:7.82,ez=lobby||owner?-d/2+.16:4.9;
 b.scoped([ex,0,ez],lobby||owner?0:-Math.PI/2,()=>{
  b.box([0,2.15,0],[3.1,4.3,.22],silver);
  if(lobby||owner){for(const side of [-1,1]){b.box([side*.67,2,.14],[1.31,3.8,.08],'#c9d8e3');b.box([side*1.43,2.1,.19],[.08,4.15,.12],gold);}b.box([0,2,.2],[.035,3.8,.04],ink);}
  else{
   // Residential landing door matches the white panel door in Dolly's reference.
   b.box([0,2.05,.14],[2.8,4.05,.12],white);
   for(const yy of [1.1,3]){b.box([0,yy,.23],[2.38,1.45,.045],ivory);for(const xx of [-1.2,1.2])b.box([xx,yy,.27],[.045,1.5,.04],white);for(const dy of [-.75,.75])b.box([0,yy+dy,.27],[2.45,.045,.04],white);}
   b.box([1,1.8,.3],[.12,.42,.06],gold);b.box([.87,1.83,.36],[.32,.06,.08],gold);
  }
  text('电梯',[0,4.7,.22],2,.5);text(TOWER_FLOORS.find(f=>f.id===floor)!.label,[0,4.25,.25],2.7,.35);
  b.box([-1.75,1.45,.2],[.26,.7,.1],ink);b.ball([-1.75,1.6,.28],[.055,.055,.03],blue);b.ball([-1.75,1.3,.28],[.055,.055,.03],white);
 });

 if(lobby){
  // Reception to the right, seating to the left, sculpture in the glazed atrium.
  b.box([5.2,1,-3.1],[8,1.8,1.8],white);disc(1.2,1,-3.1,.9,1.8,white);disc(9.2,1,-3.1,.9,1.8,white);b.box([5.2,1.94,-3.1],[8.4,.13,2],ivory);light([5.2,.23,-2.17],[8,.07,.04]);
  for(const x of [3,6.5]){b.box([x,2.25,-3.2],[1.15,.65,.08],ink);b.box([x,1.98,-2.65],[.85,.04,.3],silver);}text('受付  /  RECEPTION',[8.5,2.2,-2.05],1.2,.4);
  b.box([4.2,6.5,-9.8],[9.5,8.3,.3],ivory);crest(4.2,8.2,-9.59,2.4);text('为了更加闪耀的世界',[4.2,5.8,-9.56],6.4,.7);text('FOR A BRIGHTER HUMANITY',[4.2,5.1,-9.54],6.3,.45);
  for(const x of [-8,-2]){sofa(x,5,4);table(x,7.1);plant(x-2,0,4,1.5);}
  sofa(-8,-3,4,white,Math.PI/2);table(-5.8,-3);
  disc(-2,.3,1,2,.6,white);disc(-2,.62,1,1.8,.08,'#9cb79c');
  for(const side of [-1,1]){const curve=new T.CatmullRomCurve3(Array.from({length:33},(_,i)=>{const u=i/32,a=u*Math.PI*2+side*Math.PI/2;return new T.Vector3(-2+Math.cos(a)*(.85-u*.6),.7+u*5,1+Math.sin(a)*(.85-u*.6));}));b.emit('tower:sculpture:'+side,()=>new T.TubeGeometry(curve,48,.12,8,false),silver,[0,0,0]);}
  for(const x of [-9,-3]){b.box([x,10.3,10.65],[2.1,5,.045],blue);crest(x,11.5,10.6,.7);text('A KINDER TOMORROW',[x,9.6,10.6],1.8,.3);}
  // Two open mezzanines with glass balustrades, kept clear of the elevator frontage.
  const balconyGlass=cache.mat('#bbdbe6','window');balconyGlass.transparent=true;balconyGlass.opacity=.3;balconyGlass.depthWrite=false;
  for(const yy of [6.2,10.5]){
   b.box([-6.9,yy,-7.3],[9.5,.3,7.1],white);
   b.emit('tower:balcony-pane',()=>new T.BoxGeometry(1,1,1),'balcony-glass',[-6.9,yy+.85,-3.7],[9.5,1.4,.06],new T.Quaternion(),balconyGlass);
   b.emit('tower:balcony-pane',()=>new T.BoxGeometry(1,1,1),'balcony-glass',[-2.15,yy+.85,-7.25],[.06,1.4,7.1],new T.Quaternion(),balconyGlass);
   b.box([-6.9,yy+1.6,-3.7],[9.5,.07,.12],gold);b.box([-2.15,yy+1.6,-7.25],[.12,.07,7.1],gold);
   for(const x of [-11.4,-8.4,-5.4,-2.2])b.box([x,yy+.85,-3.7],[.05,1.5,.08],silver);
   light([-6.9,yy-.19,-3.8],[9,.04,.06]);plant(-4,yy+.2,-5,1.3);
  }
  plant(-10,0,8,2);plant(10,0,6,2);plant(1.7,2.03,-3,.65,true);
 }else if(owner){
  // Reference: executive desk right, sofas front-left, round meeting table by left glazing.
  // Keep x=7.3..10.5, z=-9..-2 completely open as the lift arrival aisle.
  desk(2.2,-3.8,8.2);b.box([2.2,1,-3.8],[7.8,1.3,1.35],white);light([2.2,.4,-3.08],[7.5,.055,.05]);
  crest(2.2,6.4,-8.85,1.65);
  shelf(-1.4,-8.5,2.1,7);shelf(5.6,-8.5,2.1,7);
  // No hanging banners or map board: the lift and its surround remain visible.
  b.box([-5,.05,3.7],[7,.045,4.5],blue);sofa(-7,2.7,4,white,Math.PI/2);sofa(-4,5.5,4,white,Math.PI);table(-4,3.1,1.5);
  disc(-6,1.45,-3.5,1.8,.14,white);disc(-6,.7,-3.5,.18,1.4,silver);
  for(const [x,z,angle] of [[-6,-5.8,0],[-8.3,-3.5,-Math.PI/2],[-3.7,-3.5,Math.PI/2],[-6,-1.2,Math.PI]])b.scoped([x,0,z],angle,()=>chair(0,0));
  plant(-6,1.53,-3.5,.5,true);plant(-9.8,0,6,1.8);plant(9,0,6,1.6);
  books(4.2,1.57,-3.6,6);b.box([.1,1.58,-3.6],[1.3,.08,.8],ink);
 }else{
  // Each reference is staged independently around the left bedhead wall and rear sea window.
  const wallFrame=(x:number,y:number,z:number,ww:number,hh:number,color=blue)=>{
   b.box([x,y,z],[ww+.09,hh+.09,.07],gold);b.box([x,y,z+.045],[ww,hh,.025],color);
   b.box([x,y-hh*.23,z+.065],[ww,.03,.015],'#d5e7e8');
   for(let i=0;i<3;i++)b.ball([x+(i-1)*ww*.22,y-hh*.1,z+.07],[ww*.21,hh*.18,.008],i%2?'#86ab9b':'#bacfc4');
  };
  const photo=(x:number,y:number,z:number,ww=.5,hh=.6)=>{b.box([x,y,z],[ww+.08,hh+.08,.04],white);wallFrame(x,y+.025,z+.03,ww*.88,hh*.75);};
  const gift=(x:number,y:number,z:number,ww:number,color:string)=>{b.box([x,y+.2,z],[ww,.4,ww*.7],color);b.box([x,y+.41,z],[ww+.04,.035,ww*.7+.04],color);b.box([x,y+.43,z],[ww,.015,.045],gold);b.box([x,y+.43,z],[.045,.015,ww*.7],gold);};
  const lamp=(x:number,y:number,z:number)=>{disc(x,y+.03,z,.18,.06,gold);b.cylinder([x,y,z],[x,y+.75,z],.025,gold);b.emit('tower:desk-shade',()=>new T.SphereGeometry(1,20,10,0,Math.PI*2,0,Math.PI/2),gold,[x,y+.75,z],[.3,.18,.3]);};
  const bed=(z:number,luxury=false)=>b.scoped([-5.1,0,z],Math.PI/2,()=>{
   b.box([0,.4,0],[4.2,.7,5.4],white);b.box([0,.86,0],[4.25,.35,5.4],ivory);
   b.box([0,1.07,.05],[4.3,.16,5.25],white);b.box([0,1.19,.75],[4.32,.08,3.7],accent);
   // Drape the quilt over the foot and sides instead of a rigid floating slab.
   b.box([0,.72,2.67],[4.32,.9,.09],accent);for(const side of [-1,1])b.box([side*2.16,.86,.75],[.07,.62,3.7],accent);
   b.box([0,1.5,-2.69],[4.45,2.1,.2],luxury?gold:white);b.box([0,1.52,-2.54],[4.2,1.9,.14],white);
   for(const side of [-1,1]){b.ball([side*.99,1.3,-1.73],[.91,.22,.6],white);b.ball([side*.99,1.49,-1.36],[.66,.19,.45],luxury?accent:dolly?blue:side<0?'#64764d':accent);}
   for(const side of [-1,1]){b.box([side*2.17,.25,0],[.035,.045,5.3],gold);for(const zz of [-1.5,1.1]){b.box([side*2.18,.48,zz],[.04,.43,2.25],ivory);b.box([side*2.21,.5,zz],[.045,.05,.3],gold);}}
   if(dolly)for(let i=0;i<9;i++)for(let j=0;j<6;j++)b.box([-1.95+i*.48,1.235,-.8+j*.52],[.46,.008,.5],(i+j)%2?'#9cbce0':'#b6cce6');
   if(!dolly&&!luxury)for(let i=0;i<10;i++)b.box([-2+i*.45,1.237,.8],[.017,.009,3.5],'#d9a589');
   for(const x of [-2.75,2.75]){b.box([x,.6,-1.9],[1.05,1.15,1],white);for(const yy of [.3,.83]){b.box([x,yy,-1.38],[.95,.45,.035],ivory);b.box([x,yy,-1.34],[.25,.035,.04],gold);}lamp(x,1.2,-1.9);}
  });
  // A desk in bedrooms has writing/cosmetics rather than the executive computer equipment.
  const writingDesk=(width=4.4)=>{
   b.box([0,1.42,0],[width,.14,1.25],white);b.box([width/2-.5,.7,0],[.9,1.4,1.15],ivory);
   for(const x of [-width/2+.12,width/2-.12])b.box([x,.7,-.48],[.07,1.4,.07],gold);
   for(let i=0;i<3;i++){b.box([width/2-.5,.27+i*.4,.6],[.82,.34,.04],white);b.box([width/2-.5,.27+i*.4,.64],[.22,.035,.03],gold);}
   b.box([-.4,1.51,0],[1.1,.025,.62],'#f8f6ef');books(-width/2+.2,1.51,-.25,4);lamp(width*.33,1.51,0);
   b.scoped([0,0,1.4],Math.PI,()=>chair(0,0,white));
  };
  const floatingShelf=(width:number,y:number)=>{b.box([0,y,0],[width,.1,.65],white);light([0,y-.08,.17],[width-.12,.025,.035]);};
  const wardrobe=(width:number,glassFront=false)=>{
   b.box([0,2.6,-.25],[width,5.2,.15],ivory);for(const xx of [-width/2,width/2])b.box([xx,2.6,0],[.09,5.2,.8],white);
   b.box([0,.65,0],[width,1.25,.8],white);b.box([0,5.2,0],[width,.12,.8],white);b.cylinder([-width/2+.1,4.5,0],[width/2-.1,4.5,0],.035,gold);
   for(let i=0;i<4;i++){const x=-width*.35+i*width*.23;b.beam([x-.25,4.25,0],[x,4.48,0],.025,gold);b.beam([x,4.48,0],[x+.25,4.25,0],.025,gold);b.box([x,3.1,.05],[width*.2,2.25,.2],i===1?white:accent);b.box([x,3.45,.18],[width*.22,.08,.035],gold);}
   for(const xx of [-width*.25,width*.25]){b.box([xx,.65,.43],[width*.45,1.1,.05],ivory);b.box([xx,.85,.48],[.26,.035,.04],gold);}
   if(glassFront){const mat=cache.mat('#dfd8cf','window');mat.transparent=true;mat.opacity=.16;mat.depthWrite=false;b.emit('tower:wardrobe-glass',()=>new T.BoxGeometry(1,1,1),'wardrobe',[0,3.25,.48],[width,3.8,.025],new T.Quaternion(),mat);for(const xx of [-width/2,0,width/2])b.box([xx,3.2,.51],[.035,4,.035],gold);}
  };
  if(floor==='hecate'){
   bed(.5);b.box([-3.2,.045,1],[6.3,.045,5.9],'#b87164');
   // Left wall, above the bed: pinned travel map, photographs, globe and mementos.
   b.scoped([-7.73,0,.5],Math.PI/2,()=>{
    b.box([0,3.35,.04],[3.4,1.9,.05],'#c9bea5');
    for(let i=0;i<12;i++)b.ball([-.95+(i%4)*.65,2.9+Math.floor(i/4)*.4,.08],[.36,.2,.01],i%2?'#b4b3a0':'#d7cfbd');
    for(const [x,y] of [[-1.9,3],[-1.6,4.35],[1.8,3.8],[1.1,2.6]])photo(x,y,.12,.55,.65);
    floatingShelf(4.8,5.1);books(-2,5.17,0,4);gift(.7,5.17,0,.65,'#b3a087');
    disc(-.3,5.17,0,.3,.08,gold);b.ball([-.3,5.62,0],[.38,.38,.38],ink);ring(-.3,5.62,0,.44,gold,true);plant(1.8,5.17,0,.5);
   });
   // Hat and satchel at the window-side corner; trunks directly below that window.
   b.scoped([-7.68,0,-4.5],Math.PI/2,()=>{
    b.cylinder([0,4.5,0],[0,3.1,.15],.035,'#896644');b.ball([0,2.8,.18],[.48,.57,.17],'#97724d');
    b.emit('tower:travel-hat',()=>new T.CylinderGeometry(.7,.7,.07,32).rotateX(Math.PI/2),'#788052',[0,4.6,.15]);b.ball([0,4.6,.25],[.43,.43,.16],'#6e7950');
   });
   for(let i=0;i<3;i++){b.box([-.6,.3+i*.53,-5.8],[1.9-i*.23,.5,1.1],i%2?'#bda47e':'#927b5d');for(const xx of [-1.15,-.05])b.box([xx,.3+i*.53,-5.23],[.07,.45,.04],gold);}
   plant(-2.3,0,-5.6,1.4);
   // Desk and souvenir shelving on right, open clothing bay nearer the foreground.
   b.scoped([7.12,0,-3.5],-Math.PI/2,()=>{
    writingDesk(4.5);for(const yy of [2.9,4.15,5.4]){floatingShelf(4.5,yy);books(-1.9,yy+.07,0,5);plant(1.6,yy+.07,0,.35);}
    for(let i=0;i<6;i++)b.emit('tower:gem',()=>new T.OctahedronGeometry(1),[blue,'#9980b0','#83b3a1'][i%3],[-.6+i*.3,3.23,.08],[.12,.22,.12]);
    wallFrame(.5,4.65,.12,.7,.6);ring(1.1,5.95,.1,.35,gold,true);
   });
   b.scoped([7.42,0,1.3],-Math.PI/2,()=>wardrobe(2.8));
   // Foreground trays, gift parcels and specimen bags from the reference.
   b.box([2.4,.76,4.4],[3.1,.14,2],accent);for(const x of [1.1,3.7])for(const z of [3.65,5.15])b.box([x,.36,z],[.08,.72,.08],gold);
   b.box([2.4,.87,4.4],[2.7,.08,1.5],'#987a50');
   for(let i=0;i<12;i++)b.emit('tower:gem',()=>new T.OctahedronGeometry(1),[blue,'#b794c8','#d6c199'][i%3],[1.3+i%4*.7,1.06,3.95+Math.floor(i/4)*.45],[.16,.17,.16]);
   gift(3.8,0,2.2,.9,accent);gift(4.4,.42,2.4,.65,ivory);b.ball([1.2,.5,2.4],[.42,.58,.35],'#ceba94');ring(1.2,.85,2.4,.2,gold);
   table(-4.2,5.7,1);b.box([-4.2,.8,5.7],[1.35,.1,.75],'#bba276');
  }else if(hebe){
   bed(2.1,true);disc(-4.25,.05,2.1,3.8,.035,'#e3cfc7',3.9);ring(-4.25,.08,2.1,3.75,accent);
   // Tall glazed clothes cabinet is behind/left of the bed, with a mirror at its right end.
   b.scoped([-7.5,0,-4.35],Math.PI/2,()=>wardrobe(3.9,true));
   b.scoped([-7.55,0,-1.55],Math.PI/2,()=>{b.emit('tower:long-mirror',()=>new T.CircleGeometry(1,48),silver,[0,2.6,.1],[.58,2.1,1]);b.emit('tower:long-mirror-frame',()=>new T.TorusGeometry(1,.035,8,48),gold,[0,2.6,.14],[.58,2.1,1]);});
   b.scoped([-4.55,0,-6.5],0,()=>{shelf(0,0,1.7,5.6);for(const yy of [1.7,3.9]){b.emit('tower:fan',()=>new T.CircleGeometry(.4,20,0,Math.PI),accent,[0,yy,.43]);for(let i=0;i<9;i++){const a=i*Math.PI/8;b.beam([0,yy,.45],[Math.cos(a)*.4,yy+Math.sin(a)*.4,.45],.013,gold);}}});
   // Chaise and round tea table are in front of the rear ocean window, not in the bed aisle.
   b.box([1.4,.48,-4.9],[4,.65,1.5],white);b.box([-.5,1,-4.9],[.3,1.3,1.5],white);b.ball([-.25,.96,-4.9],[.48,.25,.6],ivory);
   b.box([1.6,.84,-4.9],[.9,.06,1.5],accent);b.box([1.6,.48,-4.12],[.9,.75,.05],accent);for(const x of [-.3,3.1])for(const z of [-5.45,-4.35])b.box([x,.16,z],[.06,.32,.06],gold);
   table(1,-2.7,.85);plant(4.2,0,-5.4,1.4,true);
   // Gold-legged bench at bed foot, aligned across the bed's width.
   b.box([-1.7,.65,2.1],[1.15,.3,3.85],white);for(const x of [-2.15,-1.25])for(const z of [.5,3.7])b.box([x,.3,z],[.06,.6,.06],gold);b.box([-1.7,.82,2.4],[1.2,.04,.9],accent);
   // Vanity on the right wall, oval mirror, burgundy chair and three pendant globes.
   b.scoped([7.08,0,-.1],-Math.PI/2,()=>{
    writingDesk(4.5);b.emit('tower:vanity-oval',()=>new T.CircleGeometry(1,48),silver,[0,3.4,-.42],[1.05,1.45,1]);b.emit('tower:vanity-rim',()=>new T.TorusGeometry(1,.025,8,48),gold,[0,3.4,-.38],[1.05,1.45,1]);
    b.scoped([0,0,1.4],Math.PI,()=>{b.box([0,.94,0],[1,.12,.9],accent);b.ball([0,1.47,-.4],[.59,.61,.18],accent);});
    for(const x of [-1.55,0,1.55]){const yy=4.8+Math.abs(x)*.3;b.cylinder([x,6.3,-.1],[x,yy,-.1],.018,gold);b.ball([x,yy,-.1],[.22,.28,.22],'#fff1d7');}
    for(let i=0;i<5;i++){b.cylinder([-.95+i*.24,1.51,.15],[-.95+i*.24,1.75,.15],.06,i%2?gold:accent);}plant(1.8,1.51,0,.6,true);
   });
   table(3.4,5.1,1);gift(3.4,.78,5.1,.65,accent);
  }else{
   bed(.4);b.box([-1.3,.06,3.7],[6.7,.08,4.6],'#e5e7e6');
   // Pinned photos and the angel toy occupy shelves directly above the bedhead.
   b.scoped([-7.73,0,.4],Math.PI/2,()=>{
    for(const [x,y] of [[-1.55,3.1],[-.45,3.8],[.7,3.25],[1.6,4.15]])photo(x,y,.09,.65,.8);
    b.cylinder([-1.9,4.3,.1],[1.9,4.3,.1],.012,gold);floatingShelf(4.7,5.15);books(-2.1,5.22,0,5);plant(1.6,5.22,0,.45);
    b.ball([.45,5.5,.08],[.24,.3,.2],white);b.ball([.45,5.8,.08],[.2,.2,.2],white);ring(.45,6.05,.08,.2,gold);for(const side of [-1,1])b.ball([.45+side*.29,5.6,.08],[.2,.25,.06],ivory);
   });
   // Writing desk under the window; tall books at its right; paneled door farther right.
   b.scoped([3.2,0,-5.95],0,()=>{writingDesk(4.5);plant(-1.8,1.51,0,.55);photo(.6,1.95,0,.5,.6);});
   shelf(6.5,-6.35,1.35,5.9);plant(6.4,0,2.8,1.15,true);plant(-2.1,0,-5.4,1.2);
   // Loose reading books and a low round table fill the foreground as in the image.
   for(let i=0;i<7;i++){const x=-2.4+(i%3)*1.35,z=3.1+Math.floor(i/3)*.85;b.box([x,.17,z],[.86,.12,.6],i%2?blue:ivory,(i%3-1)*.32);b.box([x,.24,z],[.79,.015,.53],'#ece9df',(i%3-1)*.32);}
   for(const side of [-1,1])b.box([-.8+side*.3,.27,5.55],[.58,.04,.75],'#faf6e8',side*.12);
   table(-4.8,5.7,1.1);for(let i=0;i<4;i++)b.box([-4.8,.86+i*.14,5.7],[1.1,.13,.75],i%2?ivory:blue);plant(2.3,0,5.5,.6,true);
  }
 }
 // Lived-in accents remain on authored desks/tables, never in lift circulation.
 if(lobby){
  stationery(b,4.8,2.015,-3.1,.7,ink);
  teaService(b,-7.7,.75,7.15,.7,white);
  for(const x of [-8,-2]){b.box([x,.055,5.5],[5.7,.04,5.3],'#e3cfc7');for(const side of [-1,1])b.box([x+side*2.72,.08,5.5],[.025,.008,5.12],gold);}
 }else if(owner){
  stationery(b,2.8,1.55,-3.7,.85,ink);teaService(b,-4.2,.76,3.1,.8,white);
  b.box([-6.8,1.55,-3.5],[.75,.04,.55],ink);
 }else if(floor==='hecate'){
  b.scoped([7.12,0,-3.5],-Math.PI/2,()=>stationery(b,-.15,1.51,0,.65,accent));
  // Specimen tray separators and jewelry loops; the reference's collector personality.
  for(const x of [1.6,2.3,3])b.box([x,.98,4.4],[.025,.16,1.45],gold);
  for(const z of [4.17,4.62])b.box([2.4,.98,z],[2.6,.16,.025],gold);
  ring(-4.15,.91,5.7,.2,gold);ring(-4.55,.91,5.7,.14,gold);
 }else if(hebe){
  teaService(b,1.15,.76,-2.75,.55,white);
  b.scoped([7.08,0,-.1],-Math.PI/2,()=>{
   b.box([.9,1.55,.15],[.75,.06,.48],gold);
   for(let i=0;i<3;i++){b.cylinder([.65+i*.24,1.59,.15],[.65+i*.24,1.82+i%2*.08,.15],.07,i%2?accent:ivory,16);b.box([.65+i*.24,1.87+i%2*.08,.15],[.08,.09,.08],gold);}
  });
 }else{
  stationery(b,3,1.51,-5.9,.7,blue);
  // Bookmark ribbons and a folded reading throw beside the existing blue books.
  for(let i=0;i<4;i++)b.box([-4.4,.88+i*.14,5.8],[.06,.015,.7],gold);
  b.box([-.8,.12,5.55],[1.4,.04,1.05],'#b6cce6');
 }
 const views:RoomView[]=[
  {id:'reference',label:lobby?'大厅全景':owner?'岛主办公室':'房间全景',position:lobby||owner?[-w*.33,h*.29,d*.35]:[6.35,3.35,6.2],target:lobby||owner?[w*.12,h*.23,-d*.24]:[-1.8,2.2,-1.9]},
  {id:'window',label:'海景与休息区',position:lobby||owner?[w*.35,h*.3,-d*.1]:[.2,2.8,3.6],target:lobby||owner?[-w*.2,h*.22,d*.35]:[2.5,2.5,-5.5]},
  {id:'details',label:lobby?'前台与中庭':owner?'办公与会客':'床铺与陈设',position:lobby||owner?[w*.32,h*.33,d*.32]:[3.6,2.9,2.4],target:lobby||owner?[-w*.2,h*.22,-d*.1]:[-5.2,2.2,.1]},
  {id:'elevator',label:'电梯门前',position:lobby||owner?[ex-1,2.4,ez+5.5]:[ex-5.5,2.4,ez-.5],target:[ex,2.2,ez]},
  {id:'overview',label:'楼层剖面',position:[w*1.1,h*1.6,d*1.4],target:[0,h*.2,0],cutaway:true},
 ];
 const room=k.finish({w,h,d},views),dispose=room.dispose;
 room.root.name='琉璃塔 · '+TOWER_FLOORS.find(f=>f.id===floor)!.label;
 room.dispose=()=>{finishes.dispose();textures.forEach(t=>t.dispose());labelMaterials.forEach(m=>m.dispose());dispose();};
 return room;
}

