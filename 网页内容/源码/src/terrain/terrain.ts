import {gradeSettlement} from './settlement-grade.ts';
import {villageHeight,villageCuts} from './village.ts';
import {scenicCoastHeight,scenicHighland,scenicCoastCuts} from './scenic-coast.ts';
import * as THREE from 'three';
import {triangulateContours} from './contour-mesh.ts';
import {beachAffinity,ease,landscapeNoise} from './natural-landform.ts';
import type {Point,Terrain} from '../data/model.ts';
import {feihuaMountainHeight,feihuaMountainCuts} from './feihua-mountain.ts';
export function inside(p:Point,poly:Point[]){let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
export function distance(p:Point,poly:Point[]){
 let best=Infinity;
 for(let i=0,j=poly.length-1;i<poly.length;j=i++){
  const a=poly[j],b=poly[i],dx=b[0]-a[0],dz=b[1]-a[1];
  const t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dz)/(dx*dx+dz*dz||1)));
  const x=p[0]-a[0]-t*dx,z=p[1]-a[1]-t*dz;
  best=Math.min(best,x*x+z*z);
 }
 return Math.sqrt(best);
}
export function mainCoast(t:Terrain):Point[]{return t.topology==='open-bay'?[...t.outer,...[...t.bay].reverse()]:t.outer;}
export function coastDistance(t:Terrain,p:Point){return t.topology==='open-bay'?Math.min(distance(p,mainCoast(t)),distance(p,t.islet)):Math.min(distance(p,t.outer),distance(p,t.bay),distance(p,t.islet));}
export function isLand(t:Terrain,x:number,z:number){return (t.topology==='open-bay'?inside([x,z],mainCoast(t)):(inside([x,z],t.outer)&&!inside([x,z],t.bay)))||inside([x,z],t.islet);}
function onCampus(t:Terrain,p:Point){return !!t.campus&&(inside(p,t.islet)||distance(p,t.islet)<.001);}
function lowBayCoast(t:Terrain,x:number,z:number){return t.flatBayRevision===1&&x>40&&x<130&&z> -70&&z<52&&!inside([x,z],t.islet);}
function baseBeach(t:Terrain,x:number,z:number){
 const grade=t.grading;
 if(!t.landscapeRevision||!grade)return 0;
 const east=grade.baseRect[1],south=grade.baseRect[3];
 const across=1-THREE.MathUtils.smoothstep(Math.abs(x-(east-17)),23,34);
 return across*THREE.MathUtils.smoothstep(z,south-16,south-8);
}
export function sampleHeight(t:Terrain,x:number,z:number,includeBay=true):number{
  if(!isLand(t,x,z)){if(lowBayCoast(t,x,z)&&distance([x,z],mainCoast(t))<.001)return .9;if(t.scenicCoast&&scenicHighland(t,x,z)&&distance([x,z],mainCoast(t))<.001)return scenicCoastHeight(t,x,z,.9);if(t.campus&&distance([x,z],t.islet)<.001){
   // A coast vertex may fall microscopically outside the polygon after triangulation.
   // Sample just inside so its bridge-approach grading matches the adjacent land.
   const dx=x-t.campus.center[0],dz=z-t.campus.center[1],length=Math.hypot(dx,dz)||1,ix=x-dx/length*.005,iz=z-dz/length*.005;
   return isLand(t,ix,iz)?sampleHeight(t,ix,iz,includeBay):t.campus.level;
  }return 0;}
  const n=t.resolution,u=Math.max(0,Math.min(n-1,(x/t.size+.5)*(n-1))),v=Math.max(0,Math.min(n-1,(z/t.size+.5)*(n-1))),ix=Math.min(n-2,Math.floor(u)),iz=Math.min(n-2,Math.floor(v)),a=u-ix,b=v-iz;
  const h=(1-b)*((1-a)*t.heights[iz*n+ix]+a*t.heights[iz*n+ix+1])+b*((1-a)*t.heights[(iz+1)*n+ix]+a*t.heights[(iz+1)*n+ix+1]);
  const d=inside([x,z],t.islet)?distance([x,z],t.islet):coastDistance(t,[x,z]);
  let height=.9+h*(t.campus&&inside([x,z],t.islet)?1:Math.min(1,d/9));
  if(t.landscapeRevision){
   const g=t.grading;
   if(g){
    const [minX,maxX,minZ,maxZ]=g.baseRect,dx=Math.max(minX-x,0,x-maxX),dz=Math.max(minZ-z,0,z-maxZ),db=Math.hypot(dx,dz);
    const vx=g.hill[0]-g.base[0],vz=g.hill[1]-g.base[1],length=Math.hypot(vx,vz)||1;
    const along=((x-g.base[0])*vx+(z-g.base[1])*vz)/length,cross=Math.abs((x-g.base[0])*vz-(z-g.base[1])*vx)/length;
    const u=Math.max(0,Math.min(1,(along-10)/Math.max(12,length-16))),s=u*u*(3-2*u);
    const slope=g.baseLevel+(g.hillLevel-g.baseLevel)*s;
    const flat=Math.max(0,1-db/12),corridor=Math.max(0,Math.min(1,(38-cross)/16))*Math.max(0,Math.min(1,(length+28-along)/20))*Math.max(0,Math.min(1,(along+20)/15));
    const target=slope*(1-flat)+g.baseLevel*flat,weight=Math.max(flat,corridor);
    height=height*(1-weight)+target*weight;
   }
  }
  // Interpolate the campus bridge approach pads before the overlapping bridge pad.
  // This avoids vertical seams caused by choosing whole one-unit pads in order.
  if(t.campus&&x>t.campus.center[0]+3&&x<t.campus.center[0]+t.campus.radius+8&&Math.abs(z-t.campus.center[1])<16){
   const pads=(t.pads||[]).filter(p=>p.ownerId.startsWith('campus:approach:')).sort((a,b)=>a.minX-b.minX);
   if(pads.length>1){const first=pads[0],last=pads[pads.length-1],firstX=first.minX+.5,lastX=last.maxX-.5,z0=(first.minZ+first.maxZ)/2,half=(first.maxZ-first.minZ)/2,edge=Math.abs(z-z0);
    if(x>=firstX-4&&x<=lastX+4&&edge<half+7){let j=0;while(j<pads.length-2&&x>(pads[j+1].minX+.5))j++;const a=pads[j],b=pads[j+1],ax=a.minX+.5,bx=b.minX+.5,u=Math.max(0,Math.min(1,(x-ax)/(bx-ax||1))),level=a.level+(b.level-a.level)*u;const w=(1-THREE.MathUtils.smoothstep(edge,Math.max(0,half-.5),half+7))*THREE.MathUtils.smoothstep(x,firstX-4,firstX+1)*(1-THREE.MathUtils.smoothstep(x,lastX-1,lastX+4));return feihuaMountainHeight(t,x,z,height*(1-w)+level*w);}
   }
  }
  // Flat bearing surfaces beneath the entire model footprint, with soft earth transitions.
  for(const p of t.pads||[])if(p.ownerId!=='island-town:bay'&&p.ownerId!=='scenic_academy'&&p.ownerId!=='island-town:academy-village'&&x>=p.minX&&x<=p.maxX&&z>=p.minZ&&z<=p.maxZ)return feihuaMountainHeight(t,x,z,p.level);
  let sum=0,weight=0,maxWeight=0;
  for(const p of t.pads||[]){if(p.ownerId==='island-town:bay'||p.ownerId==='scenic_academy'||p.ownerId==='island-town:academy-village')continue;const dx=Math.max(p.minX-x,0,x-p.maxX),dz=Math.max(p.minZ-z,0,z-p.maxZ),r=Math.hypot(dx,dz);if(r>=p.feather)continue;const u=1-r/p.feather,f=u*u*(3-2*u);const w=f/(r+.1)**2;sum+=p.level*w;weight+=w;maxWeight=Math.max(maxWeight,f);}
  if(weight)height=height*(1-maxWeight)+sum/weight*maxWeight;
  let result=villageHeight(t,x,z,scenicCoastHeight(t,x,z,feihuaMountainHeight(t,x,z,height)),d,includeBay);
  // Apply these terraces after the highland and village shaping so their edges blend continuously.
  for(const pad of t.pads||[]){if(pad.ownerId!=='island-town:bay'&&pad.ownerId!=='scenic_academy'&&pad.ownerId!=='island-town:academy-village')continue;const dx=Math.max(pad.minX-x,0,x-pad.maxX),dz=Math.max(pad.minZ-z,0,z-pad.maxZ),r=Math.hypot(dx,dz);if(r>=pad.feather)continue;const u=1-r/pad.feather,w=u*u*(3-2*u);result=result*(1-w)+pad.level*w;}
  result=gradeSettlement(t,x,z,result,d);
  if(lowBayCoast(t,x,z)){const shore=distance([x,z],mainCoast(t)),weight=THREE.MathUtils.smoothstep(x,40,55)*(1-THREE.MathUtils.smoothstep(x,115,130))*THREE.MathUtils.smoothstep(z,-70,-58)*(1-THREE.MathUtils.smoothstep(z,40,52)),level=.9+1.7*THREE.MathUtils.smoothstep(shore,0,14);result=THREE.MathUtils.lerp(result,level,weight);}
  // Carry the two neighbouring forecourts out to the roadside. Building pads above
  // still own their exact bearing surfaces; the intervening slope blends their levels.
  let apronWeight=0,apronLevel=0,apronSum=0;
  for(const pad of t.pads||[]){
   if(pad.ownerId!=='layout_island_park'&&pad.ownerId!=='layout_island_restaurant'&&!pad.ownerId.startsWith('layout_island_house'))continue;
   if(x<pad.minX-11||x>pad.maxX+11||z<pad.minZ-5||z>pad.maxZ+14)continue;
   const dx=Math.max(pad.minX-3-x,0,x-pad.maxX-3),dz=Math.max(pad.minZ-z,0,z-pad.maxZ-7);
   const w=1-THREE.MathUtils.smoothstep(Math.hypot(dx,dz),0,7);
   apronWeight=Math.max(apronWeight,w);apronLevel+=w*pad.level;apronSum+=w;
  }
  if(apronSum)result=THREE.MathUtils.lerp(result,apronLevel/apronSum,apronWeight);
  // The low-bay grading also reaches the bridge landing. Match the foundation after
  // that grading, feathering out from all four edges of the existing abutment.
  if(t.flatBayRevision===1 && lowBayCoast(t,x,z)) {
   const landing=t.pads?.find(p=>p.ownerId==='island_bridge:east');
   if(landing) {
    const dx=Math.max(landing.minX-x,0,x-landing.maxX), dz=Math.max(landing.minZ-z,0,z-landing.maxZ);
    const weight=(1-ease(.18,landing.feather+2.5,Math.hypot(dx,dz)))*ease(0,1.3,d);
    result=THREE.MathUtils.lerp(result,landing.level,weight);
   }
  }
  const beach=baseBeach(t,x,z);
  if(beach>0){
   const beachGrade=.9+(t.grading!.baseLevel-.9)*THREE.MathUtils.smoothstep(d,0,17);
   return THREE.MathUtils.lerp(result,Math.min(result,beachGrade),beach);
  }
  return result;
}
const grassShade = new THREE.Color('#78916a');
const sunGrass = new THREE.Color('#b0b87a');
const pineHeath = new THREE.Color('#738668');
const drySand = new THREE.Color('#e4d4a8');
const shingle = new THREE.Color('#a6a494');
const bareStone = new THREE.Color('#94978b');
const darkStone = new THREE.Color('#818b81');

function shadeTerrain(g: THREE.BufferGeometry, t: Terrain) {
  const pos=g.getAttribute('position'), normals=g.getAttribute('normal');
  const shores=g.getAttribute('terrainShore'), colours=g.getAttribute('color');
  const color=new THREE.Color(), rock=new THREE.Color(), gravel=new THREE.Color();
  for (let i=0;i<pos.count;i++) {
    const x=pos.getX(i), y=pos.getY(i), z=pos.getZ(i), coast=shores.getX(i);
    const slope=1-Math.max(0,normals.getY(i));
    const field=.63*landscapeNoise(x/34+5.1,z/34-2.1)+.37*landscapeNoise(x/12-7.6,z/12+4.8);
    color.copy(grassShade).lerp(sunGrass,ease(.18,.85,field));
    color.lerp(pineHeath,ease(13,39,y)*(.24+.34*(1-field)));
    rock.copy(darkStone).lerp(bareStone,field);
    color.lerp(rock,ease(.10,.49,slope+(field-.5)*.14)*.93);
    const campus=onCampus(t,[x,z]);
    if (!campus) {
      const beach = Math.max(beachAffinity(x,z),baseBeach(t,x,z));
      const width = 1.5+1.8*field+beach*(10+4*field);
      const lowShore=(1-ease(width*.44,width+1.1,coast))*(1-ease(2.1+2*beach,4.4+5*beach,y));
      gravel.copy(shingle).lerp(drySand,.25+.73*beach);
      color.lerp(gravel,lowShore*(1-.3*ease(.12,.5,slope)));
    }
    colours.setXYZ(i,color.r,color.g,color.b);
  }
  colours.needsUpdate=true;
}

function meshHeight(t: Terrain, x: number, z: number, shore: number) {
  return shore<.001 && !onCampus(t,[x,z]) && !scenicHighland(t,x,z) ? .9 : sampleHeight(t,x,z);
}

export function terrainGeometry(t: Terrain, _beautify=false) {
  // Shared grid edges follow the coast and each foundation exactly. Long ear-clipping
  // diagonals can otherwise cut straight through the new hills between two distant vertices.
  const cuts=(t.pads||[]).flatMap(p=>[[0,p.minX],[0,p.maxX],[1,p.minZ],[1,p.maxZ]])
    .concat(feihuaMountainCuts(t),scenicCoastCuts(t),villageCuts(t));
  const {points,indices}=triangulateContours(t,mainCoast(t),cuts);
  const vertices=new Float32Array(points.length*3), shores=new Float32Array(points.length);
  for (let i=0;i<points.length;i++) {
    const [x,z]=points[i], d=coastDistance(t,points[i]);
    shores[i]=d;
    vertices[i*3]=x; vertices[i*3+1]=meshHeight(t,x,z,d); vertices[i*3+2]=z;
  }
  const g=new THREE.BufferGeometry();
  g.setIndex(indices);
  g.setAttribute('position',new THREE.BufferAttribute(vertices,3));
  g.setAttribute('color',new THREE.BufferAttribute(new Float32Array(vertices.length),3));
  g.setAttribute('terrainShore',new THREE.BufferAttribute(shores,1));
  g.computeVertexNormals(); shadeTerrain(g,t); g.computeBoundingSphere();
  return g;
}

export function updateTerrainHeights(g: THREE.BufferGeometry, t: Terrain) {
  const pos=g.getAttribute('position'), shores=g.getAttribute('terrainShore');
  for (let i=0;i<pos.count;i++) {
    const x=pos.getX(i), z=pos.getZ(i);
    pos.setY(i,meshHeight(t,x,z,shores.getX(i)));
  }
  pos.needsUpdate=true;
  g.computeVertexNormals(); shadeTerrain(g,t); g.computeBoundingSphere();
}
