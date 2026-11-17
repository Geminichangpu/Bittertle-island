import * as T from 'three';
import type {Builder} from './shrine';

type V=[number,number,number];

/** Low seaside play deck. The flared runout and both guard lips share a curved profile. */
export function addParkSlide(b:Builder,x:number){
 const teal='#427f82',honey='#b89260',trim='#eed6a4';
 b.scoped([x,.12,.17],0,()=>{
  for(const side of [-1,1]){
   for(const z of [-1.12,-.02]){
    b.cylinder([side*.51,.03,z],[side*.51,1.54,z],.093,honey,12);
    b.cylinder([side*.51,.02,z],[side*.51,.17,z],.118,teal,12);
   }
   // A rounded wave cut from marine plywood, with an actual porthole.
   b.emit('park:wave-side',()=>{
    const s=new T.Shape();
    s.moveTo(-1.27,1.51);s.lineTo(.24,1.51);s.quadraticCurveTo(.46,1.55,.37,1.85);
    s.bezierCurveTo(.17,2.61,-.16,2.88,-.56,2.65);s.bezierCurveTo(-.24,2.64,-.32,2.30,-.63,2.32);
    s.bezierCurveTo(-.97,2.33,-1.29,2.62,-1.34,2.30);s.lineTo(-1.34,1.65);s.quadraticCurveTo(-1.34,1.51,-1.27,1.51);
    const hole=new T.Path();hole.absarc(-.85,1.96,.177,0,Math.PI*2,true);s.holes.push(hole);
    return new T.ExtrudeGeometry(s,{depth:.068,bevelEnabled:true,bevelThickness:.016,bevelSize:.018,bevelSegments:3,curveSegments:18}).rotateY(-Math.PI/2);
   },teal,[side*.569+.034,0,0]);
   b.emit('park:porthole',()=>new T.TorusGeometry(.19,.021,8,32).rotateY(Math.PI/2),trim,[side*.617,1.96,-.85]);
   b.cylinder([side*.45,.09,-2.51],[side*.45,1.53,-1.20],.062,teal,12);
   const grip:V[]=[[side*.49,.74,-2.46],[side*.49,2.04,-1.33],[side*.49,2.12,-1.21]];
   for(let j=1;j<grip.length;j++)b.cylinder(grip[j-1],grip[j],.047,teal,12);
   for(const z of [-2.35,-1.76]){const h=.15+(z+2.51)*1.09;b.cylinder([side*.47,h,z],[side*.47,h+.58,z],.032,teal,10);}
  }
  for(let j=0;j<6;j++)b.box([0,.17+j*.235,-2.42+j*.216],[.85,.095,.265],honey);
  for(let j=0;j<7;j++)b.box([0,1.50,-1.20+j*.203],[1.12,.10,.195],honey);
  const path=new T.CatmullRomCurve3([
   new T.Vector3(0,1.545,.015),new T.Vector3(.02,1.52,.32),new T.Vector3(.10,1.32,.77),
   new T.Vector3(.25,.86,1.36),new T.Vector3(.39,.43,1.94),new T.Vector3(.46,.23,2.48),new T.Vector3(.46,.22,2.85)
  ]);
  const profile=[[-.51,.17],[-.475,.179],[-.451,.141],[-.427,.077],[-.37,.033],[-.26,.009],[0,0],[.26,.009],[.37,.033],[.427,.077],[.451,.141],[.475,.179],[.51,.17],[.49,.092],[.45,.021],[.37,-.018],[0,-.036],[-.37,-.018],[-.45,.021],[-.49,.092]];
  b.emit('park:sea-glass-chute',()=>{
   const pos:number[]=[],index:number[]=[],n=profile.length;
   for(let j=0;j<=36;j++){
    const t=j/36,q=path.getPoint(t),v=path.getTangent(t),d=Math.hypot(v.x,v.z);
    for(const [w,h] of profile){const width=w*(1+.17*t**4);pos.push(q.x+width*v.z/d,q.y+h*(1-.47*t**4),q.z-width*v.x/d);}
    if(j)for(let i=0;i<n;i++){const a=(j-1)*n+i,c=(j-1)*n+(i+1)%n;index.push(a,a+n,c,c,a+n,c+n);}
   }
   for(const j of [0,36])for(let i=1;i<n-1;i++)index.push(j*n,j*n+(j?i+1:i),j*n+(j?i:i+1));
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(index);g.computeVertexNormals();return g;
  },'#8dc8c2',[0,0,0]);
  for(const [xx,z,h] of [[.23,1.23,.88],[.44,2.28,.24]])for(const side of [-1,1])b.cylinder([xx+side*.29,.02,z],[xx+side*.29,h,z],.045,teal,10);
 });
}
