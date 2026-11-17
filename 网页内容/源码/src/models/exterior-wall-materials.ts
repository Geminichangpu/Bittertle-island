import * as T from 'three';
import colorUrl from '../assets/wall-materials/Plaster001_neutral.jpg?url';
import normalUrl from '../assets/wall-materials/Plaster001_1K-JPG_NormalGL.jpg?url';
import roughUrl from '../assets/wall-materials/Plaster001_1K-JPG_Roughness.jpg?url';

/** Shared plaster maps, applied only to named pale exterior wall materials with UVs. */
export class ExteriorWallMaterials {
 private disposed=false;private textures:T.Texture[]=[];private originalTextures=new Set<T.Texture>();private pending?:Promise<boolean>;
 supports(id:string){return id==='scenic_academy'||id==='landmark_library'||['shrine_main','shrine_office','shrine_residence','shrine_temizu'].includes(id);}
 private ready(){if(this.pending)return this.pending;this.pending=(async()=>{const loader=new T.TextureLoader(),results=await Promise.allSettled([colorUrl,normalUrl,roughUrl].map(url=>loader.loadAsync(url)));const textures=results.flatMap(r=>r.status==='fulfilled'?[r.value]:[]);if(this.disposed||results.some(r=>r.status==='rejected')){textures.forEach(t=>t.dispose());return false;}textures.forEach((t,i)=>{t.colorSpace=i===0?T.SRGBColorSpace:T.NoColorSpace;t.flipY=false;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;t.userData.aboSharedWallTexture=true;t.needsUpdate=true;});this.textures=textures;return true;})();return this.pending;}
 async apply(root:T.Object3D,id:string){if(!this.supports(id)||!await this.ready()||this.disposed)return;
  const targets=new Set<T.MeshStandardMaterial>();root.traverse(n=>{if(!(n instanceof T.Mesh)||!n.geometry.getAttribute('uv'))return;for(const m of Array.isArray(n.material)?n.material:[n.material])if(m instanceof T.MeshStandardMaterial&&(m.name==='SC_plain_eee3cd'||m.name==='EX_d5c8ae_grey_plaster_surface'||m.name==='EX_e3e2d3_grey_plaster_surface'))targets.add(m);});
  for(const m of targets){for(const t of [m.map,m.normalMap,m.roughnessMap])if(t&&!t.userData.aboSharedWallTexture)this.originalTextures.add(t);const hex=m.name==='SC_plain_eee3cd'?'#eee3cd':m.name.startsWith('EX_d5')?'#d5c8ae':'#e3e2d3';m.map=this.textures[0];m.normalMap=this.textures[1];m.roughnessMap=this.textures[2];m.normalScale.set(.2,.2);m.color.set(hex);m.roughness=1;m.metalness=0;m.needsUpdate=true;}
 }
 dispose(){this.disposed=true;this.textures.forEach(t=>t.dispose());this.textures=[];this.originalTextures.forEach(t=>t.dispose());this.originalTextures.clear();}
}
