import {addFarmCrops} from './farm-models';
import bowl from '../assets/abo-test/B075HWDSDK.glb?url';
import teaJar from '../assets/abo-test/B075HWTX4Z.glb?url';
import darkVase from '../assets/abo-test/B07QD6ZV9Q.glb?url';
import pairedVases from '../assets/abo-test/B07QHL8W81.glb?url';
import ladder from '../assets/abo-test/B07WDJRMPG.glb?url';
import seaVase from '../assets/abo-test/B078JGRLCJ.glb?url';
import * as T from 'three';
import foliageUrl from '../assets/cc0-test/potted_plant_02.glb?url';
import {islandAssetAdditions,type AssetPlacement} from './island-asset-layout';
import {loadAbortableGLB} from './loadAbortableGLB';
import birdhouse from '../assets/abo-test/B07HPMBN4B.glb?url';
import planter from '../assets/abo-test/B07ZVMQ9B9.glb?url';
import vase from '../assets/abo-test/B07B8NZQ68.glb?url';
import chair from '../assets/abo-test/B07B83KVGK.glb?url';
import ceramic from '../assets/abo-test/B075HWDSZ1.glb?url';
import redVase from '../assets/abo-test/B07B8VJBCL.glb?url';
import verandaChair from '../assets/abo-test/B0857K54FM.glb?url';
import whitePot from '../assets/abo-test/B083YFS2FR.glb?url';
import outdoorSofa from '../assets/abo-test/B07ZSZ4FYF.glb?url';
import sideTable from '../assets/abo-test/B07B7N6JH3.glb?url';
import milkCan from '../assets/abo-test/B078JG4N1N.glb?url';
import woodPlanter from '../assets/abo-test/B07ZVM6QMT.glb?url';
import parkBench from '../assets/abo-test/B0857JZJPR.glb?url';

type Placement=AssetPlacement;
const farm:Placement[]=[
 {url:planter,at:[12.8,.14,-12.2],height:1.7,angle:.2},
 {url:birdhouse,at:[-15,1.5,-9],height:1.8,angle:-.5},
 {url:milkCan,at:[-15.5,.12,-12],height:1.1},
 {url:woodPlanter,at:[13,.12,-2],height:1},
 {url:woodPlanter,at:[13,.12,2],height:1},
];
const warehouseOutside:Placement[]=[{url:ladder,at:[5.8,.25,-1.8],height:2.1,angle:Math.PI/2}];
const lobby:Placement[]=[{url:darkVase,at:[-8,0,-8],height:1.1},{url:vase,at:[8.2,2.03,-3.1],height:.65}];
const academy:Placement[]=[{url:ceramic,at:[-5.1,.2,9.3],height:1.1},{url:ceramic,at:[5.1,.2,9.3],height:1.1}];
const shopping:Placement[]=[{url:ceramic,at:[-2,.65,9],height:1.05},{url:ceramic,at:[2,.65,9],height:1.05}];
const market:Placement[]=[{url:ceramic,at:[-3,.45,7],height:.9},{url:ceramic,at:[3,.45,7],height:.9}];
const libraryOutside:Placement[]=[{url:whitePot,at:[-7,.4,9.8],height:1.3},{url:whitePot,at:[7,.4,9.8],height:1.3}];
const lighthouseOutside:Placement[]=[{url:ceramic,at:[-3,.65,4],height:.85},{url:ceramic,at:[3,.65,4],height:.85}];
const towerOutside:Placement[]=[{url:whitePot,at:[-4,.72,4.2],height:1},{url:whitePot,at:[4,.72,4.2],height:1}];
const baseOutside:Placement[]=[{url:ceramic,at:[-4.2,.74,5.2],height:.8},{url:ceramic,at:[4.2,.74,5.2],height:.8}];
const shrineOutside:Placement[]=[{url:verandaChair,at:[-5.1,1.2,5.4],height:1.7,angle:Math.PI}];
const treehouseOutside:Placement[]=[{url:verandaChair,at:[3.8,11.3,4],height:1.8,angle:Math.PI/2}];
const villaOutside:Placement[]=[{url:verandaChair,at:[-10.3,.15,3.5],height:1.8,angle:.45},{url:verandaChair,at:[-7,.15,3.5],height:1.8,angle:-.45},{url:outdoorSofa,at:[8,.15,3.55],height:1.6,angle:0}];
const townHouse:Placement[]=[{url:verandaChair,at:[2.1,.68,1.9],height:1.3,angle:Math.PI}];
const townStation:Placement[]=[{url:whitePot,at:[2.7,.24,1.45],height:.65}];
const townRestaurant:Placement[]=[{url:whitePot,at:[4.25,.2,1.1],height:.8}];
const townPark:Placement[]=[{url:parkBench,at:[0,0,-4.73],height:.5,fit:[3,.5,.8]}];
const office:Placement[]=[{url:chair,at:[.25,0,-1.7],height:2.15,angle:-.15},{url:ceramic,at:[-1.45,1.73,.15],height:.32,slot:'officeFlowers'},{url:ceramic,at:[2.45,3.4,-5.2],height:.32,slot:'officeShelf'}];
const bedroom:Placement[]=[{url:chair,at:[-4,0,-2.55],height:2.15,angle:-Math.PI/2}];
const residence:Placement[]=[{url:bowl,at:[-2.1,.72,.55],height:.16},{url:teaJar,at:[-2.15,.72,-.4],height:.32},{url:ceramic,at:[1.8,.04,-3.7],height:.38,slot:'residenceCorner'},{url:ceramic,at:[-6.35,2.13,-3.72],height:.2,slot:'residenceShelf'}];
const feihua:Placement[]=[{url:redVase,at:[-12.2,8.45,-5.5],height:.8}];
const hecate:Placement[]=[{url:seaVase,at:[5.8,0,5.4],height:.9}];
const hebe:Placement[]=[{url:vase,at:[5.8,0,-4.8],height:.85}];
const dolly:Placement[]=[];
const owner:Placement[]=[{url:pairedVases,at:[-9,0,5.5],height:.8},{url:vase,at:[-9,0,-6.5],height:1}];
const choices={pierOutside:[],caveOutside:[],forestOutside:[],warehouseOutside,farm,lobby,academy,shopping,market,libraryOutside,lighthouseOutside,towerOutside,baseOutside,shrineOutside,treehouseOutside,villaOutside,townHouse,townStation,townRestaurant,townPark,office,bedroom,residence,feihua,hecate,hebe,dolly,owner};
export type AboTrialKind=keyof typeof choices;

/** Small, separately owned trial: additions are loaded only with the target scene. */
export async function loadAboTrial(kind:AboTrialKind,signal:AbortSignal,authoredPlants:AssetPlacement[]=[]){
 const group=new T.Group();group.name='abo-local-trial';group.userData.islandAssetGroup=true;group.userData.assetKind=kind;
 const sources=new Map<string,T.Group>();
 const original=choices[kind].filter(p=>!authoredPlants.length||!['officeFlowers','officeShelf','residenceCorner','residenceShelf'].includes(p.slot||''));
 const placements=[...original,...(islandAssetAdditions[kind]||[]),...authoredPlants];group.userData.requestedCount=placements.length;group.userData.failedAssets=[];
 for(const placement of placements){
  if(placement.removeOnly){const mask=new T.Group();mask.name='removed-native-prop';mask.userData.assetCut=placement.cut;mask.userData.assetPlantCut=placement.plantCut;mask.userData.assetPrefixes=placement.prefixes;mask.userData.assetSolid=false;mask.userData.aboSlot=placement.slot||'removedPlant';mask.userData.assetCutMaterial=placement.cutMaterial;group.add(mask);continue;}
  try{
   if(!placement.url)throw new Error('未找到配置的模型资源');
   let source=sources.get(placement.url);if(!source){source=(await loadAbortableGLB(placement.url,signal)).scene;sources.set(placement.url,source);}
   const scene=source.clone(true);if(placement.foliageOnly){const remove:T.Object3D[]=[];scene.traverse(n=>{if(n instanceof T.Mesh&&!n.name.includes('leaves'))remove.push(n);});remove.forEach(n=>n.removeFromParent());}
   if(placement.url.includes('standing_picture_frame_01'))scene.traverse(n=>{if(!(n instanceof T.Mesh))return;const fix=(material:T.Material)=>{if(!(material instanceof T.MeshStandardMaterial)||material.name!=='standing_picture_frame_01_glass')return material;const glass=material.clone();glass.color.set('#ffffff');glass.map=null;glass.normalMap=null;glass.metalness=0;glass.roughness=.15;glass.transparent=true;glass.opacity=.12;glass.depthWrite=false;glass.needsUpdate=true;return glass;};n.material=Array.isArray(n.material)?n.material.map(fix):fix(n.material);});
   if(placement.tint||placement.materialTints)scene.traverse(n=>{if(n instanceof T.Mesh){const tint=(m:T.Material)=>{const copy=m.clone();if(copy instanceof T.MeshStandardMaterial){if(placement.materialTints?.[m.name]||placement.tint)copy.color.set(placement.materialTints?.[m.name]||placement.tint!);if(placement.materialTints?.[m.name]&&(/^(Wood1|Wood2|DarkWood)$/.test(m.name)||m.name.endsWith('_pot')))copy.map=null;copy.roughness=.9;}return copy;};n.material=Array.isArray(n.material)?n.material.map(tint):tint(n.material);}});
   if(placement.curtainGap){scene.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(scene),cx=(bounds.min.x+bounds.max.x)/2,half=(bounds.max.x-bounds.min.x)/2;scene.traverse(n=>{if(!(n instanceof T.Mesh))return;const ms=Array.isArray(n.material)?n.material:[n.material];if(!ms.some(m=>m.name==='Couch_Blue'))return;const g=n.geometry.clone(),p=g.getAttribute('position'),inverse=n.matrixWorld.clone().invert(),v=new T.Vector3();for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(n.matrixWorld);const d=v.x-cx;v.x=cx+Math.sign(d)*(half*.68+Math.abs(d)*.32);v.applyMatrix4(inverse);p.setXYZ(i,v.x,v.y,v.z);}g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();n.geometry=g;});}
   const box=new T.Box3().setFromObject(scene),size=box.getSize(new T.Vector3());
   if(!Number.isFinite(size.y)||size.y<=0){disposeAboTrial(scene);continue;}
   const scale=placement.fit?new T.Vector3(placement.fit[0]/size.x,placement.fit[1]/size.y,placement.fit[2]/size.z):new T.Vector3().setScalar(placement.height/size.y);scene.scale.copy(scale);
   const center=box.getCenter(new T.Vector3());
   scene.position.set(-center.x*scale.x,-box.min.y*scale.y,-center.z*scale.z);
   const anchor=new T.Group();anchor.userData.aboAsset=placement.url;anchor.userData.aboSlot=placement.slot;anchor.userData.assetSolid=placement.solid!==false;anchor.userData.supportAsset=placement.support;anchor.userData.assetCut=placement.cut;anchor.userData.assetPlantCut=placement.plantCut;anchor.userData.assetCutMaterial=placement.cutMaterial;anchor.userData.assetInteractive=placement.interactive;anchor.userData.assetFrameCut=placement.frameCut;anchor.userData.assetPrefixes=placement.prefixes;anchor.position.fromArray(placement.at);anchor.rotation.y=placement.angle||0;anchor.add(scene);
   if(placement.url===birdhouse){const post=new T.Mesh(new T.BoxGeometry(.14,1.5,.14),new T.MeshStandardMaterial({color:'#795638',roughness:.9}));post.position.y=-.75;post.castShadow=true;post.receiveShadow=true;post.userData.noCollision=true;anchor.add(post);}
   if((placement.url===ceramic&&!['residence','office'].includes(kind))||placement.url===whitePot||placement.url===woodPlanter||placement.url===planter){
    let foliage=sources.get(foliageUrl);if(!foliage){foliage=(await loadAbortableGLB(foliageUrl,signal)).scene;sources.set(foliageUrl,foliage);}
    const leaves=new T.Group();foliage.traverse(n=>{if(n instanceof T.Mesh&&n.name.includes('leaves'))leaves.add(n.clone(true));});
    const leafBox=new T.Box3().setFromObject(leaves),leafSize=leafBox.getSize(new T.Vector3()),leafCenter=leafBox.getCenter(new T.Vector3()),factor=placement.height*.82/Math.max(leafSize.x,leafSize.z);
    leaves.scale.setScalar(factor);leaves.position.set(-leafCenter.x*factor,placement.height*.86-leafBox.min.y*factor,-leafCenter.z*factor);leaves.traverse(n=>{if(n instanceof T.Mesh){n.castShadow=true;n.receiveShadow=true;n.userData.noCollision=true;}});anchor.add(leaves);
   }
   scene.traverse(n=>{if(n instanceof T.Mesh){n.castShadow=true;n.receiveShadow=true;n.userData.noCollision=!placement.interactive;}});
   group.add(anchor);
  }catch(error){if(signal.aborted){disposeAboTrial(group);throw error;}group.userData.failedAssets.push({url:placement.url,error:String(error)});console.warn('岛屿模型加载失败',error);}
 }
 group.updateMatrixWorld(true);for(const item of group.children){if(!item.userData.supportAsset)continue;const support=group.children.filter(n=>String(n.userData.aboAsset).includes(item.userData.supportAsset)).sort((a,b)=>a.position.distanceToSquared(item.position)-b.position.distanceToSquared(item.position))[0];if(support){const ray=new T.Raycaster(new T.Vector3(item.position.x,1000,item.position.z),new T.Vector3(0,-1,0));const hit=ray.intersectObject(support,true)[0];if(hit){item.position.y=hit.point.y+.008;item.userData.supportResolved=true;}}}
 if(kind==='farm'){try{await addFarmCrops(group,signal);group.userData.customFarmCrops=true;}catch(error){if(signal.aborted)throw error;console.warn('农田作物加载失败，保留原作物',error);}}
 group.userData.loadComplete=true;
 return group;
}
export function disposeAboTrial(root:T.Object3D){
 const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>(),textures=new Set<T.Texture>();
 root.traverse(n=>{if(n instanceof T.Mesh){if(n instanceof T.InstancedMesh)n.dispose();geometries.add(n.geometry);for(const m of Array.isArray(n.material)?n.material:[n.material])materials.add(m);}});
 for(const material of materials){for(const value of Object.values(material))if(value instanceof T.Texture)textures.add(value);material.dispose();}
 geometries.forEach(g=>g.dispose());textures.forEach(t=>t.dispose());root.removeFromParent();
}
