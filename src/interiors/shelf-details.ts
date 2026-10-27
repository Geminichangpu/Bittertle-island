import type {Builder} from '../generators/shrine';

/** Stable little still lifes: no random changes on re-entry and no animated props. */
export function dressShelf(b:Builder,x:number,y:number,z:number,width:number,height:number,seed:number,colors:string[]){
 let state=(seed*2654435761)>>>0;const random=()=>{state=(state*1664525+1013904223)>>>0;return state/4294967296;};
 const paper='#dfd9c6',metal='#b39359',dark='#46505a',h=Math.min(height*.78,.72),depth=.42;
 const book=(xx:number,ww:number,hh:number,color:string)=>{
  b.box([xx,y+hh/2,z],[ww,hh,depth],color);
  b.box([xx,y+hh/2,z+.219],[ww*.7,hh*.87,.015],color);
  for(const yy of [.16,.83])b.box([xx,y+hh*yy,z+.23],[ww*.78,.015,.012],metal);
  b.box([xx,y+hh*.6,z+.23],[ww*.56,hh*.12,.012],paper);
  b.box([xx,y+hh+.004,z-.015],[ww*.76,.012,depth*.8],paper);
 };
 const motif=Math.abs(seed)%5,left=x-width/2+.09;
 const booksWidth=width*(motif===0?.85:motif===3?.35:.48);
 let cursor=left;
 while(cursor<left+booksWidth-.1){const ww=.1+random()*.09;if(cursor+ww>left+booksWidth)break;book(cursor+ww/2,ww,h*(.7+random()*.3),colors[Math.floor(random()*colors.length)]);cursor+=ww+.025+random()*.035;}
 if(motif===0)return;
 const cx=x+width*.24,available=Math.max(.2,width*.38),ww=Math.min(.65,available);
 if(motif===1||motif===3){
  const count=motif===1?3:2;for(let j=0;j<count;j++){const w=ww*(.85+random()*.15),zz=z+(random()-.5)*.06,xx=cx+(random()-.5)*.05,yy=y+.04+j*.11;
   b.box([xx,yy,zz],[w,.075,.36],paper);for(const side of [-1,1])b.box([xx,yy+side*.044,zz],[w+.025,.013,.38],colors[(seed+j)%colors.length]);
   for(let line=0;line<3;line++)b.box([xx,yy-.025+line*.023,zz+.183],[w-.03,.003,.006],'#bbb4a2');
  }
  if(motif===3){b.cylinder([cx,y+.24,z],[cx,y+.43,z],.095,'#b9c8c2',16);b.cylinder([cx,y+.43,z],[cx,y+.448,z],.074,dark,16);b.beam([cx+.08,y+.39,z],[cx+.15,y+.35,z],.025,metal);b.beam([cx+.15,y+.35,z],[cx+.08,y+.28,z],.025,metal);}
 }else if(motif===2){
  const hh=Math.min(.36,height*.4);b.box([cx,y+hh/2,z],[ww,hh,.4],colors[seed%colors.length]);b.box([cx,y+hh+.025,z],[ww+.025,.05,.42],paper);b.box([cx,y+hh*.55,z+.207],[ww*.34,.08,.016],metal);b.box([cx,y+hh*.55,z+.22],[ww*.23,.045,.008],paper);
 }else{
  const hh=Math.min(.5,height*.68);b.box([cx,y+hh/2,z+.08],[ww*.8,hh,.055],metal);b.box([cx,y+hh/2,z+.112],[ww*.69,hh*.87,.012],'#a6c7cf');b.box([cx,y+hh*.32,z+.122],[ww*.69,hh*.25,.008],'#708b70');b.ball([cx+ww*.15,y+hh*.72,z+.128],[.045,.045,.006],'#f5e2b6');
 }
}
