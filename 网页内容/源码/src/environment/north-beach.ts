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
 function umbrella(q:{x:number;y:number;z:number}){
  const {x,y,z}=q;
  b.scoped([x,y,z],0,()=>{
   b.cylinder([0,0,0],[0,3.16,0],.056,wood,16);
   b.cylinder([0,2.14,0],[0,2.21,0],.091,'#897f69',16);
   for(let k=0;k<8;k++)b.scoped([0,2.61,0],-k*Math.PI/4,()=>{
    b.emit('beach:sewn-canopy',()=>{
     const pos:number[]=[],uv:number[]=[],ix:number[]=[];
     for(let j=0;j<=9;j++)for(let i=0;i<=8;i++){
      const r=.016+.984*j/9,t=i/8,a=t*Math.PI/4;
      const span=2.29*r*(1-.06*Math.sin(t*Math.PI)*r);
      pos.push(Math.cos(a)*span,.53*(1-r*r)-.086*r*r*Math.sin(Math.PI*t),Math.sin(a)*span);uv.push(t,r);
      if(j<9&&i<8){const n=j*9+i;ix.push(n,n+1,n+10,n,n+10,n+9);}
     }
     const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return g;
    },k%2?blue:white,[0,0,0]);
    for(let j=0;j<5;j++){const a=j/5,c=(j+1)/5;b.cylinder([2.29*a,.513*(1-a*a),0],[2.29*c,.513*(1-c*c),0],.016,wood,8);}
    b.cylinder([0,-.43,0],[.97,.416,0],.021,'#aba18a',10);
    b.cylinder([2.28,-.041,0],[2.28,.017,0],.025,'#c0a875',10);
   });
   b.cylinder([0,3.133,0],[0,3.21,0],.072,'#b79970',16);
  });
 }
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
 for(const q of [{p:hut,cz:hut.z+1,width:3.5},{p:hut2,cz:hut2.z+4,width:4}]){
  const face=q.cz-1.26,xc=q.p.x,y=q.p.y;
  for(let j=0;j<=12;j++){const xx=xc+(j/12-.5)*q.width;b.box([xx,y+.51,face],[.033,.94,.038],'#987653');}
  b.box([xc,y+1.52,face-.014],[q.width*.7,.71,.052],'#52686a');
  for(const side of [-1,1])b.box([xc+side*q.width*.351,y+1.53,face-.05],[.083,.85,.09],wood);
  b.box([xc,y+1.93,face-.05],[q.width*.73,.09,.12],white);
 }
 for(const side of [-1,1]){
  const {x,y,z}=tower;
  b.box([x+side*.46,y+3.36,z-.815],[.78,.72,.06],'#718c94');
  b.box([x+side*.46,y+3.0,z-.87],[.89,.08,.16],white);
  b.beam([x+side*.85,y+.48,z-.75],[x-side*.85,y+2.18,z-.75],.10,wood);
 }
 b.emit('beach:life-ring',()=>new T.TorusGeometry(.25,.055,10,36),'#b75f43',[tower.x,tower.y+2.62,tower.z-.88]);
 const beachEmit=b.emit.bind(b);b.emit=(...args:Parameters<Builder['emit']>)=>{args[0]='replace-tree:'+args[0];beachEmit(...args);};
 const palm=at(0);b.cylinder([palm.x,palm.y,palm.z+2],[palm.x-.6,palm.y+5,palm.z+2],.2,wood,8);for(let i=0;i<7;i++){const a=i*Math.PI*2/7;b.emit('beach:palm',palmFrondGeometry,i%2?'#719b65':'#87ad70',[palm.x-.6,palm.y+5,palm.z+2],[2.4,2.1,2.4],new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),a));}b.emit=beachEmit;
 const sign=at(Math.floor(points.length*.15));b.box([sign.x,sign.y+1,sign.z+1.4],[.15,2,.15],wood);b.box([sign.x,sign.y+2,sign.z+1.4],[2.5,.9,.12],wood);
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=96;const ctx=canvas.getContext('2d')!;ctx.fillStyle='#e9e2cc';ctx.fillRect(0,0,256,96);ctx.fillStyle='#326d80';ctx.font='bold 40px sans-serif';ctx.textAlign='center';ctx.fillText('WELCOME',128,62);const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;const material=new T.MeshBasicMaterial({map:texture,side:T.DoubleSide});material.userData.ownedTexture=texture;b.emit('beach:welcome',()=>new T.PlaneGeometry(1,1),'beach:welcome',[sign.x,sign.y+2,sign.z+1.48],[2.3,.75,1],new T.Quaternion(),material);
 return {points,loungers};
}
