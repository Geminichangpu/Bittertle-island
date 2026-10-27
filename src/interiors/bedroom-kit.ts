import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {roomKit,palette as p,type V} from './room-kit';
import type {Builder} from '../generators/shrine';

/** Opt-in furniture/joinery for the bedroom sample only; footprints and anchors stay fixed. */
export function bedroomKit(){
 const k=roomKit(true),{b,cache}=k;
 const rounded=(builder:Builder,at:V,size:V,color:string)=>builder.emit('bedroom:soft-edge',()=>new RoundedBoxGeometry(1,1,1,1,.025),color,at,size);
 const metal='#a58c5c',paper='#e5d9b6',ink='#334b52';
 const covers=['#36576b','#64837a','#ad795a','#88708c','#d4c5aa','#786b59'];
 function cup(x:number,y:number,z:number){
  b.emit('bedroom:cup',()=>new T.LatheGeometry([new T.Vector2(.06,0),new T.Vector2(.095,.02),new T.Vector2(.105,.18),new T.Vector2(.088,.19),new T.Vector2(.079,.05)],16),'#79958d',[x,y,z]);
  b.emit('bedroom:cup-handle',()=>new T.TorusGeometry(.065,.015,5,12), '#79958d',[x+.1,y+.11,z],[1,1,1],new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),Math.PI/2));
 }
 function book(x:number,y:number,z:number,w:number,h:number,d:number,color:string,tilt=0,style=0){
  const q=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),tilt),at=(xx:number,yy:number,zz:number):V=>new T.Vector3(xx,yy,zz).applyQuaternion(q).add(new T.Vector3(x,y,z)).toArray() as V;
  b.emit('shrine:box',()=>new T.BoxGeometry(1,1,1),paper,at(0,h/2,0),[w*.78,h-.035,d-.035],q);
  for(const side of [-1,1])b.emit('shrine:box',()=>new T.BoxGeometry(1,1,1),color,at(side*w*.46,h/2,0),[w*.08,h,d],q);
  b.emit('bedroom:book-spine',()=>new RoundedBoxGeometry(1,1,1,1,.04),color,at(0,h/2,d/2),[w,h,.035],q);
  if(style%2===0)for(const yy of [.12,.84])b.emit('shrine:box',()=>new T.BoxGeometry(1,1,1),metal,at(0,h*yy,d/2+.019),[w*.72,.012,.007],q);
  if(style%3!==0)b.emit('shrine:box',()=>new T.BoxGeometry(1,1,1),paper,at(0,h*.62,d/2+.02),[w*.45,h*.12,.008],q);
 }
 let serial=0;
 function shelf(x:number,y:number,z:number,w:number,h:number){
  const seed=++serial;let state=seed*2731;const random=()=>{state=(state*1664525+1013904223)>>>0;return state/4294967296;};b.scoped([x,y,z],0,()=>{
   // Dark recessed back, substantial stiles, inset lower cabinet and rounded shelf noses.
   b.box([0,h/2,-.34],[w-.12,h-.1,.055],p.dark);
   for(const xx of [-w/2,w/2]){rounded(b,[xx,h/2,0],[.12,h,.75],p.wood);b.box([xx,h/2,.32],[.13,h,.08],p.trim);}
   rounded(b,[0,h-.06,0],[w,.12,.75],p.trim);
   for(let row=0;row<4;row++){
    const yy=.15+row*h/4;rounded(b,[0,yy,0],[w,.1,.75],p.trim);b.box([0,yy-.06,-.27],[w-.15,.08,.12],p.dark);
    const height=Math.min(.78,h/4-.19),left=-w/2+.16,right=w/2-.16;
    if(row===0&&w>1){
     const count=Math.max(1,Math.floor(w/1.25)),span=(w-.2)/count,hh=Math.max(.3,h/4-.15);
     for(let j=0;j<count;j++){const cx=-w/2+.1+span*(j+.5);b.box([cx,yy+.06+hh/2,.24],[span-.04,hh,.1],p.wood);b.box([cx,yy+.06+hh/2,.297],[span-.18,hh-.15,.024],p.trim);for(const side of [-1,1])b.box([cx+side*(span/2-.065),yy+.06+hh/2,.31],[.045,hh,.035],p.wood);b.cylinder([cx+.1,yy+.1+hh*.55,.34],[cx+.25,yy+.1+hh*.55,.34],.022,metal,8);}
     continue;
    }
    const motif=(seed*2+row)%4,usable=(right-left)*(motif===0?.76:.55),start=row%2?left:right-usable;let cursor=start;
    for(let i=0;cursor<start+usable-.13;i++){
     const ww=.10+random()*.11,hh=height*(.62+random()*.34),tilt=i===0&&row%2?-.13:0;
     book(cursor+ww/2+(tilt?.06:0),yy+.055,(random()-.5)*.06,ww,hh,.33+random()*.04,covers[Math.floor(random()*covers.length)],tilt,i+seed+row);cursor+=ww+.025+random()*.055;
    }
    const cx=row%2?right-(w<1?.16:.35):left+(w<1?.16:.35),base=yy+.055;
    if(motif===1){for(let i=0;i<3;i++){const ww=Math.min(w*.32,.57);b.box([cx+(i%2)*.025,base+.04+i*.10,.04],[ww,.075,.32],paper);for(const side of [-1,1])b.box([cx+(i%2)*.025,base+.04+i*.10+side*.043,.04],[ww+.02,.012,.35],covers[(i+seed)%covers.length]);}b.box([cx+.05,base+.23,.23],[.035,.015,.16],'#ad795a');}
    else if(motif===2&&w>1){rounded(b,[cx,base+.16,0],[.47,.32,.43],'#786b59');b.box([cx,base+.33,0],[.5,.035,.45],p.trim);b.box([cx,base+.18,.225],[.15,.07,.016],paper);}
    else if(motif===3)cup(cx,base,.04);
    else if(w>1){for(let i=0;i<2;i++)b.cylinder([cx-.12+i*.17,base,0],[cx-.12+i*.17,base+height*.6,0],.06,paper,12);}
   }
   for(const xx of [-w/2+.13,w/2-.13])b.box([xx,.065,.29],[.09,.12,.12],p.dark);
  });
 }
 function desk(x:number,y:number,z:number,w:number,d:number){b.scoped([x,y,z],0,()=>{
  rounded(b,[0,1.5,0],[w,.16,d],p.wood);rounded(b,[0,1.415,0],[w-.08,.055,d-.06],p.trim);
  for(const xx of [-w/2+.12,w/2-.12])for(const zz of [-d/2+.1,d/2-.1]){rounded(b,[xx,.72,zz],[.15,1.44,.15],p.dark);b.box([xx,1.31,zz],[.18,.18,.18],p.wood);}
  // Replaces the old solid apron with a framed recessed panel at the same depth.
  b.box([0,.8,d/2-.1],[w-.2,1.3,.07],p.wood);b.box([0,.8,d/2-.054],[w-.48,1.03,.025],p.trim);
  for(const yy of [.22,1.38])rounded(b,[0,yy,d/2-.03],[w-.28,.045,.035],p.wood);
  for(const xx of [-w/2+.18,w/2-.18])b.box([xx,.8,d/2-.02],[.06,1.25,.035],p.wood);
  b.box([0,1.27,-d/2+.06],[w-.28,.22,.11],p.wood);b.box([0,1.26,-d/2-.002],[w*.5,.16,.025],p.trim);
  b.cylinder([-.12,1.26,-d/2-.04],[.12,1.26,-d/2-.04],.018,metal);
  for(let i=0;i<3;i++)b.box([i*.025,1.594+i*.011,.05+i*.015],[w*.28,.009,d*.4],paper,(i-1)*.025);
  // A few writing tools, with useful negative space left around the paper.
  rounded(b,[w*.27,1.61,.14],[.44,.055,.24],ink);b.box([w*.27,1.64,.14],[.32,.012,.12],'#252c30');
  b.cylinder([w*.19,1.66,.27],[w*.38,1.66,.39],.021,p.wood);b.cylinder([w*.38,1.66,.39],[w*.43,1.66,.42],.026,ink);
  rounded(b,[-.12,1.63,.2],[.35,.055,.075],'#79958d');
  k.lantern(-w*.36,1.85,-.13,.4);
 });}
 function plant(x:number,y:number,z:number,flowers=false,scale=1){b.scoped([x,y,z],0,()=>{
  b.emit('bedroom:ceramic-pot',()=>new T.LatheGeometry([new T.Vector2(.16,0),new T.Vector2(.21,.02),new T.Vector2(.25,.31),new T.Vector2(.26,.38),new T.Vector2(.22,.4),new T.Vector2(.21,.33)],18),'#e4dfd2',[0,0,0],[scale,scale,scale]);
  b.cylinder([0,.32*scale,0],[0,.35*scale,0],.21*scale,'#4f4938',16);
  for(let i=0;i<9;i++){const a=i*2.399,xx=Math.cos(a)*(.2+i%3*.09)*scale,zz=Math.sin(a)*(.2+i%2*.09)*scale,yy=(.6+i%4*.15)*scale;b.cylinder([0,.33*scale,0],[xx,yy,zz],.014*scale,'#64837a');
   const q=new T.Quaternion().setFromEuler(new T.Euler(.2+i%3*.2,-a,.25));b.emit('bedroom:leaf',()=>new T.SphereGeometry(1,8,5),i%3?'#64837a':'#55735d',[xx,yy,zz],[.11*scale,.025*scale,.24*scale],q);
   if(flowers)for(let j=0;j<5;j++){const a=j*1.257;b.emit('bedroom:petal',()=>new T.SphereGeometry(1,8,5),'#d8b1bd',[xx+Math.cos(a)*.06*scale,yy+.055*scale,zz+Math.sin(a)*.06*scale],[.055*scale,.03*scale,.075*scale]);}
  }
 });}
 function floor(x:number,z:number,w:number,d:number,y=0){
  b.box([x,y-.14,z],[w,.25,d],p.dark);const n=Math.ceil(w/.42),step=w/n;
  for(let i=0;i<n;i++){let zz=-d/2;const first=1.1+(i%3)*.65;let j=0;while(zz<d/2-.01){const len=Math.min(j===0?first:2.45,d/2-zz);b.box([x-w/2+(i+.5)*step,y,z+zz+len/2],[step-.01,.04,len-.012],['#ad8258','#b48a60','#a77d54'][(i*7+j*3)%3]);zz+=len;j++;}}
 }
 function wall(x:number,z:number,w:number,h:number,y=0,angle=0,planks=false){
  if(!planks){k.wall(x,z,w,h,y,angle);return;}
  k.shell.scoped([x,y,z],angle,()=>{
   const count=Math.ceil(w/.38),span=w/count;for(let i=0;i<count;i++)k.shell.box([-w/2+(i+.5)*span,h/2,0],[span,h,.17],p.wood);
   for(const yy of [.15,h-.18])k.shell.box([0,yy,.1],[w,.18,.15],p.dark);
   for(let xx=-w/2;xx<=w/2+.01;xx+=w/Math.ceil(w/3))k.shell.box([xx,h/2,.12],[.16,h,.18],p.dark);
   for(const sign of [-1,1]){k.shell.box([0,.075,sign*.105],[w,.15,.07],p.wood);k.shell.box([0,h-.34,sign*.105],[w,.055,.04],p.trim);}
  });
 }
 function roof(x:number,z:number,w:number,d:number,y:number){k.roof(x,z,w,d,y);for(let zz=z-d/2;zz<=z+d/2;zz+=3)for(const xx of [x-w/2+.14,x+w/2-.14]){k.ceiling.box([xx,y-.2,zz],[.28,.16,.27],p.wood);k.ceiling.cylinder([xx,y-.29,zz],[xx,y-.27,zz],.035,p.dark,8);}}
 function chair(x:number,y:number,z:number){b.scoped([x,y,z],0,()=>{rounded(b,[0,.85,0],[1.1,.14,1],p.wood);for(const xx of [-.43,.43])for(const zz of [-.36,.36])b.beam([xx*1.2,0,zz*1.2],[xx,.9,zz],.1,p.dark);for(const xx of [-.52,.52])rounded(b,[xx,1.5,-.4],[.1,1.3,.15],p.trim);rounded(b,[0,2.02,-.4],[1.08,.17,.12],p.wood);for(const xx of [-.33,0,.33])rounded(b,[xx,1.58,-.4],[.07,.73,.07],p.wood);b.beam([-.46,.35,-.4],[.46,.35,-.4],.065,p.dark);});}
 const finish:typeof k.finish=(...args)=>{
  const room=k.finish(...args),canvas=document.createElement('canvas');canvas.width=canvas.height=64;const ctx=canvas.getContext('2d')!,gradient=ctx.createRadialGradient(32,32,5,32,32,32);gradient.addColorStop(0,'rgba(28,23,18,.25)');gradient.addColorStop(1,'rgba(28,23,18,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);
  const texture=new T.CanvasTexture(canvas),material=new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}),geometry=new T.PlaneGeometry(1,1),patches=new T.InstancedMesh(geometry,material,3);
  [[-5.55,-2.55,1.5,4.2],[-4,-2.55,1.25,1.15],[2.98,2.65,4.8,2.9]].forEach(([x,z,w,d],i)=>patches.setMatrixAt(i,new T.Matrix4().compose(new T.Vector3(x,.028,z),new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),-Math.PI/2),new T.Vector3(w,d,1))));
  patches.userData.noCollision=true;patches.name='soft-furniture-contact';patches.renderOrder=1;room.root.add(patches);const dispose=room.dispose;room.dispose=()=>{dispose();texture.dispose();material.dispose();geometry.dispose();};return room;
 };
 return {...k,desk,shelf,plant,floor,wall,roof,chair,finish};
}

