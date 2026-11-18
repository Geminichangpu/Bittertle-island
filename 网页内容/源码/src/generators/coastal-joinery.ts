import * as T from 'three';
import type {Builder} from './shrine';

type Point=[number,number,number];

function patch(uCount:number,vCount:number,point:(u:number,v:number)=>Point){
 const points:number[]=[],uv:number[]=[],faces:number[]=[];
 for(let v=0;v<=vCount;v++)for(let u=0;u<=uCount;u++){
  points.push(...point(u/uCount,v/vCount));uv.push(u/uCount,v/vCount);
  if(u<uCount&&v<vCount){const i=v*(uCount+1)+u;faces.push(i,i+1,i+uCount+2,i,i+uCount+2,i+uCount+1);}
 }
 const g=new T.BufferGeometry();
 g.setAttribute('position',new T.Float32BufferAttribute(points,3));
 g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(faces);g.computeVertexNormals();return g;
}

export function awning(b:Builder,w:number,z:number){
 for(let i=0;i<7;i++){
  const x=(i-3)*w*.14,c=i%2?'#668998':'#ede2c9';
  b.emit('restaurant:canvas',()=>patch(14,10,(u,v)=>[u-.5,-.17*v-.09*Math.sin(Math.PI*v)-.021*Math.cos(Math.PI*4*u),.76-v*1.52]),c,[x,3.12,z],[w*.14,1,1]);
  b.emit('restaurant:valance',()=>patch(20,3,(u,v)=>[u-.5,-.16+.16*v-.075*Math.sin(u*Math.PI)*(1-v)-.021*Math.cos(Math.PI*4*u),.76+.007*Math.sin(Math.PI*u)]),c,[x,3.12,z],[w*.14,1,1]);
 }
 for(const side of [-1,1])b.beam([side*w*.45,2.62,z-.67],[side*w*.45,3.10,z+.74],.042,'#777b70');
 b.cylinder([-w*.49,3.09,z+.73],[w*.49,3.09,z+.73],.027,'#998969',12);
}

export function cabinJoinery(b:Builder,w:number,depth:number,h:number,z:number,variant:number,shop:boolean){
 const copper=['#69786e','#826c55','#778485'][variant],front=z+depth*.5;
 for(const side of [-1,1]){
  const end=z+side*(depth*.5+.83),top=h+.51;
  b.cylinder([-w*.5-.85,top,end],[w*.5+.85,top,end],.074,copper,12);
  for(let i=0;i<=Math.ceil(w/1.4);i++){const x=(i/Math.ceil(w/1.4)-.5)*w;b.box([x,top-.025,end],[.047,.15,.15],'#675f50');}
  const x=(variant===2?1:-1)*(w*.49),wall=z+side*(depth*.5+.11);
  b.cylinder([x,top-.03,end],[x,top-.4,wall],.061,copper,12);
  b.cylinder([x,top-.4,wall],[x,.56,wall],.061,copper,12);
  b.cylinder([x,.56,wall],[x,.40,wall+side*.24],.061,copper,12);
  for(const y of [1,h*.65])b.box([x,y,wall],[.155,.065,.15],'#9a8971');
  b.scoped([side*(w/2+.024),h*.61+.5,z],side*Math.PI/2,()=>{
   const ww=depth*(shop?.46:.39),wh=h*.39;
   for(const edge of [-1,1]){
    const sx=edge*ww*.66,sw=ww*.255;
    b.box([sx,0,.115],[sw,wh+.13,.09],'#685f4b');
    for(const jamb of [-1,1])b.box([sx+jamb*(sw*.5-.038),0,.19],[.075,wh+.13,.07],copper);
    for(const y of [-wh/2,wh/2])b.box([sx,y,.19],[sw,.095,.07],copper);
    const count=Math.max(5,Math.ceil(wh/.18));
    for(let i=0;i<count;i++)b.emit('shrine:box',()=>new T.BoxGeometry(1,1,1),copper,[sx,(i+.5-count/2)*wh/count,.174],[sw-.105,wh/count*.85,.063],new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),-.36));
   }
  });
 }
 const joists=Math.max(1,Math.floor(w/1.15));
 for(let i=0;i<=joists;i++)b.box([(i/joists-.5)*w*.87,.46,front+.73],[.10,.18,1.61],'#785e49');
}

export function shelterFittings(b:Builder,w:number,d:number,variant:number){
 const trim=['#637f83','#9a7862','#7b856b','#727e90'][variant],x=w*.6,z=d*.2+.066;
 b.box([x,2.79,z],[.92,.52,.045],'#e1d6bf');
 for(const h of [2.51,3.07])b.box([x,h,z+.022],[1.02,.043,.067],trim);
 for(const dx of [-.49,.49])b.box([x+dx,2.79,z+.022],[.043,.59,.067],trim);
 for(let i=0;i<4;i++){const dx=(i-1.5)*.185;b.cylinder([x+dx,2.77,z+.025],[x+dx,2.77,z+.059],i===variant?.037:.023,trim,16);}
 b.box([x,2.77,z+.033],[.565,.014,.014],trim);
 for(const dx of [-.42,.42])for(const h of [2.57,3.01])b.cylinder([x+dx,h,z+.030],[x+dx,h,z+.048],.014,'#827d72',8);
 for(const side of [-1,1])for(const end of [-1,1]){
  const px=side*w*.45,pz=end*d*.36;
  for(const ax of [-1,1])for(const az of [-1,1])b.cylinder([px+ax*.105,.49,pz+az*.105],[px+ax*.105,.522,pz+az*.105],.021,'#726e5e',6);
 }
 for(const sx of [-.29,0,.29])b.beam([w*sx,.73,-d*.25-.22],[w*sx,1.25,-d*.25-.36],.075,trim);
 for(const y of [1.0,1.19])b.box([0,y,-d*.25-.31-(y-1)*.23],[w*.70,.12,.05],trim);
}

export function clinkerDinghy(b:Builder,x:number,y:number,z:number){
 b.scoped([x,y,z],0,()=>{
  const point=(u:number,v:number,side:number):Point=>{
   const breadth=.024+.92*Math.pow(Math.max(0,Math.sin(Math.PI*u)),.69)*(.91+.14*(1-u));
   return [side*breadth*(.19+.81*Math.sin(v*Math.PI*.51)),.025+.39*v+.14*(u**4+(1-u)**4),-1.74+3.79*u];
  };
  for(const side of [-1,1])for(let row=0;row<6;row++){
   const a=row/6,c=(row+1)/6;
   b.emit('pier:strake:'+side+':'+row,()=>patch(24,3,(u,v)=>{
    const p=point(side>0?1-u:u,a+(c-a)*v,side);p[0]+=side*.012*(1-v);return p;
   }),['#845844','#92664e','#a9785b','#aa785a','#a76f50','#b58d68'][row],[0,0,0]);
   b.emit('pier:inside-strake:'+side+':'+row,()=>patch(24,2,(u,v)=>{
    const p=point(side>0?u:1-u,a+(c-a)*v,side);p[0]*=.965;return p;
   }),row%2?'#a88b67':'#a18562',[0,0,0]);
   if(row===5)for(let i=0;i<22;i++)b.cylinder(point(i/22,1,side),point((i+1)/22,1,side),.036,'#755c43',10);
  }
  for(const t of [.21,.41,.63,.79]){
   const right=point(t,.84,1),span=right[0]*2;
   b.box([0,right[1],right[2]],[span,.052,.15],'#bc9b70');
   for(const side of [-1,1])for(let j=0;j<5;j++)b.beam(point(t,j/5,side),point(t,(j+1)/5,side),.035,'#846747');
  }
  for(let j=-1;j<=1;j++)b.box([j*.14,.105,0],[.12,.04,1.67],'#9d805f');
 });
}

export function villaStonework(b:Builder,width:number,depth:number,z:number){
 for(const side of [-1,1])for(const stage of [3,7.2])for(const offset of [-.37,-.19,.19,.37]){
  const x=offset*width,face=z+side*(depth*.5+.245);
  for(let k=0;k<13;k++){
   const t=(k+.5)*Math.PI/13;
   const rotation=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),Math.atan2(.60*Math.cos(t),-1.16*Math.sin(t)));
   b.emit('shrine:box',()=>new T.BoxGeometry(1,1,1),k%3?'#d4c7ae':'#cbbca2',[x+1.16*Math.cos(t),stage+1.30+.60*Math.sin(t),face],[Math.hypot(1.16*Math.sin(t),.60*Math.cos(t))*.238,.145,.225],rotation);
  }
  for(const k of [-1,0,1]){
   const t=Math.PI/2+k*.68;
   b.beam([x,stage+1.31,face+side*.025],[x+1.08*Math.cos(t),stage+1.31+.51*Math.sin(t),face+side*.025],.042,'#dfd9c6');
  }
 }
 for(const dx of [-1.7,1.7])for(const [y,r,h] of [[.92,.31,.15],[1.06,.26,.12],[4.04,.22,.12],[4.17,.26,.10]]){
  b.cylinder([dx,y-h/2,z+depth/2+.8],[dx,y+h/2,z+depth/2+.8],r,'#d2c7af',24);
 }
 for(let j=0;j<9;j++){
  const px=-1.85+j*.46,pz=z+depth/2+1.6;
  b.emit('villa:turned-baluster',()=>new T.LatheGeometry([[.094,0],[.1,.06],[.072,.095],[.052,.17],[.092,.30],[.087,.4],[.037,.62],[.052,.74],[.080,.8]].map(([r,y])=>new T.Vector2(r,y)),16),'#d8cfb9',[px,4.59,pz]);
 }
}
