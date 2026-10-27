import * as T from 'three';
import type {IslandObject} from '../data/model.ts';

export type Cache={geo:(key:string,make:()=>T.BufferGeometry)=>T.BufferGeometry;mat:(color:string,role?:'window'|'lamp')=>T.MeshStandardMaterial;sign:(text:string)=>T.MeshStandardMaterial};
type V=[number,number,number];
const wood='#71533d',dark='#41362b',trim='#a17c51',stone='#a4a49a',red='#a84835',paper='#e6deca';

/** Static instanced joinery/tile/stone batches. Detail adds triangles, not per-piece draw calls. */
export class Builder {
 private buckets=new Map<string,{g:T.BufferGeometry;m:T.Material;matrices:T.Matrix4[]}>();
 private parent=new T.Matrix4();
 private cache:Cache;
 constructor(cache:Cache){this.cache=cache;}
 emit(key:string,geometry:()=>T.BufferGeometry,color:string,p:V,scale:V=[1,1,1],rotation=new T.Quaternion(),material?:T.Material){
  const bucketKey=key+'|'+color+'|'+(material?.uuid||'');let b=this.buckets.get(bucketKey);
  if(!b){b={g:this.cache.geo(key,geometry),m:material||this.cache.mat(color),matrices:[]};this.buckets.set(bucketKey,b);}
  b.matrices.push(new T.Matrix4().multiplyMatrices(this.parent,new T.Matrix4().compose(new T.Vector3(...p),rotation,new T.Vector3(...scale))));
 }
 box(p:V,size:V,color=wood,rot=0){this.emit('shrine:box',()=>new T.BoxGeometry(1,1,1),color,p,size,new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),rot));}
 litBox(p:V,size:V,color:string,role:'window'|'lamp'='window'){this.emit('shrine:box',()=>new T.BoxGeometry(1,1,1),color,p,size,new T.Quaternion(),this.cache.mat(color,role));}
 litBall(p:V,size:V,color:string){this.emit('shrine:stone',()=>new T.IcosahedronGeometry(1,1),color,p,size,new T.Quaternion(),this.cache.mat(color,'lamp'));}
 ball(p:V,size:V,color=stone){this.emit('shrine:stone',()=>new T.IcosahedronGeometry(1,1),color,p,size);}
 cylinder(a:V,b:V,r:number,color=wood,sides=8){const start=new T.Vector3(...a),end=new T.Vector3(...b),delta=end.clone().sub(start);this.emit(`shrine:cyl:${sides}`,()=>new T.CylinderGeometry(1,1,1,sides),color,start.add(end).multiplyScalar(.5).toArray() as V,[r,delta.length(),r],new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize()));}
 beam(a:V,b:V,width:number,color=wood){const start=new T.Vector3(...a),end=new T.Vector3(...b),delta=end.clone().sub(start);this.emit('shrine:box',()=>new T.BoxGeometry(1,1,1),color,start.add(end).multiplyScalar(.5).toArray() as V,[width,delta.length(),width],new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize()));}
 scoped(p:V,angle:number,fn:()=>void){const previous=this.parent;this.parent=previous.clone().multiply(new T.Matrix4().makeTranslation(...p)).multiply(new T.Matrix4().makeRotationY(angle));fn();this.parent=previous;}
 sign(text:string,p:V,size:[number,number],rotation=0){this.scoped(p,rotation,()=>{this.box([0,0,-.06],[size[0]+.3,size[1]+.3,.18],trim);this.emit('shrine:signplane',()=>new T.PlaneGeometry(1,1),'sign:'+text,[0,0,.05],[...size,1],new T.Quaternion(),this.cache.sign(text));});}
 roof(p:V,width:number,depth:number,rise:number,color:string,angle=0){
  const profile=(z:number)=>rise*(1-Math.pow(Math.abs(z),.78))+.34*Math.pow(Math.abs(z),6);
  this.scoped(p,angle,()=>{
   this.emit(`shrine:roof:${width}:${depth}:${rise}`,()=>{const vertices:number[]=[],idx:number[]=[];for(let j=0;j<=32;j++){const u=j/16-1;vertices.push(-width/2,profile(u),u*depth/2,width/2,profile(u),u*depth/2);}for(let j=0;j<32;j++){const a=j*2;idx.push(a,a+2,a+1,a+1,a+2,a+3);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setIndex(idx);g.computeVertexNormals();return g;},color,[0,0,0]);
   // Raised kawara channels and overlapping horizontal tile courses.
   const columns=Math.max(6,Math.round(width/.52));for(let i=0;i<=columns;i++){const x=-width/2+i*width/columns;for(const side of [-1,1])for(let j=0;j<10;j++){const u=j/10,v=(j+1)/10;this.cylinder([x,profile(u)+.055,side*u*depth/2],[x,profile(v)+.055,side*v*depth/2],.075,color,6);}}
   for(const side of [-1,1])for(let j=1;j<=10;j++){const u=j/10;this.cylinder([-width/2,profile(u)+.03,side*u*depth/2],[width/2,profile(u)+.03,side*u*depth/2],.045,'#6d7070',6);}
   for(let j=0;j<3;j++)this.box([0,rise+.08+j*.12,0],[width+.3,.15,.6-j*.13],color);
   this.cylinder([-width/2-.2,rise+.5,0],[width/2+.2,rise+.5,0],.19,color,10);
   for(const side of [-1,1]){
    for(let j=0;j<16;j++){const a=j/8-1,b=(j+1)/8-1;this.beam([side*width/2,profile(a)-.15,a*depth/2],[side*width/2,profile(b)-.15,b*depth/2],.23,trim);}
    this.box([0,.16,side*depth/2],[width+.2,.26,.24],dark);
   }
  });
 }
 foundation(w:number,d:number){this.box([0,.32,0],[w+1.6,.64,d+1.6],stone);for(const side of [-1,1])for(let i=0;i<Math.ceil(w/1.4);i++)this.box([-w/2+i*1.4,.35,side*(d/2+.82)],[.035,.6,.035],'#797d76');for(let i=0;i<3;i++)this.box([0,.12+i*.16,d/2+2-i*.45],[w*.4,.24+i*.32,1.1],i%2?stone:'#b5b5a9');}
 /** M2 shrine-only roof assembly; the shared M1 roof remains available to other landmarks. */
 detailedRoof(p:V,width:number,depth:number,rise:number,color:string,angle=0){
  this.roof(p,width,depth,rise,color,angle);
  const profile=(z:number)=>rise*(1-Math.pow(Math.abs(z),.78))+.34*Math.pow(Math.abs(z),6);
  this.scoped(p,angle,()=>{
   // Closed timber underside and edge thickness, including both gables.
   this.emit(`shrine:soffit:${width}:${depth}:${rise}`,()=>{
    const vertices:number[]=[],indices:number[]=[];
    const quad=(a:V,b:V,c:V,d:V)=>{const i=vertices.length/3;vertices.push(...a,...b,...c,...d);indices.push(i,i+1,i+2,i,i+2,i+3);};
    for(let j=0;j<32;j++){
     const u=j/16-1,v=(j+1)/16-1,zu=u*depth/2,zv=v*depth/2,yu=profile(u),yv=profile(v),x=width/2;
     quad([-x,yu-.24,zu],[x,yu-.24,zu],[x,yv-.24,zv],[-x,yv-.24,zv]);
     quad([-x,yu,zu],[-x,yu-.24,zu],[-x,yv-.24,zv],[-x,yv,zv]);
     quad([x,yu,zu],[x,yv,zv],[x,yv-.24,zv],[x,yu-.24,zu]);
    }
    for(const side of [-1,1])quad([side*width/2,.34,side*depth/2],[-side*width/2,.34,side*depth/2],[-side*width/2,.1,side*depth/2],[side*width/2,.1,side*depth/2]);
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();return g;
   },dark,[0,0,0]);
   // Two exposed eave purlins, short rafters, round tile end caps and ridge ornaments.
   const count=Math.max(6,Math.round(width/.52));
   for(const side of [-1,1]){
    for(const z of [.7,.91])this.box([0,profile(z)-.42,side*z*depth/2],[width,.2,.22],wood);
    for(let i=0;i<=count;i++){
     const x=-width/2+i*width/count;
     this.beam([x,profile(.68)-.32,side*.68*depth/2],[x,.04,side*(depth/2+.04)],.12,trim);
     this.cylinder([x,.38,side*(depth/2-.03)],[x,.38,side*(depth/2+.13)],.105,color,10);
    }
    const x=side*(width/2+.12);
    this.box([x,rise+.45,0],[.23,.65,.62],color);
    this.ball([x,rise+.83,0],[.19,.27,.23],color);
    this.cylinder([x-side*.14,rise+.51,0],[x+side*.14,rise+.51,0],.12,trim,10);
   }
  });
 }
 bracket(x:number,y:number,z:number,angle=0){this.scoped([x,y,z],angle,()=>{
  this.box([0,0,0],[.66,.2,.68],dark);
  this.box([0,.19,.12],[1,.2,.8],wood);
  this.box([0,.39,.23],[1.3,.17,1],trim);
  for(const side of [-1,1]){this.beam([side*.15,-.35,0],[side*.53,.19,.38],.17,wood);this.box([side*.48,.28,.33],[.24,.28,.35],wood);}
 });}
 gable(p:V,width:number,roofDepth:number,rise:number,color:string,angle:number){this.scoped(p,angle,()=>{
  this.emit(`shrine:closedgable:${width}:${roofDepth}:${rise}`,()=>{
   const shape=new T.Shape();shape.moveTo(-width/2,0);shape.lineTo(width/2,0);
   for(let i=0;i<=32;i++){const x=width/2-i*width/32,u=Math.abs(x)/(roofDepth/2);shape.lineTo(x,rise*(1-u**.78)+.34*u**6-.24);}
   shape.closePath();return new T.ShapeGeometry(shape);
  },color,[0,0,0]);
 });}
 stoneBase(w:number,d:number){this.foundation(w,d);for(const side of [-1,1]){
  for(let i=0;i<Math.ceil(w/1.25);i++){const n=Math.ceil(w/1.25),bw=(w+1.6)/n;this.box([-(w+1.6)/2+(i+.5)*bw,.3,side*(d/2+.82)],[bw-.045,.49,.045],i%3===0?'#92968b':stone);}
  for(let i=0;i<Math.ceil(d/1.2);i++){const n=Math.ceil(d/1.2),bd=(d+1.6)/n;this.box([side*(w/2+.82),.3,-(d+1.6)/2+(i+.5)*bd],[.045,.49,bd-.045],i%3===0?'#92968b':stone);}
  this.box([0,.65,side*(d/2+.6)],[w+1.66,.12,.45],'#bebdaf');this.box([side*(w/2+.6),.65,0],[.45,.12,d+.8],'#bebdaf');
 }}
 lattice(x:number,y:number,z:number,w:number,h:number,angle=0){this.scoped([x,y,z],angle,()=>{this.litBox([0,0,0],[w,h,.12],paper);for(let i=0;i<=Math.round(w/.55);i++)this.box([-w/2+i*w/Math.round(w/.55),0,.08],[.065,h,.08],wood);for(let j=0;j<=Math.round(h/.68);j++)this.box([0,-h/2+j*h/Math.round(h/.68),.09],[w,.065,.08],wood);});}
 lantern(x:number,z:number,scale=1){this.scoped([x,0,z],0,()=>{this.box([0,.2,0],[1.35*scale,.4*scale,1.35*scale],stone);this.box([0,1.1*scale,0],[.55*scale,1.8*scale,.55*scale],stone);this.box([0,2.05*scale,0],[1.3*scale,.22*scale,1.3*scale],stone);this.litBox([0,2.5*scale,0],[.85*scale,.8*scale,.85*scale],'#e0c78d','lamp');for(const x of [-.47,.47])for(const z of [-.47,.47])this.box([x*scale,2.5*scale,z*scale],[.16*scale,.85*scale,.16*scale],stone);this.emit('shrine:lanternroof',()=>new T.ConeGeometry(1,1,4),stone,[0,3.15*scale,0],[1.25*scale,.6*scale,1.25*scale],new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),Math.PI/4));this.ball([0,3.6*scale,0],[.22*scale,.3*scale,.22*scale],stone);});}
 finish(){const root=new T.Group();for(const {g,m,matrices} of this.buckets.values()){
  if(matrices.length===1){const mesh=new T.Mesh(g,m);mesh.matrix.copy(matrices[0]);mesh.matrix.decompose(mesh.position,mesh.quaternion,mesh.scale);mesh.matrixAutoUpdate=false;root.add(mesh);continue;}
  const mesh=new T.InstancedMesh(g,m,matrices.length);matrices.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingBox();mesh.computeBoundingSphere();root.add(mesh);
 }return root;}
}

export function makeShrineMesh(o:IslandObject,cache:Cache){
 const b=new Builder(cache),{width:w,depth:d,wallHeight:h,roofColor:roof,wallColor:wall}=o.params;
 if(o.templateId==='shrine_main'){
  b.stoneBase(w,d);b.box([0,.95,0],[w+.5,.5,d+.5],dark);
  b.box([0,h/2+.8,0],[w,h,d],wall);
  for(const x of [-w/2,0,w/2])for(const z of [-d/2,d/2]){b.box([x,h/2+.7,z],[.48,h+.6,.48],wood);b.box([x,h+.65,z],[.9,.25,.9],trim);}
  for(const z of [-d/2,d/2])for(const y of [1.1,h*.5,h+.45])b.box([0,y,z+.04],[w+.5,.26,.32],wood);
  for(const x of [-w/2,w/2]){b.box([x,h+.45,0],[.28,.3,d+.7],wood);b.lattice(x+(x<0?-.08:.08),h*.53+.7,0,d*.65,h*.64,x<0?-Math.PI/2:Math.PI/2);}
  // Framed gables close the space below the roof; dark joints articulate the timber base.
  for(const side of [-1,1]){
   b.gable([side*(w/2+.02),h+.8,0],d,d+4,3.3,wall,side*Math.PI/2);
   b.scoped([side*w/2,h+.8,0],side*Math.PI/2,()=>{
    b.beam([-d/2,0,.05],[0,2.9,.05],.19,wood);b.beam([0,2.9,.05],[d/2,0,.05],.19,wood);
    b.box([0,1.25,.08],[.2,2.5,.18],wood);b.box([0,.8,.09],[d*.65,.18,.18],wood);
   });
   b.box([side*(w/2+.035),1.35,0],[.06,.85,d],wood);
   for(let i=0;i<=Math.round(d/.48);i++)b.box([side*(w/2+.08),1.35,-d/2+i*d/Math.round(d/.48)],[.13,.85,.045],dark);
   for(const x of [-w/2,0,w/2])b.bracket(x,h+.35,side*d/2,side<0?Math.PI:0);
   b.box([0,1.35,side*(d/2+.035)],[w,.85,.06],wood);
   for(let i=0;i<=Math.round(w/.5);i++)b.box([-w/2+i*w/Math.round(w/.5),1.35,side*(d/2+.08)],[.045,.85,.13],dark);
  }
  // Front wooden sliding doors, with dark recesses behind the slats.
  b.box([0,h*.47+.8,d/2+.1],[w*.53,h*.8,.2],dark);
  for(const x of [-w*.14,w*.14]){b.lattice(x,h*.6+.8,d/2+.26,w*.25,h*.5);b.box([x,1.6,d/2+.3],[w*.25,1.1,.2],wood);}
  for(let x=-w/2;x<=w/2;x+=.75)b.box([x,h+.65,0],[.16,.3,d+2.1],trim);
  b.detailedRoof([0,h+.8,0],w+3.6,d+4,3.3,roof);
  // Front gabled canopy and support brackets.
  b.detailedRoof([0,h+.24,d/2+.7],4.6,7.6,1.85,roof,Math.PI/2);
  for(const x of [-3.25,3.25]){b.box([x,h/2+1,d/2+1],[.35,h,.35],wood);b.beam([x, h-1,d/2+1],[x*.6,h+.1,d/2+1],.2,trim);}
  for(const x of [-3.25,3.25]){b.bracket(x,h-.15,d/2+1);b.box([x,.95,d/2+1],[.6,.26,.6],stone);}
  b.box([0,h+.42,d/2+3.06],[5.9,.24,.24],wood);
  b.beam([-2.65,h+.45,d/2+3.06],[0,h+1.95,d/2+3.06],.16,trim);b.beam([0,h+1.95,d/2+3.06],[2.65,h+.45,d/2+3.06],.16,trim);
  b.ball([0,h+1.22,d/2+3.2],[.22,.26,.08],'#bca168');
  for(let i=0;i<6;i++){const a=i*Math.PI/3;b.ball([Math.cos(a)*.3,h+1.22+Math.sin(a)*.3,d/2+3.18],[.18,.17,.06],'#bca168');}
  for(const x of [-w*.27,w*.27])for(const y of [2.05,h*.65])b.box([x,y,d/2+.42],[.24,.16,.05],'#a48a54');
  // Bell, static braided bell-rope, tassel and offering box.
  b.ball([0,h-.1,d/2+1.8],[.4,.45,.4],'#aa8952');
  for(let i=0;i<64;i++){const a=i/64*Math.PI*12,c=(i+1)/64*Math.PI*12,y=h-.5-i*(h-2.4)/64,ny=h-.5-(i+1)*(h-2.4)/64;b.cylinder([Math.cos(a)*.09,y,d/2+1.8+Math.sin(a)*.09],[Math.cos(c)*.09,ny,d/2+1.8+Math.sin(c)*.09],.08,'#d4bb7a',5);}
  for(let i=0;i<9;i++)b.cylinder([0,2.2,d/2+1.8],[(i-4)*.055,1.65,d/2+1.8],.035,'#d4bb7a',5);
  b.box([0,1.05,d/2+3],[3.5,1.5,1.45],wood);for(let i=0;i<12;i++)b.box([-1.6+i*.29,1.85,d/2+3],[.14,.14,1.5],trim);
 }else if(o.templateId==='shrine_torii'){
  for(const side of [-1,1]){const x=side*w*.34;b.cylinder([x,0,0],[x*.95,h*.91,0],.48,red,12);b.cylinder([x,0,0],[x,.6,0],.58,dark,12);b.box([x,0,0],[1.5,.3,1.5],stone);b.box([x,h*.68,0],[.7,.6,1],red);}
  b.box([0,h*.68,0],[w*.95,.5,.45],red);b.box([0,h*.94,0],[w+1.4,.48,.85],red);
  for(let i=0;i<16;i++){const x=-w*.6+i*w*1.2/16,n=x+w*1.2/16;const y=h+Math.pow(Math.abs(x)/(w*.6),4)*.65,ny=h+Math.pow(Math.abs(n)/(w*.6),4)*.65;b.beam([x,y,0],[n,ny,0],.58,dark);}
  b.box([0,h*.82,0],[1.25,1.25,.28],trim);b.sign('神社',[0,h*.82,.18],[.9,1]);
  for(let i=0;i<32;i++){const x=-w*.32+i*w*.64/32,n=x+w*.64/32,y=h*.61-.34*(1-(x/(w*.32))**2),ny=h*.61-.34*(1-(n/(w*.32))**2);b.cylinder([x,y,.34],[n,ny,.34],.07,'#c6ae78',8);}
  for(const x of [-w*.22,-w*.08,w*.08,w*.22]){const y=h*.61-.34*(1-(x/(w*.32))**2);for(let i=0;i<4;i++)b.beam([x+(i%2)*.13,y-i*.23,.36],[x+((i+1)%2)*.13,y-(i+1)*.23,.36],.14,paper);}
  for(const side of [-1,1]){const x=side*(w*.55+1);b.box([x,.6,1],[1.5,1.2,1.5],stone);b.ball([x,1.6,1],[.4,.65,.4],stone);b.ball([x,2.25,1],[.35,.3,.3],stone);for(const ear of [-1,1])b.ball([x+ear*.2,2.5,1],[.1,.25,.12],stone);b.box([x,1.8,1.31],[.6,.3,.06],red);}
 }else if(o.templateId==='shrine_temizu'){
  b.stoneBase(w,d);for(const x of [-w*.4,w*.4])for(const z of [-d*.4,d*.4]){b.box([x,h/2+.5,z],[.28,h,.28],wood);b.box([x,.7,z],[.6,.3,.6],stone);}
  b.detailedRoof([0,h+.45,0],w+2,d+2,1.6,roof);for(const z of [-d*.4,d*.4])b.box([0,h+.2,z],[w,.25,.3],wood);
  for(const x of [-w*.4,w*.4])for(const z of [-d*.4,d*.4]){b.bracket(x,h-.15,z,z<0?Math.PI:0);b.beam([x,h-1,z],[x*.55,h+.1,z],.15,wood);}
  const bw=w*.58,bd=d*.48;b.box([0,1.1,0],[bw,1,bd],stone);for(const x of [-bw/2,bw/2])b.box([x,1.85,0],[.3,.65,bd+.3],stone);for(const z of [-bd/2,bd/2])b.box([0,1.85,z],[bw+.3,.65,.3],stone);b.box([0,1.75,0],[bw-.3,.08,bd-.3],'#699ea0');
  for(const x of [-.55,.55])b.cylinder([x,2.23,-bd*.7],[x,2.23,bd*.7],.07,'#a7aa63',8);for(let i=0;i<3;i++){const x=-.7+i*.65;b.cylinder([x,2.35,-.4],[x,2.35,.75],.045,'#b39967',6);b.cylinder([x,2.3,-.65],[x,2.55,-.65],.2,'#b39967',12);}
  for(let i=0;i<3;i++){const x=-.7+i*.65;b.cylinder([x,2.55,-.65],[x,2.565,-.65],.15,dark,12);}
  b.cylinder([bw*.35,1,-bd*.7],[bw*.35,2.8,-bd*.7],.1,'#8c9255',10);b.cylinder([bw*.35,2.7,-bd*.7],[bw*.35,2.7,-bd*.12],.1,'#a4ac6d',10);
 }else if(o.templateId==='shrine_office'||o.templateId==='shrine_residence'){
  const office=o.templateId==='shrine_office';b.stoneBase(w,d);b.box([0,.8,0],[w+.2,.35,d+.3],dark);b.box([0,h/2+.7,0],[w,h,d],wall);
  for(const x of [-w/2,0,w/2])for(const z of [-d/2,d/2])b.box([x,h/2+.6,z],[.3,h+.4,.3],wood);
  for(const z of [-d/2,d/2])for(const y of [1,h+.4])b.box([0,y,z],[w+.4,.23,.3],wood);
  b.detailedRoof([0,h+.55,0],w+2.8,d+3,2.1,roof);
  for(const x of [-w/2,0,w/2])for(const z of [-d/2,d/2])b.bracket(x,h-.1,z,z<0?Math.PI:0);
  for(const side of [-1,1]){b.gable([side*(w/2+.02),h+.55,0],d,d+3,2.1,wall,side*Math.PI/2);b.box([side*(w/2+.035),1.25,0],[.06,.8,d],wood);for(let i=0;i<=Math.round(d/.5);i++)b.box([side*(w/2+.08),1.25,-d/2+i*d/Math.round(d/.5)],[.13,.8,.045],dark);b.lattice(side*(w/2+.09),h*.53+.65,0,d*.55,h*.55,side*Math.PI/2);}
  if(office){
   b.box([0,h*.48+.7,d/2+.1],[w*.78,h*.7,.18],dark);b.box([0,1.65,d/2+.7],[w*.9,.32,1.4],wood);
   for(const x of [-w*.43,w*.43])b.cylinder([x,.8,d/2+.65],[x,h+.4,d/2+.65],.3,red,10);
   for(let i=0;i<7;i++)b.box([-w*.34+i*w*.113,h*.76+.5,d/2+.3],[w*.1,1.2,.12],'#c5a865');
   b.sign('授与所',[0,h+.12,d/2+.4],[w*.47,.8]);
   for(const x of [-w*.28,w*.28]){b.box([x,1.95,d/2+.7],[2.6,.3,.85],trim);for(let i=0;i<5;i++)b.box([x-.9+i*.45,2.2,d/2+.7],[.3,.35,.14],['#a15c54','#d9c59d','#527880','#84708f','#ccad67'][i]);}
   b.sign('祈祷受付',[-w*.32,2.85,d/2+.55],[1.6,1.25]);
  }else{
   const porch=d/2+1.25;for(let i=0;i<Math.ceil(w/.5);i++)b.box([-w/2+i*.5,1.05,porch],[.46,.24,2.4],i%2?wood:'#856444');
   for(const x of [-w*.45,0,w*.45])b.box([x,.35,porch],[.25,1.3,.25],wood);
   for(let i=0;i<4;i++){const x=-w*.36+i*w*.24;if(i===2){b.box([x,h*.46+.85,d/2+.08],[w*.23,h*.8,.2],dark);b.box([x,1.18,d/2-.8],[w*.23,.06,1.8],'#a3a074');}else b.lattice(x,h*.46+.85,d/2+.2,w*.23,h*.8);}
   // Static glass wind chime and paper strip at the veranda eave.
   b.cylinder([-w*.35,h+.4,porch],[-w*.35,h-.15,porch],.02,dark,5);b.ball([-w*.35,h-.35,porch],[.22,.23,.22],'#c4d7cd');b.box([-w*.35,h-1,porch],[.15,.7,.015],'#bdcebf');
   b.box([0,.43,d/2+2.9],[3,.8,1],stone);
  }
 }else if(o.templateId==='shrine_court'){
  b.box([0,-.12,0],[w,.22,d],'#b3ad98');const nx=Math.round(w/1.8),nz=Math.round(d/1.8);for(let i=0;i<nx;i++)for(let j=0;j<nz;j++)b.box([-w/2+(i+.5)*w/nx,.045,-d/2+(j+.5)*d/nz],[w/nx-.055,.12,d/nz-.055],['#c0b8a4','#b8b09d','#c9bfaa'][(i*7+j*3)%3]);
  b.lantern(-w*.43,d*.3,.8);b.lantern(w*.43,d*.3,.8);
 }else if(o.templateId==='shrine_path'){
  // Right-hand fork: south to the relocated office, north into the residential garden.
  const routes:[number,number][][]=[[[-w/6,d/8],[w/3,d/8],[w/3,d/6]],[[w/12,d/8],[w/12,-d*5/12]]];
  for(const nodes of routes)for(let n=0;n<nodes.length-1;n++){const a=nodes[n],c=nodes[n+1],dx=c[0]-a[0],dz=c[1]-a[1],length=Math.hypot(dx,dz),count=Math.ceil(length/1.4);for(let i=0;i<count;i++)b.box([a[0]+dx*(i+.5)/count,.04,a[1]+dz*(i+.5)/count],[2.7,.16,length/count-.04],i%2?'#b7ae97':'#c2b79f',Math.atan2(dx,dz));}
 }else if(o.templateId==='shrine_garden'){
  for(let i=0;i<10;i++){const z=-d*.43+i*d*.09,x=Math.sin(i*.6)*w*.12;b.ball([x,.1,z],[1.1,.16,.7],i%2?'#a7aaa0':'#b8b7a8');}
  for(let i=1;i<=4;i++)b.ball([i*1.65,.1,-2],[.85,.16,.65],stone);
  b.lantern(w*.18,-d*.2,1);b.lantern(-w*.3,d*.3,.7);
  for(let i=0;i<20;i++){const side=i%2?-1:1,x=side*w*.4+(i%3)*.25,z=-d*.48+Math.floor(i/2)*d*.1;b.ball([x,.22,z],[.65,.3,.5],['#798779','#8c9384','#9aa18b'][i%3]);for(let j=0;j<3;j++)b.ball([x+Math.sin(i+j)*.3,.6+j*.2,z],[.6,.45,.6],['#55745b','#678063','#789173'][j]);}
  for(let i=0;i<12;i++){const x=-w/2+i*w/11;if(Math.abs(x)>1.4)b.cylinder([x,0,d/2],[x,2.1,d/2],.09,'#9d9665',6);}for(const y of [.65,1.6])for(const side of [-1,1])b.cylinder([side*1.4,y,d/2],[side*w/2,y,d/2],.09,'#8b8051',6);
 }
 return b.finish();
}
