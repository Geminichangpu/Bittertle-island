import * as T from 'three';
import type {Project} from '../data/model';
import type {Builder} from '../generators/shrine';
import {sampleHeight} from '../terrain/terrain';
import {crownGeometry,leafSprigGeometry} from './nature-geometry';

/** Static campus furniture and seawall; no minor office buildings from the reference. */
export function addCentralCampus(p:Project,b:Builder){
 const c=p.terrain.campus;if(!c)return;
 const [cx,cz]=c.center,r=c.radius,y=c.level,bridge=p.objects.find(o=>o.templateId==='island_bridge');
 const gapZ=bridge?.position[2]??cz+5,gapW=(bridge?.params.depth??5)*.65;
 const gap=(x:number,z:number)=>x>cx&&Math.abs(z-gapZ)<gapW;
 const point=(a:number,rr:number):[number,number,number]=>{const x=cx+Math.cos(a)*rr,z=cz+Math.sin(a)*rr;return [x,sampleHeight(p.terrain,x,z)+.08,z];};
 for(let i=0;i<128;i++){
  const a=i*Math.PI/64,aa=(i+1)*Math.PI/64,mid=(a+aa)/2,x=cx+Math.cos(mid)*r,z=cz+Math.sin(mid)*r;
  if(gap(x,z))continue;
  b.box([x,y/2,z],[r*Math.PI/64+.1,y,1.2],'#939ea8',-mid+Math.PI/2);
  for(let row=0;row<3;row++)b.ball([cx+Math.cos(mid)*(r+.45),.7+row*(y-1)/3,cz+Math.sin(mid)*(r+.45)],[.65,y/6,.65],i%2?'#8c959e':'#b2b9bc');
  const left=point(a,r-1.7),right=point(aa,r-1.7);
  b.box([(left[0]+right[0])/2,(left[1]+right[1])/2,(left[2]+right[2])/2],[r*Math.PI/64+.1,.14,1.65],'#bcc6cd',-mid+Math.PI/2);
  const edge=point(a,r-.45),next=point(aa,r-.45);
  for(const h of [.7,1.25])b.cylinder([edge[0],edge[1]+h,edge[2]],[next[0],next[1]+h,next[2]],.055,'#e5edf0');
  if(i%4===0){b.cylinder(edge,[edge[0],edge[1]+1.3,edge[2]],.065,'#c7d0d7');}
  if(i%12===0){const v=point(a,r-2.9);b.cylinder(v,[v[0],v[1]+3,v[2]],.06,'#a7bbc5');b.box([v[0],v[1]+3,v[2]],[.6,.12,.28],'#f3f8eb');}
 }
 for(const radius of [9,9.8])b.emit('campus:ring:'+radius,()=>new T.RingGeometry(radius-.3,radius,96).rotateX(-Math.PI/2),'#d6e0df',[cx,y+.1,cz]);
 // Garden walks, trimmed lawns and regularly spaced trees, leaving the bridge approach open.
 for(let i=0;i<32;i++){
  const a=i*Math.PI/16,x=cx+Math.cos(a)*(r-6),z=cz+Math.sin(a)*(r-6);
  if(gap(x,z)||Math.abs(x-cx)<2.7)continue;
  const yy=sampleHeight(p.terrain,x,z);b.cylinder([x,yy,z],[x,yy+2.2,z],.15,'#7a765f');
  const color=i%2?'#7ca968':'#629453';
  b.emit('campus:tree-crown',crownGeometry,color,[x,yy+2.7,z],[1.1,1.8,1.1]);
  for(let j=0;j<3;j++){const angle=j*2.4+i,xx=x+Math.cos(angle)*.6,zz=z+Math.sin(angle)*.6;b.cylinder([x,yy+1.4,z],[xx,yy+2.8,zz],.065,'#7a765f');b.emit('campus:leaf-sprig',leafSprigGeometry,color,[xx,yy+3.2,zz],[1.3,1.3,1.3],new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),angle));}
  b.box([x,yy+.05,z],[2.8,.09,2.8],'#8bb575');
 }
 for(const side of [-1,1])b.box([cx,y+.12,cz+side*(r+10)/2],[2,.13,r-10],'#dce3df');
 // Gentle paved approach joins the existing bridge without changing its transform.
 for(let x=cx+8;x<cx+r;x+=.6){const yy=sampleHeight(p.terrain,x,gapZ);b.box([x,yy+.07,gapZ],[.62,.12,(bridge?.params.depth??5)-.2],'#d6e0e5');}
 const fz=cz+14;
 b.cylinder([cx,y+.12,fz],[cx,y+.5,fz],2.6,'#e2e9e9',48);
 b.cylinder([cx,y+.51,fz],[cx,y+.55,fz],2.2,'#52b8d4',48);
 b.cylinder([cx,y+.55,fz],[cx,y+3.5,fz],.11,'#c3ecf2',12);
 for(let i=0;i<8;i++){const a=i*Math.PI/4;b.ball([cx+Math.cos(a)*.5,y+1.2,fz+Math.sin(a)*.5],[.06,.4,.06],'#b3e4ec');}
}
