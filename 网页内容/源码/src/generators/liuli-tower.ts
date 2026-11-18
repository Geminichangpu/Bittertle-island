import * as T from 'three';
import type {Builder,Cache} from './shrine';

export function buildLiuliTower(b:Builder,cache:Cache,width:number,depth:number,height:number){
 const size=Math.min(width,depth),radius=size*.166,top=radius*.81,deck=.65,glassTop=height*.86;
 const silver='#d8e4eb',steel='#a1b7c7',glass='#346487';
 for(let i=0;i<3;i++)b.emit('liuli:podium',()=>new T.CylinderGeometry(1,1,1,64),'#dce2df',[0,.13+i*.22,0],[size*(.49-i*.025),.24,size*(.49-i*.025)]);
 const outline=(y:number)=>T.MathUtils.lerp(radius,top,(y-deck)/(glassTop-deck));
 const strips=8;
 b.emit('liuli:core',()=>new T.CylinderGeometry(top/radius,1,1,strips),glass,[0,(deck+glassTop)/2,0],[radius,glassTop-deck,radius]);
 for(let face=0;face<strips;face++)b.scoped([0,0,0],(face+.5)*Math.PI/4,()=>{
  const apothem=Math.cos(Math.PI/8),span=Math.sin(Math.PI/8);
  const z=(y:number)=>outline(y)*apothem;
  for(const lane of [-.98,-.34,.34,.98])b.beam([lane*radius*span,deck,z(deck)],[lane*top*span,glassTop,z(glassTop)],lane===-.98||lane===.98?.072:.043,silver);
  const floors=27;
  for(let floor=0;floor<floors;floor++){
   const y=T.MathUtils.lerp(deck+.16,glassTop-.16,floor/(floors-1)),r=outline(y);
   b.box([0,y,z(y)+.015],[r*span*2,.064,.095],steel);
   for(let pane=-1;pane<=1;pane++){
    const width=r*span*.6,paneY=y+.25;
    if(floor===floors-1)continue;
    const color=['#315d85','#386e98','#437ca1','#4b8bb0'][(face*13+floor*3+pane+1)%4];
    b.emit('liuli:glazing-pane',()=>new T.BoxGeometry(1,1,1),color,[pane*width,paneY,z(paneY)+.026],[width*.90,.46,.052],new T.Quaternion(),(floor+face+pane)%5===0?cache.mat(color,'window'):cache.mat(color));
   }
  }
 });
 for(let i=0;i<4;i++)b.scoped([0,0,0],i*Math.PI/2+Math.PI/4,()=>{
  const segments=44;
  b.emit(`liuli:buttress:${size}:${height}`,()=>{
   const vertices:number[]=[],indices:number[]=[];
   for(let row=0;row<=segments;row++){
    const t=row/segments,y=.59+t*height*.78,z=top*.94+(size*.415-top*.94)*(1-t)**3.35;
    const width=size*(.022*(1-t)+.005),thickness=.12+.23*(1-t);
    for(let facet=0;facet<6;facet++){
     const a=facet*Math.PI/3;vertices.push(width*Math.cos(a),y,z+thickness*Math.sin(a));
    }
    if(row>0)for(let facet=0;facet<6;facet++){
     const a=(row-1)*6+facet,c=(row-1)*6+(facet+1)%6;
     indices.push(a,a+6,c,c,a+6,c+6);
    }
   }
   const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
  },silver,[0,0,0]);
  b.box([0,.74,size*.415],[.78,.26,.82],steel);
 });
 b.emit('liuli:crown-band',()=>new T.CylinderGeometry(1,1,1,8),steel,[0,glassTop+.09,0],[top+.04,.18,top+.04]);
 for(const side of [-1,1])b.beam([side*.22,glassTop,0],[side*size*.10,height*.97,0],.14,silver);
 b.cylinder([0,glassTop,0],[0,height,0],.069,silver,10);
 const front=radius+.30;
 b.box([0,1.78,front],[1.68,2.18,.1],'#4f7f96');
 for(const x of [-.87,0,.87])b.box([x,1.78,front+.065],[.061,2.18,.11],silver);
 b.box([0,2.92,front+.45],[2.66,.13,1.52],silver);
 for(const x of [-1.12,1.12])b.cylinder([x,.62,front+.95],[x,2.88,front+.95],.057,steel,12);
}

