import * as T from 'three';

export type NatureKind='gravel'|'paving'|'bark'|'rock'|'cliff'|'coast-ground'|'coast-trail';
const files=import.meta.glob('../assets/textures/island-nature/*.jpg',{eager:true,query:'?url',import:'default'}) as Record<string,string>;

/** Textures are owned by one derived environment, including its shared walk-view clones. */
export function createNatureMaterials(onReady:()=>void){
 const textures=new Map<string,T.Texture>(),materials=new Map<string,T.MeshStandardMaterial>();
 const loader=new T.TextureLoader();let alive=true;
 function map(kind:NatureKind,channel:'color'|'rough'|'normal'){
  const key=kind+'-'+channel;
  if(!textures.has(key)){
   // A complete neutral texture avoids WebGL sampling an incomplete image as
   // black while the network is slow or after a request fails. Material clones
   // share this Texture, so the real image appears everywhere once decoded.
   const canvas=document.createElement('canvas');canvas.width=canvas.height=1;
   const ctx=canvas.getContext('2d')!;ctx.fillStyle=channel==='normal'?'rgb(128,128,255)':'white';ctx.fillRect(0,0,1,1);
   const texture=new T.CanvasTexture(canvas);
   loader.load(files['../assets/textures/island-nature/'+key+'.jpg'],loaded=>{if(alive){texture.image=loaded.image;texture.needsUpdate=true;onReady();}loaded.dispose();},undefined,()=>{if(alive)onReady();});
   texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.anisotropy=4;
   texture.colorSpace=channel==='color'?T.SRGBColorSpace:T.NoColorSpace;
   if(kind==='bark')texture.repeat.set(1,2);
   textures.set(key,texture);
  }
  return textures.get(key)!;
 }
 return {
  material(kind:NatureKind,color='#ffffff',vertexColors=false){
   const key=kind+'|'+color+'|'+vertexColors;
   if(!materials.has(key)){
    const strength=kind==='bark'?.42:kind==='rock'?.34:.27;
    const m=new T.MeshStandardMaterial({color,map:map(kind,'color'),roughnessMap:map(kind,'rough'),normalMap:map(kind,'normal'),normalScale:new T.Vector2(strength,strength),roughness:1,metalness:0,vertexColors});
    m.name='外景 '+kind+' PBR';m.userData.surfaceKind='nature';materials.set(key,m);
   }
   return materials.get(key)!;
  },
  dispose(){alive=false;textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());textures.clear();materials.clear();}
 };
}
