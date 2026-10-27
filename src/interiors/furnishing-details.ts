import * as T from 'three';
import type {Builder} from '../generators/shrine';

/** Static, instanced tabletop objects. Coordinates are the existing furniture's top surface. */
export function teaService(b:Builder,x:number,y:number,z:number,scale=1,color='#79958d'){
 b.scoped([x,y,z],0,()=>{
  const s=scale;
  b.box([0,.025*s,0],[1.35*s,.05*s,.82*s],'#795943');
  for(const side of [-1,1])b.box([0,.065*s,side*.4*s],[1.35*s,.07*s,.025*s],'#b58b5b');
  b.emit('detail:teapot',()=>new T.SphereGeometry(1,14,10),color,[-.23*s,.23*s,0],[.22*s,.18*s,.2*s]);
  b.cylinder([-.23*s,.38*s,0],[-.23*s,.4*s,0],.14*s,color,16);
  b.ball([-.23*s,.43*s,0],[.045*s,.035*s,.045*s],'#c69a47');
  b.cylinder([-.05*s,.22*s,0],[.12*s,.33*s,0],.055*s,color,10);
  b.emit('detail:pot-handle',()=>new T.TorusGeometry(1,.18,6,16),color,[-.44*s,.25*s,0],[.12*s,.14*s,.12*s]);
  for(const [xx,zz] of [[.32,-.22],[.4,.22]]){
   b.cylinder([xx*s,.06*s,zz*s],[xx*s,.08*s,zz*s],.16*s,'#e4dfd2',16);
   b.emit('detail:cup',()=>new T.LatheGeometry([new T.Vector2(.065,0),new T.Vector2(.09,.02),new T.Vector2(.11,.14),new T.Vector2(.09,.14),new T.Vector2(.075,.04)],16),color,[xx*s,.08*s,zz*s],[s,s,s]);
   b.cylinder([xx*s,.185*s,zz*s],[xx*s,.19*s,zz*s],.075*s,'#705633',16);
  }
 });
}

export function stationery(b:Builder,x:number,y:number,z:number,scale=1,color='#36576b'){
 b.scoped([x,y,z],0,()=>{
  const s=scale;
  for(let i=0;i<3;i++)b.box([i*.025*s,(.01+i*.014)*s,0],[.64*s,.012*s,.48*s],'#efe6d3',i*.035);
  for(let i=0;i<5;i++)b.box([-.02*s,.048*s,(-.15+i*.065)*s],[.4*s,.003*s,.006*s],'#a8a79a');
  b.box([.52*s,.08*s,.05*s],[.36*s,.13*s,.5*s],color,-.12);
  b.box([.52*s,.083*s,.31*s],[.3*s,.09*s,.012*s],'#dfd9c6',-.12);
  b.cylinder([-.2*s,.07*s,.1*s],[.18*s,.07*s,.18*s],.015*s,'#493126');
  b.cylinder([-.5*s,.03*s,-.05*s],[-.5*s,.24*s,-.05*s],.09*s,color,16);
  for(let i=0;i<4;i++)b.cylinder([(-.55+i*.035)*s,.13*s,-.05*s],[(-.57+i*.045)*s,(.42+i%2*.05)*s,-.04*s],.012*s,i%2?'#b58b5b':'#493126');
 });
}

/** Beaded frame and recessed plaster field on an existing wall, never an extra partition. */
export function wallPanels(b:Builder,w:number,h:number,modern=false){
 const trim=modern?'#d5dce1':'#b58b5b',wood=modern?'#e7e9ee':'#916340';
 for(const y of [.26,h-.32])b.box([0,y,.13],[w,.09,.08],trim);
 const n=Math.max(1,Math.ceil(w/2.8));
 for(let i=0;i<n;i++){
  const x=-w/2+(i+.5)*w/n,ww=w/n-.32,low=modern?.48:.38,high=modern?h-.65:1.13;
  if(ww<.3||high<low+.2)continue;
  if(!modern)b.box([x,(low+high)/2,.11],[ww,high-low,.05],wood);
  for(const xx of [x-ww/2,x+ww/2])b.box([xx,(low+high)/2,.15],[.035,high-low,.035],trim);
  for(const y of [low,high])b.box([x,y,.15],[ww,.035,.035],trim);
 }
}
