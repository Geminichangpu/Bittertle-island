import {makeSettlement} from './settlement.ts';
import * as T from 'three';
import type {IslandObject} from '../data/model.ts';
import {Builder,type Cache} from './shrine.ts';
import {boulderGeometry,crownGeometry,leafSprigGeometry} from '../environment/nature-geometry.ts';
import {COAST_ROCK} from '../data/scenic-site.ts';
import {cliffSections,naturalCliffGeometry,cliffLipGeometry} from './coastal-cliff.ts';
type V=[number,number,number];
const bark='#775f57',rock='#c0c7c4',grass='#91ad69',pink=['#f8dce5','#f3bfd3','#e8a4c2','#fff0ed'];
function blossom(){
 const vertices:number[]=[],colors:number[]=[];
 for(let petal=0;petal<5;petal++){
  const a=petal*Math.PI*2/5,pts:V[]=[[0,.045,0],[.12,.02,-.075],[.23,0,-.052],[.205,.015,0],[.23,0,.052],[.12,.02,.075]];
  for(let j=1;j<pts.length-1;j++)for(const index of [0,j,j+1]){const [x,y,z]=pts[index];vertices.push(Math.cos(a)*x-Math.sin(a)*z,y,Math.sin(a)*x+Math.cos(a)*z);const shade=index===0?.72:1;colors.push(shade,shade,shade);}
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();return g;
}
export function makeScenicMesh(o:IslandObject,cache:Cache){
 if(o.templateId==='scenic_academy'||o.templateId==='scenic_farm')return makeSettlement(o,cache);
 const b=new Builder(cache),root=new T.Group();
 const q=(angle:number)=>new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),angle);
 const stone=(p:V,s:V,variant=0)=>b.emit('scenic:rock:'+variant,()=>boulderGeometry(variant),rock,p,s,q(variant*1.7));
 const sprig=(p:V,s=1)=>b.emit('scenic:leaf-sprig',leafSprigGeometry,grass,p,[s,s,s]);
 const branchVertices:number[]=[],branchUV:number[]=[],branchIndices:number[]=[];
 function branch(points:V[],radius:number){
  const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),steps=Math.max(12,(points.length-1)*10),sides=12;
  // Rings share vertices across bends: no disconnected cylinder end caps.
  const tube=new T.TubeGeometry(curve,steps,1,sides,false),pos=tube.getAttribute('position'),uv=tube.getAttribute('uv'),offset=branchVertices.length/3;
  for(let i=0;i<=steps;i++){
   const center=curve.getPointAt(i/steps),r=radius*(1-.76*i/steps);
   for(let j=0;j<=sides;j++){const k=i*(sides+1)+j,v=new T.Vector3().fromBufferAttribute(pos,k).sub(center).multiplyScalar(r).add(center);branchVertices.push(v.x,v.y,v.z);branchUV.push(uv.getY(k),i/steps*curve.getLength()/2);}
  }
  for(const k of tube.index!.array)branchIndices.push(offset+k);
  for(const end of [0,steps]){const center=curve.getPointAt(end/steps),cap=branchVertices.length/3;branchVertices.push(center.x,center.y,center.z);branchUV.push(.5,end/steps);for(let j=0;j<sides;j++){const a=offset+end*(sides+1)+j;branchIndices.push(cap,...(end===0?[a+1,a]:[a,a+1]));}}
  tube.dispose();
  // Keep per-segment collision proxies; a merged canopy bounds box would block the clearing.
  for(let i=0;i<points.length-1;i++){
   const a=new T.Vector3(...points[i]),c=new T.Vector3(...points[i+1]),delta=c.clone().sub(a),r=radius*(1-.76*i/(points.length-1));
   b.emit('scenic:branch-collider',()=>new T.CylinderGeometry(1,1,1,8),'#cad4d0',a.add(c).multiplyScalar(.5).toArray() as V,[r,delta.length()+.1,r],new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize()));
  }
 }
 function tree(x:number,z:number,h:number){
  branch([[x,-.3,z],[x+.15,h*.45,z-.2],[x-.1,h*.76,z]],.28);
  for(let j=0;j<4;j++){const a=j*2.4;branch([[x,h*.42,z],[x+Math.cos(a)*.9,h*.72,z+Math.sin(a)*.9]],.12);b.emit('scenic:green-crown',crownGeometry,j%2?'#6f9a69':'#8eb277',[x+Math.cos(a),h*.8+j%2*.8,z+Math.sin(a)],[1.7,1.8,1.7]);}
 }
 function seatRock(){
  const g=()=>{const mesh=boulderGeometry(1),p=mesh.getAttribute('position');for(let i=0;i<p.count;i++)p.setY(i,Math.min(.58,p.getY(i)));mesh.computeVertexNormals();return mesh;};
  // A broad sitting stone: top 0.98 above ground, below knee-to-seat height
  // relative to the 2.36-unit walker. Its lower portion remains planted in soil.
  b.emit('scenic:seat-boulder',g,rock,[0,.4,0],[4.3,1,3.1],q(.1));
  for(let i=0;i<16;i++){const a=i*2.4;stone([Math.cos(a)*3.8,.1,Math.sin(a)*2.9],[.38,.18,.32],i%3);sprig([Math.cos(a)*4.3,.05,Math.sin(a)*3.2],1.25);}
  for(let i=0;i<5;i++)b.cylinder([-3.3+i*1.2,.64+(i%2)*.11,2.5],[-2.8+i*1.2,.2,2.75],.018,'#7d8c8b',5);
 }
 if(o.templateId==='scenic_sakura'){
  branch([[0,-.4,0],[-.35,2.5,.15],[.2,5.8,-.2],[-.5,8.8,-.5],[0,12.8,-.8]],1.05);
  for(let i=0;i<9;i++){const a=i*2.4;branch([[0,.9,0],[Math.cos(a)*1.5,.45,Math.sin(a)*1.5],[Math.cos(a)*3.2,.04,Math.sin(a)*3.2]],.5);}
  for(let limb=0;limb<11;limb++){
   const a=limb*2.4,r=8+(limb%3)*1.4,y=7+(limb%4)*1.1,tip:V=[Math.cos(a)*r,y+3,Math.sin(a)*r*.85];
   branch([[0,4.7+(limb%3),0],[Math.cos(a)*r*.42,y,Math.sin(a)*r*.4],[tip[0]*.8,y+1.1,tip[2]*.8],tip],.46-(limb%3)*.045);
   for(let twig=0;twig<4;twig++){
    const ta=a+(twig-1.5)*.42,rr=r*.65+twig*.85,c:V=[Math.cos(ta)*rr,y+2.5+Math.sin(twig*1.8)*1.2,Math.sin(ta)*rr*.85];
    branch([[tip[0]*.68,y+.8,tip[2]*.68],[c[0],c[1]-.45,c[2]]],.11);
    b.emit('scenic:flower-cloud',crownGeometry,pink[(limb+twig)%3],c,[2.2,1.25,1.8]);
    // Individual notched five-petal flowers sit around each cloud's silhouette.
    for(let k=0;k<50;k++){
     const az=k*2.39996+twig,ny=1-2*(k+.5)/50,rh=Math.sqrt(1-ny*ny),flower:V=[c[0]+Math.cos(az)*rh*2.22,c[1]+ny*1.28,c[2]+Math.sin(az)*rh*1.82];
     const rotation=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(Math.cos(az)*rh,ny,Math.sin(az)*rh));
     b.emit('scenic:blossom',blossom,pink[(k+limb)%4],flower,[.9,.9,.9],rotation);
    }
   }
  }
  for(let i=0;i<170;i++){const a=i*2.39996,r=2+Math.sqrt((i+.5)/170)*9;b.emit('scenic:fallen-petal',()=>new T.SphereGeometry(1,6,3),'#f7ccdc',[Math.cos(a)*r,.75*Math.max(0,1-r/9)**2+.03,Math.sin(a)*r],[.12,.018,.065],q(a));}
  for(let i=0;i<20;i++){const a=i*2.4,r=7+(i%4);sprig([Math.cos(a)*r,.1,Math.sin(a)*r],1.2);}
 }else if(o.templateId==='scenic_north_rock'){
  seatRock();
 }else{
  const h=o.params.wallHeight;
  b.emit('scenic:cliff-face:'+h,()=>naturalCliffGeometry(h),'#e0dfd9',[0,0,0]);
  b.emit('scenic:cliff-lip',cliffLipGeometry,'#d4dbbd',[0,0,0]);
  const edge=cliffSections();
  for(let i=0;i<edge.length-1;i++){
   const p=edge[i],c=edge[i+1],length=Math.hypot(c.x-p.x,c.z-p.z);
   if(i%2===0)sprig([p.x-p.nx*(1.8+.6*Math.sin(i)),.08,p.z-p.nz*(1.8+.6*Math.sin(i))],1.2+(i%3)*.17);
   // Invisible walking boundary follows the natural rim; no visible retaining wall.
   b.box([(p.x+c.x)/2-p.nx*.38,.8,(p.z+c.z)/2-p.nz*.38],[length+.25,1.6,.24],'#cad4d0',-Math.atan2(c.z-p.z,c.x-p.x));
  }
  b.scoped(COAST_ROCK,0,seatRock);
  // Two staggered woodland rows wrap the inland side while the sea view stays open.
  for(const [x,z,h] of [[-19,-20,8],[-17,-15,9],[-20,-10,7.8],[-18,-5,9.3],[-20,0,8.4],[-18,5,9],[-19,10,8],[-17,10,7.8],[-14,-22,7.4],[-13,-17,8.3],[-14,-11,7.5],[-12,-5,8.2],[-13,1,7.4],[-12,7,8],[-10,11,7.5],[-8,8,6.8]] as V[])if(z<=3||x>=-5)tree(x,z,h);
  for(let i=0;i<18;i++){const x=-20+(i%3)*3.7,z=-21+Math.floor(i/3)*4.6;b.emit('scenic:green-crown',crownGeometry,i%2?'#6f9a69':'#8eb277',[x,.65,z],[1.7,.85,1.5]);sprig([x+1,.05,z+.5],1.7);}
  for(let i=0;i<34;i++){const x=-12+(i%4)*1.3,z=-21+Math.floor(i/4)*5.4;sprig([x,.05,z],1.4);if(i%3===0)stone([x,.25,z],[.65,.45,.55],i%3);}
 }
 if(branchVertices.length)b.emit('scenic:continuous-branch:'+o.templateId,()=>{const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(branchVertices,3));g.setAttribute('uv',new T.Float32BufferAttribute(branchUV,2));g.setIndex(branchIndices);g.computeVertexNormals();return g;},bark,[0,0,0]);
 const pieces=b.finish();pieces.traverse(n=>{
  if(!(n instanceof T.Mesh))return;const key=n.geometry.userData.sourceKey as string||'',color=(n.material as T.MeshStandardMaterial).color.getHexString();
  n.userData.feature=key;
  if((key==='shrine:box'&&color==='cad4d0')||key==='scenic:branch-collider'){n.visible=false;n.userData.collisionOnly=true;return;}
  if(key.includes('branch'))n.userData.natureKind='bark';
  else if(key.includes('cliff-face'))n.userData.natureKind='cliff';
  else if(key.includes('cliff-lip'))n.userData.natureKind='coast-trail';
  else if(key.includes('rock')||key.includes('boulder'))n.userData.natureKind='rock';
  else if(key.includes('blossom')||key.includes('cloud')||key.includes('sprig')||key.includes('crown')){n.userData.natureKind='leaf';const m=n.material as T.MeshStandardMaterial;m.vertexColors=true;m.side=T.DoubleSide;m.flatShading=false;}
  n.userData.noCollision=key!=='scenic:seat-boulder';
 });root.add(pieces);return root;
}
