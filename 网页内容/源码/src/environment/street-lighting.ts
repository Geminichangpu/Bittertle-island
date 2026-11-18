import * as T from 'three';

export type LampSite={x:number;y:number;z:number;reach:number;pavingOffset:number};
type LampFixture={width:number;reach:number;pavingOffset:number};
export const streetFixtures:Record<string,LampFixture>={
 '#ffe0a2':{width:.284,reach:7.2,pavingOffset:.18},
 '#ffe4ac':{width:.18,reach:4.8,pavingOffset:.18},
 '#f6ddac':{width:.284,reach:4.1,pavingOffset:.04},
};

export function collectStreetLamps(root:T.Object3D){
 const sites:LampSite[]=[],matrix=new T.Matrix4(),world=new T.Matrix4();
 root.updateWorldMatrix(true,true);
 root.traverse(node=>{
  if(!(node instanceof T.Mesh)||Array.isArray(node.material))return;
  const fixture=node.material.userData.streetFixture as LampFixture|undefined;
  if(!fixture)return;
  const count=node instanceof T.InstancedMesh?node.count:1;
  for(let i=0;i<count;i++){
   world.copy(node.matrixWorld);
   if(node instanceof T.InstancedMesh){node.getMatrixAt(i,matrix);world.multiply(matrix);}
   const {x,y,z}=new T.Vector3().setFromMatrixPosition(world);
   const scale=new T.Vector3().setFromMatrixColumn(world,0).length()/fixture.width;
   sites.push({x,y,z,reach:fixture.reach*scale,pavingOffset:fixture.pavingOffset});
  }
 });
 return sites;
}

/** One batch of depth-tested halos. Keep the emissive glass visible in oblique and overhead views. */
export function lampHalos(sites:LampSite[]){
 const material=new T.ShaderMaterial({
  transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false,
  uniforms:{strength:{value:0}},
  vertexShader:`varying vec2 discUV;
   void main(){
    discUV=uv*2.-1.;
    vec4 center=modelViewMatrix*instanceMatrix[3];
    center.xy+=position.xy*length(instanceMatrix[0].xyz);
    gl_Position=projectionMatrix*center;
   }`,
  fragmentShader:`varying vec2 discUV; uniform float strength;
   void main(){
    float rr=dot(discUV,discUV);
    float glow=exp(-4.8*rr)*(1.-smoothstep(.55,1.,rr));
    gl_FragColor=vec4(1.,.67,.33,glow*strength);
    #include <colorspace_fragment>
   }`,
 });
 material.userData.streetHalo=true;material.visible=false;
 const mesh=new T.InstancedMesh(new T.PlaneGeometry(1,1),material,sites.length);
 const matrix=new T.Matrix4();
 sites.forEach((p,i)=>{
  const diameter=p.reach*.34;
  matrix.makeScale(diameter,diameter,diameter).setPosition(p.x,p.y+.04,p.z);mesh.setMatrixAt(i,matrix);
 });
 mesh.computeBoundingSphere();mesh.name='室外路灯光晕';mesh.userData.noCollision=true;
 mesh.raycast=()=>{};return mesh;
}

/** Separate, depth-tested patches over the ground near each lamp. */
export function lampPools(sites:LampSite[],heightAt:(x:number,z:number)=>number|undefined){
 const positions:number[]=[],uvs:number[]=[],indices:number[]=[];
 const divisions=16,stride=divisions+1;
 for(const site of sites){
  const start=positions.length/3,valid:boolean[]=[];
  for(let row=0;row<=divisions;row++){
   for(let col=0;col<=divisions;col++){
    const u=col/divisions,v=row/divisions;
    const x=site.x+(2*u-1)*site.reach,z=site.z+(2*v-1)*site.reach;
    const ground=heightAt(x,z);
    valid.push(ground!==undefined&&ground<site.y&&site.y-ground<site.reach*1.1);
    positions.push(x,(ground??site.y)+site.pavingOffset,z);
    uvs.push(u,v);
   }
  }
  for(let row=0;row<divisions;row++){
   for(let col=0;col<divisions;col++){
    const a=row*stride+col,b=a+1,c=a+stride,d=c+1;
    if(valid[a]&&valid[c]&&valid[b])indices.push(start+a,start+c,start+b);
    if(valid[b]&&valid[c]&&valid[d])indices.push(start+b,start+c,start+d);
   }
  }
 }
 const geometry=new T.BufferGeometry();
 geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
 geometry.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));
 geometry.setIndex(indices);
 const size=64,pixels=new Uint8Array(size*size*4).fill(255);
 for(let row=0;row<size;row++){
  for(let col=0;col<size;col++){
   const distance=Math.hypot((col+.5)*2/size-1,(row+.5)*2/size-1);
   pixels[4*(row*size+col)+3]=Math.round(255*Math.max(0,1-distance**2)**2/(1+2.7*distance**2));
  }
 }
 const map=new T.DataTexture(pixels,size,size);
 map.minFilter=map.magFilter=T.LinearFilter;map.needsUpdate=true;
 const material=new T.MeshBasicMaterial({
  color:'#ffba73',map,transparent:true,visible:false,depthWrite:false,
  blending:T.AdditiveBlending,opacity:0,toneMapped:false,
 });
 material.userData.streetPool=true;material.userData.ownedTexture=map;
 const mesh=new T.Mesh(geometry,material);
 mesh.name='路灯局部光斑';mesh.userData.noCollision=true;
 mesh.raycast=()=>{};
 return mesh;
}

