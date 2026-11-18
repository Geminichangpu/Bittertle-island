import * as T from 'three';

/** Low-frequency sky and ground radiance plus broad window reflections for rough PBR surfaces. */
export function materialDaylight(renderer:T.WebGLRenderer,scene:T.Scene,indoors:boolean){
 const width=256,height=128,rgba=new Uint16Array(width*height*4);
 const half=T.DataUtils.toHalfFloat;
 const sun=new T.Vector3(-.48,.62,.53).normalize();
 for(let j=0;j<height;j++){
  const lat=((j+.5)/height-.5)*Math.PI,y=Math.sin(lat),radius=Math.cos(lat);
  for(let i=0;i<width;i++){
   const phi=((i+.5)/width-.5)*Math.PI*2,x=Math.cos(phi)*radius,z=Math.sin(phi)*radius;
   const up=Math.max(y,0),horizon=Math.exp(-Math.abs(y)*5);
   const dot=x*sun.x+y*sun.y+z*sun.z;
   const glow=Math.exp(-Math.max(0,1-dot)*(indoors?14:36));
   const window=indoors&&z<-.51&&Math.abs(x)<.72&&y>-.20&&y<.67?1.85:0;
   const base=indoors?.13+up*.17:.28+up*.58;
   const rgb=[base+horizon*.13+glow*1.55+window,base*.96+horizon*.15+glow*1.27+window*1.10,base*(y>0?1.18:.83)+horizon*.17+glow*.94+window*1.22];
   const offset=(j*width+i)*4;
   for(let k=0;k<3;k++)rgba[offset+k]=half(rgb[k]);
   rgba[offset+3]=half(1);
  }
 }
 const sky=new T.DataTexture(rgba,width,height,T.RGBAFormat,T.HalfFloatType);
 sky.mapping=T.EquirectangularReflectionMapping;sky.colorSpace=T.LinearSRGBColorSpace;sky.needsUpdate=true;
 const pmrem=new T.PMREMGenerator(renderer);
 try{
  const target=pmrem.fromEquirectangular(sky);scene.environment=target.texture;
  return ()=>{if(scene.environment===target.texture)scene.environment=null;target.dispose();};
 }finally{pmrem.dispose();sky.dispose();}
}

