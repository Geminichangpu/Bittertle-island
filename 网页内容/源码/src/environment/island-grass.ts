import * as T from 'three';
import type {Project} from '../data/model';
import type {TerrainSurface} from './surface';
import {blocked,roadDistance,type Obstacle,type Route} from './paths';
import {coastDistance,isLand} from '../terrain/terrain';
import {inNaturePilot} from './nature-pilot';
import {inNorthBeach} from './north-beach';

/** Extra fine grass is static, instanced and only drawn for close views. */
export function makeIslandGrass(p:Project,surface:TerrainSurface,routes:Route[],obstacles:Obstacle[]){
 const group=new T.Group();group.name='island-fine-grass';group.visible=false;group.userData.noCollision=true;
 let seed=((p.environment?.seed??1)^0x519ab)|0;const rnd=()=>{seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t^=t+Math.imul(t^t>>>7,61|t);return ((t^t>>>14)>>>0)/4294967296;};
 const v:number[]=[],colors:number[]=[];for(let k=0;k<4;k++){const a=k*2.4,dx=Math.cos(a),dz=Math.sin(a),sx=-dz,sz=dx,w=.075+(k%2)*.02,h=.34+(k%3)*.06,L=[-sx*w,0,-sz*w],R=[sx*w,0,sz*w],ML=[dx*.13-sx*w*.6,h*.55,dz*.13-sz*w*.6],MR=[dx*.13+sx*w*.6,h*.55,dz*.13+sz*w*.6],tip=[dx*.32,h,dz*.32];for(const [x,y,z] of [L,R,ML,R,MR,ML,ML,MR,tip]){v.push(x,y,z);const s=y?.98:.8;colors.push(s,s,s);}}
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(v,3));geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();geometry.userData.surfaceKind='grass';
 const material=new T.MeshStandardMaterial({color:'#a2b875',vertexColors:true,side:T.DoubleSide,roughness:1});
 const buckets=new Map<string,{x:number;z:number;matrices:T.Matrix4[];colors:T.Color[]}>(),dummy=new T.Object3D(),color=new T.Color(),palette=['#8aa95e','#a4bd70','#b6c782'];let count=0;
 for(let i=0;i<12000&&count<2400;i++){
  const x=(rnd()-.5)*p.terrain.size,z=(rnd()-.5)*p.terrain.size,y=surface.height(x,z);
  if(y===undefined||y>33||inNaturePilot(p,x,z)||inNorthBeach(p,x,z)||!isLand(p.terrain,x,z)||coastDistance(p.terrain,[x,z])<5||blocked(obstacles,x,z,1.5)||roadDistance(routes,x,z)<2.7)continue;
  if(Math.max(Math.abs((surface.height(x+1,z)??y)-y),Math.abs((surface.height(x,z+1)??y)-y))>.5)continue;
  const s=.65+rnd()*.55;dummy.position.set(x,y-.035,z);dummy.rotation.set(0,rnd()*Math.PI*2,0);dummy.scale.set(s,s*(.8+rnd()*.4),s);dummy.updateMatrix();const ix=Math.floor(x/32),iz=Math.floor(z/32),key=ix+','+iz;let bucket=buckets.get(key);if(!bucket){bucket={x:(ix+.5)*32,z:(iz+.5)*32,matrices:[],colors:[]};buckets.set(key,bucket);}bucket.matrices.push(dummy.matrix.clone());bucket.colors.push(color.set(palette[count%palette.length]).clone());count++;
 }
 for(const bucket of buckets.values()){const mesh=new T.InstancedMesh(geometry,material,bucket.matrices.length);bucket.matrices.forEach((matrix,i)=>{mesh.setMatrixAt(i,matrix);mesh.setColorAt(i,bucket.colors[i]);});mesh.userData.noCollision=true;mesh.userData.grassChunk=true;mesh.userData.grassCenter=[bucket.x,bucket.z];mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();group.add(mesh);}group.userData.tuftCount=count;return group;
}
export function updateIslandGrass(root:T.Group,camera:T.Camera,target:T.Vector3){const grass=root.getObjectByName('island-fine-grass');if(grass)grass.visible=!grass.userData.vegetationReplacement&&(camera instanceof T.OrthographicCamera?camera.zoom>2:camera.position.distanceTo(target)<130);}
