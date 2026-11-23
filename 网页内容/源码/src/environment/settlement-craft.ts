import * as T from 'three';

export type Site = { x: number; y: number; z: number; yaw: number };
type XYZ = [number, number, number];
type Shape = 'timber'|'pole'|'stone'|'flagstone'|'hipRoof'|'leaves'|'flowers'|'cloth'|'ropeRing';
const up = new T.Vector3(0,1,0);

export function at(s:Site, x:number, y:number, z:number) {
  const c=Math.cos(s.yaw), k=Math.sin(s.yaw);
  return new T.Vector3(s.x+c*x+k*z, s.y+y, s.z-k*x+c*z);
}

function faceted(vertices:number[]) {
  const geometry=new T.BufferGeometry();
  geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
  geometry.computeVertexNormals();
  return geometry;
}

/** Unequal corners and a battered face read as split stone even with no texture. */
function dressedStone(flat:boolean) {
  const outline=[[-.48,-.32],[-.29,-.49],[.27,-.47],[.49,-.29],[.46,.27],[.31,.47],[-.34,.48],[-.49,.28]];
  const rings=flat ? [[-.50,.91],[.18,1],[.5,.91]] : [[-.5,.87],[-.29,1],[.32,.96],[.5,.82]];
  const vertices:number[]=[];
  const atRing=(row:number,i:number):XYZ=>{
    const [x,z]=outline[i%outline.length], [h,r]=rings[row];
    return [x*r+.013*Math.sin(i*2.6+row),h+.034*Math.sin(i*2.9+row),z*r];
  };
  const end=rings.length-1;
  for(let i=0;i<outline.length;i++){
    const j=i+1;
    vertices.push(0,.51,0,...atRing(end,j),...atRing(end,i));
    vertices.push(0,-.51,0,...atRing(0,i),...atRing(0,j));
    for(let r=0;r<end;r++){
      const a=atRing(r,i),b=atRing(r,j),c=atRing(r+1,i),d=atRing(r+1,j);
      vertices.push(...a,...c,...b,...b,...c,...d);
    }
  }
  return faceted(vertices);
}

function hipRoof() {
  const a:XYZ=[-.5,0,-.5], b:XYZ=[.5,0,-.5], c:XYZ=[.5,0,.5], d:XYZ=[-.5,0,.5];
  const l:XYZ=[-.235,1,0], r:XYZ=[.235,1,0], v:number[]=[];
  v.push(...a,...l,...r,...a,...r,...b, ...d,...c,...r,...d,...r,...l);
  v.push(...a,...d,...l,...b,...r,...c, ...a,...b,...c,...a,...c,...d);
  return faceted(v);
}

function leaves() {
  const v:number[]=[];
  for(let i=0;i<20;i++){
    const a=i*2.39996, dx=Math.cos(a),dz=Math.sin(a), level=i%3;
    const span=.66+.23*Math.sin(i*1.97), y=.16+level*.23;
    const point=(along:number,across:number,h:number):XYZ=>[dx*along-dz*across,y+h,dz*along+dx*across];
    const start=point(.035,0,0), middle=point(span*.55,0,.20), end=point(span,0,.015+level*.03);
    const left=point(span*.53,.17,.075), right=point(span*.53,-.17,.075);
    v.push(...start,...left,...middle,...middle,...left,...end,...start,...middle,...right,...right,...middle,...end);
  }
  return faceted(v);
}

/** Tiny four-petalled florets form one open hydrangea head. */
function flowers() {
  const v:number[]=[];
  for(let i=0;i<17;i++){
    const a=i*2.39996, spread=Math.sqrt(i/17)*.50;
    const x=Math.cos(a)*spread,z=Math.sin(a)*spread,y=.22*(1-i/17);
    for(let petal=0;petal<4;petal++){
      const angle=petal*Math.PI*.5+a, dx=Math.cos(angle),dz=Math.sin(angle);
      const c:XYZ=[x,y,z], l:XYZ=[x+dx*.075-dz*.064,y+.038,z+dz*.075+dx*.064];
      const r:XYZ=[x+dx*.075+dz*.064,y+.032,z+dz*.075-dx*.064], tip:XYZ=[x+dx*.17,y+.063,z+dz*.17];
      v.push(...c,...l,...tip,...c,...tip,...r);
    }
  }
  return faceted(v);
}

function hangingCloth(){
  const v:number[]=[];
  const point=(i:number,j:number):XYZ=>{
    const x=i/8-.5,y=-j/4;
    return [x, y+.028*Math.sin(4*x+1)*j/4, .043*Math.cos(i*1.61)+.048*Math.sin(i*.72+1.6*j)*j/4];
  };
  for(let i=0;i<8;i++)for(let j=0;j<4;j++){
    const a=point(i,j),b=point(i+1,j),c=point(i,j+1),d=point(i+1,j+1);
    v.push(...a,...c,...b,...b,...c,...d);
  }
  return faceted(v);
}

const geometryFactories:Record<Shape,()=>T.BufferGeometry>={
  timber:()=>new T.BoxGeometry(1,1,1),
  pole:()=>new T.CylinderGeometry(.94,1,1,8),
  stone:()=>dressedStone(false),
  flagstone:()=>dressedStone(true),
  hipRoof,
  leaves,
  flowers,
  cloth:hangingCloth,
  ropeRing:()=>new T.TorusGeometry(1,.145,5,18),
};

/** Shape batches share both geometry and white material, with pigments on instances. */
export class Craft {
  private readonly pieces=new Map<Shape,{matrix:T.Matrix4;shade:T.Color}[]>();

  add(shape:Shape, p:T.Vector3, scale:XYZ, pigment:string, rotation:number|T.Quaternion=0) {
    const q=typeof rotation==='number'?new T.Quaternion().setFromAxisAngle(up,rotation):rotation;
    const matrix=new T.Matrix4().compose(p,q,new T.Vector3(...scale));
    let group=this.pieces.get(shape);
    if(!group){group=[];this.pieces.set(shape,group);}
    group.push({matrix,shade:new T.Color(pigment)});
  }

  beam(a:T.Vector3,b:T.Vector3,size:number,color:string,round=false) {
    const span=b.clone().sub(a), length=span.length();
    if(length<.002)return;
    const q=new T.Quaternion().setFromUnitVectors(up,span.multiplyScalar(1/length));
    this.add(round?'pole':'timber',a.clone().lerp(b,.5),[size,length,size],color,q);
  }

  cord(a:T.Vector3,b:T.Vector3,sag:number,radius:number,color:string){
    let previous=a;
    for(let i=1;i<=6;i++){
      const t=i/6, next=a.clone().lerp(b,t);
      next.y-=4*sag*t*(1-t);
      this.beam(previous,next,radius,color,true);
      previous=next;
    }
  }

  finish(){
    const root=new T.Group();
    root.name='settlement-life';
    root.userData.noCollision=true;
    if(!this.pieces.size)return root;
    const matte=new T.MeshStandardMaterial({color:'#ffffff',roughness:.92});
    const thin=matte.clone();thin.side=T.DoubleSide;thin.forceSinglePass=true;
    for(const [shape,parts] of this.pieces){
      const sheet=shape==='cloth'||shape==='leaves'||shape==='flowers';
      const mesh=new T.InstancedMesh(geometryFactories[shape](),sheet?thin:matte,parts.length);
      mesh.name='settlement-'+shape;
      mesh.userData.noCollision=true;
      for(let i=0;i<parts.length;i++){
        mesh.setMatrixAt(i,parts[i].matrix);
        mesh.setColorAt(i,parts[i].shade);
      }
      mesh.instanceMatrix.needsUpdate=true;
      if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
      mesh.castShadow=true;mesh.receiveShadow=true;
      mesh.computeBoundingSphere();
      root.add(mesh);
    }
    if(!root.children.some(n=>(n as T.Mesh).material===thin))thin.dispose();
    if(!root.children.some(n=>(n as T.Mesh).material===matte))matte.dispose();
    return root;
  }
}
