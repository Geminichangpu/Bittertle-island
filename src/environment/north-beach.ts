import * as T from 'three';
import type {Project} from '../data/model';
import type {Builder} from '../generators/shrine';
import type {TerrainSurface} from './surface';
import {blocked,roadDistance,type Obstacle,type Route} from './paths';
import {isLand,coastDistance} from '../terrain/terrain';
import {palmFrondGeometry} from './tropical-foliage';

export function inNorthBeach(p:Project,x:number,z:number){
 const library=p.objects.find(o=>o.id==='landmark_library');
 return !!library && x>library.position[0]-38 && x<library.position[0]+38 && z< -100 && coastDistance(p.terrain,[x,z])<15;
}

/** Discrete amenities on the existing north-facing coast; no new circular island. */
export function addNorthBeach(p:Project,b:Builder,loungerBuilder:Builder,surface:TerrainSurface,routes:Route[],obstacles:Obstacle[]){
 const library=p.objects.find(o=>o.id==='landmark_library');if(!library)return {points:[],loungers:[]};
 const points:{x:number;y:number;z:number}[]=[];
 for(let x=library.position[0]-34;x<=library.position[0]+34;x+=2.5){let edge:number|undefined;for(let z=-160;z<=-65;z+=.5)if(isLand(p.terrain,x,z)){edge=z;break;}if(edge===undefined)continue;
  const z=edge+3.2,y=surface.height(x,z);if(y===undefined||y>5||blocked(obstacles,x,z,1.5)||roadDistance(routes,x,z)<2||points.some(q=>Math.hypot(q.x-x,q.z-z)<2.8))continue;points.push({x,y,z});
 }
 if(points.length<3)return {points,loungers:[]};
 const at=(index:number)=>points[Math.min(points.length-1,Math.max(0,index))],wood='#a47d55',white='#f4f0df',blue='#4489a7';
 function umbrella(q:{x:number;y:number;z:number}){const {x,y,z}=q;b.cylinder([x,y,z],[x,y+3.1,z],.07,wood,8);for(let k=0;k<8;k++){const a=k*Math.PI/4,c=(k+1)*Math.PI/4;b.emit('beach:umbrella-wedge',()=>{const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([0,.5,0,Math.cos(Math.PI/4),0,Math.sin(Math.PI/4),1,0,0],3));g.computeVertexNormals();return g;},k%2?blue:white,[x,y+2.6,z],[2.3,1,2.3],new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),-a));}}
 const loungers:{x:number;y:number;z:number}[]=[];
 function lounger(q:{x:number;y:number;z:number},dx:number){const x=q.x+dx,y=q.y,z=q.z+.8;loungers.push({x,y,z});for(const a of [-.5,.5])loungerBuilder.box([x+a,y+.25,z],[.1,.5,2.4],wood);loungerBuilder.box([x,y+.55,z],[1.05,.13,2.3],white);for(let i=0;i<4;i++)loungerBuilder.box([x-.42+i*.28,y+.63,z],[.14,.025,2.2],blue);}
 for(const i of [...new Set([.1,.16,.3,.36,.8,.86].map(f=>Math.max(1,Math.min(points.length-2,Math.floor(points.length*f)))) )]){const q=at(i);umbrella(q);lounger(q,-1.3);lounger(q,1.3);}
 // A low timber boardwalk follows the back of the sandy shore.
 for(let i=0;i<points.length-1;i++){const a=points[i],c=points[i+1],mx=(a.x+c.x)/2,mz=(a.z+c.z)/2+6,my=surface.height(mx,mz);if(my===undefined)continue;b.beam([a.x,my+.12,a.z+6],[c.x,my+.12,c.z+6],.36,'#bc9a70');}
 // Timber pier extends north into the existing sea.
 const dock=at(Math.floor(points.length*.4));for(let i=0;i<12;i++){const z=dock.z-2-i*.65;b.box([dock.x,.85,z],[2.3,.18,.62],i%2?'#a98563':'#c0a17b');if(i%4===0)for(const side of [-1,1])b.cylinder([dock.x+side*.9,-.5,z],[dock.x+side*.9,.8,z],.09,wood,7);}
 const tower=at(Math.floor(points.length*.7));for(const dx of [-.85,.85])for(const dz of [-.75,.75])b.box([tower.x+dx,tower.y+1.15,tower.z+dz],[.13,2.3,.13],wood);b.box([tower.x,tower.y+2.35,tower.z],[2.2,.18,2],wood);b.box([tower.x,tower.y+3.25,tower.z],[1.9,1.7,1.6],white);b.box([tower.x,tower.y+4.2,tower.z],[2.3,.22,2],blue);
 const hut=at(points.length-1);b.box([hut.x,hut.y+1,hut.z+1],[3.5,2,2.4],'#bd9a72');b.box([hut.x,hut.y+2.15,hut.z+1],[4,.3,2.8],blue);b.box([hut.x,hut.y+1.05,hut.z-.25],[2.5,.2,.5],white);for(let i=0;i<3;i++)b.box([hut.x-1+i*.6,hut.y+.9,hut.z-1],[.35,1.5,.12],i%2?blue:'#e8b56c',.18);
 const hut2=at(Math.floor(points.length*.25));b.box([hut2.x,hut2.y+1,hut2.z+4],[4,2,2.5],'#bd9a72');b.box([hut2.x,hut2.y+2.15,hut2.z+4],[4.4,.3,3],white);b.box([hut2.x,hut2.y+1.05,hut2.z+2.7],[2.8,.2,.5],blue);
 const palm=at(0);b.cylinder([palm.x,palm.y,palm.z+2],[palm.x-.6,palm.y+5,palm.z+2],.2,wood,8);for(let i=0;i<7;i++){const a=i*Math.PI*2/7;b.emit('beach:palm',palmFrondGeometry,i%2?'#719b65':'#87ad70',[palm.x-.6,palm.y+5,palm.z+2],[2.4,2.1,2.4],new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),a));}
 const sign=at(Math.floor(points.length*.15));b.box([sign.x,sign.y+1,sign.z+1.4],[.15,2,.15],wood);b.box([sign.x,sign.y+2,sign.z+1.4],[2.5,.9,.12],wood);
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=96;const ctx=canvas.getContext('2d')!;ctx.fillStyle='#e9e2cc';ctx.fillRect(0,0,256,96);ctx.fillStyle='#326d80';ctx.font='bold 40px sans-serif';ctx.textAlign='center';ctx.fillText('WELCOME',128,62);const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;const material=new T.MeshBasicMaterial({map:texture,side:T.DoubleSide});material.userData.ownedTexture=texture;b.emit('beach:welcome',()=>new T.PlaneGeometry(1,1),'beach:welcome',[sign.x,sign.y+2,sign.z+1.48],[2.3,.75,1],new T.Quaternion(),material);
 return {points,loungers};
}
