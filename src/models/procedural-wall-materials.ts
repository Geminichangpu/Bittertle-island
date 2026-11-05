import * as T from 'three';
import colorUrl from '../assets/wall-materials/Plaster001_neutral.jpg?url';
import normalUrl from '../assets/wall-materials/Plaster001_1K-JPG_NormalGL.jpg?url';
import roughUrl from '../assets/wall-materials/Plaster001_1K-JPG_Roughness.jpg?url';
import type {Project} from '../data/model';

/** Restrict material changes to the authored plaster color on small procedural buildings. */
export class ProceduralWallMaterials {
 private disposed=false;private textures:T.Texture[]=[];private originals=new Map<T.Mesh,T.Material|T.Material[]>();private clones=new Map<T.Material,T.Material>();
 constructor(private project:()=>Project,private node:(id:string)=>T.Object3D|undefined,private onReady:()=>void){void this.load();}
 private async load(){const loader=new T.TextureLoader(),results=await Promise.allSettled([colorUrl,normalUrl,roughUrl].map(url=>loader.loadAsync(url)));const maps=results.flatMap(r=>r.status==='fulfilled'?[r.value]:[]);if(this.disposed||results.some(r=>r.status==='rejected')){maps.forEach(t=>t.dispose());return;}maps.forEach((t,i)=>{t.colorSpace=i===0?T.SRGBColorSpace:T.NoColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;t.needsUpdate=true;});this.textures=maps;this.apply();this.onReady();}
 restore(){this.originals.forEach((m,n)=>n.material=m);this.originals.clear();this.clones.forEach(m=>m.dispose());this.clones.clear();}
 apply(){if(this.disposed||this.textures.length!==3)return;
  for(const o of this.project().objects){if(!['layout_villa','layout_island_house','layout_island_restaurant'].includes(o.templateId))continue;const root=this.node(o.id);if(!root)continue;const wallColor=new T.Color(o.params.wallColor);
   const visit=(node:T.Object3D)=>{if(node.name.startsWith('abo-outdoor-'))return;if(node instanceof T.Mesh&&!this.originals.has(node)&&node.geometry.getAttribute('uv')){const list=Array.isArray(node.material)?node.material:[node.material];if(list.some(m=>m instanceof T.MeshStandardMaterial&&m.color.equals(wallColor))){this.originals.set(node,node.material);const mapped=list.map(m=>{if(!(m instanceof T.MeshStandardMaterial)||!m.color.equals(wallColor))return m;let clone=this.clones.get(m) as T.MeshStandardMaterial|undefined;if(!clone){clone=m.clone();clone.map=this.textures[0];clone.normalMap=this.textures[1];clone.roughnessMap=this.textures[2];clone.normalScale.set(.2,.2);clone.roughness=1;clone.metalness=0;clone.needsUpdate=true;this.clones.set(m,clone);}return clone;});node.material=Array.isArray(node.material)?mapped:mapped[0];}}node.children.forEach(visit);};visit(root);
  }
 }
 dispose(){this.disposed=true;this.restore();this.textures.forEach(t=>t.dispose());this.textures=[];}
}
