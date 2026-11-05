import * as T from 'three';
import plasterColor from '../assets/wall-materials/Plaster001_neutral.jpg?url';
import plasterNormal from '../assets/wall-materials/Plaster001_1K-JPG_NormalGL.jpg?url';
import plasterRough from '../assets/wall-materials/Plaster001_1K-JPG_Roughness.jpg?url';
import towerColor from '../assets/wall-materials/Plaster002_neutral.jpg?url';
import towerNormal from '../assets/wall-materials/Plaster002_1K-JPG_NormalGL.jpg?url';
import towerRough from '../assets/wall-materials/Plaster002_1K-JPG_Roughness.jpg?url';
import woodColor from '../assets/wall-materials/brown_planks_05_diff_1k.jpg?url';
import woodNormal from '../assets/wall-materials/brown_planks_05_nor_gl_1k.jpg?url';
import woodRough from '../assets/wall-materials/brown_planks_05_rough_1k.jpg?url';
import type {InteriorRoom} from './room-kit';

type Kind='wood-office'|'wood-bedroom'|'plaster'|'tower';
const sources:Record<Kind,string[]>={
 'wood-office':[woodColor,woodNormal,woodRough], 'wood-bedroom':[woodColor,woodNormal,woodRough],
 plaster:[plasterColor,plasterNormal,plasterRough],tower:[towerColor,towerNormal,towerRough],
};

/** Apply separately owned maps only to identified wall meshes, keeping frames and furniture. */
export class InteriorWallMaterials {
 private disposed=false;private textures:T.Texture[]=[];
 private originals=new Map<T.Mesh,T.Material|T.Material[]>();private clones=new Map<T.Material,T.Material>();
 constructor(private room:InteriorRoom,private kind:Kind,private onReady:()=>void){void this.load();}
 private async load(){
  const loader=new T.TextureLoader();const results=await Promise.allSettled(sources[this.kind].map(url=>loader.loadAsync(url)));
  const loaded=results.flatMap(r=>r.status==='fulfilled'?[r.value]:[]);
  if(this.disposed||results.some(r=>r.status==='rejected')){loaded.forEach(t=>t.dispose());if(!this.disposed)console.warn('墙面材质加载失败，保留原材质');return;}
  this.textures=loaded;loaded.forEach((t,i)=>{t.colorSpace=i===0?T.SRGBColorSpace:T.NoColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.flipY=false;t.anisotropy=4;t.needsUpdate=true;});
  this.apply();this.onReady();
 }
 private matches(node:T.Mesh,m:T.Material){
  if(this.kind==='tower')return node.name.startsWith('walls_')&&m.name.includes('grey_plaster');
  if(!node.name.startsWith('01_墙'))return false;
  if(this.kind==='plaster')return m.name.includes('grey_plaster');
  if(this.kind==='wood-office')return m.name.startsWith('SR_a58b68_')||m.name.startsWith('SR_c1a17a_');
  return m.name.startsWith('SR_a48460_')||m.name.startsWith('SR_c2a47d_');
 }
 apply(){if(this.disposed||this.textures.length!==3)return;
  this.room.root.traverse(node=>{if(!(node instanceof T.Mesh)||this.originals.has(node))return;const list=Array.isArray(node.material)?node.material:[node.material];if(!list.some(m=>this.matches(node,m)))return;
   this.originals.set(node,node.material);const mapped=list.map(m=>{if(!(m instanceof T.MeshStandardMaterial)||!this.matches(node,m))return m;let clone=this.clones.get(m) as T.MeshStandardMaterial|undefined;
    if(!clone){clone=m.clone();clone.map=this.textures[0];clone.normalMap=this.textures[1];clone.roughnessMap=this.textures[2];clone.normalScale.set(.25,.25);clone.roughness=1;clone.metalness=0;clone.color.set(this.kind==='plaster'?'#e3d6bc':this.kind==='tower'?'#f3f4f4':'#e0c6a2');clone.needsUpdate=true;this.clones.set(m,clone);}return clone;});
   node.material=Array.isArray(node.material)?mapped:mapped[0];
  });
 }
 dispose(){this.disposed=true;this.originals.forEach((material,mesh)=>mesh.material=material);this.originals.clear();this.clones.forEach(m=>m.dispose());this.clones.clear();this.textures.forEach(t=>t.dispose());this.textures=[];}
}
