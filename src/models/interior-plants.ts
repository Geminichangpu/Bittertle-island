import * as T from 'three';
import type {AssetPlacement} from './island-asset-layout';
import plant from '../assets/cc0-test/potted_plant_02.glb?url';
import smallPlant from '../assets/cc0-test/houseplant_3.glb?url';

/** Read authored pot instances before the refinement swap, retaining exact shelf/desk positions. */
export function interiorPlantPlacements(root:T.Group,id:string,floor=''):AssetPlacement[]{
 root.updateWorldMatrix(true,true);const inverse=root.matrixWorld.clone().invert(),placements:AssetPlacement[]=[];
 const add=(x:number,y:number,z:number,potHeight:number,diameter:number)=>{
  const radius=diameter*1.45;
  const height=Math.min(potHeight*2.4,y<.1?1.8:y>3?.5:.65);
  const item:AssetPlacement={url:height<.6?smallPlant:plant,at:[x,y<.1?.035:y,z],height,slot:'authoredPlant',plantCut:true,cut:[x-radius,y-.004,z-radius,x+radius,y+potHeight*3.6,z+radius]};
  if(id==='landmark_liuli'){
   item.materialTints={potted_plant_02_pot:'#e8e4dc',Brown:'#e8e4dc',Black:'#d4d9d7'};
   if(floor==='owner'&&y<.1){item.at=x<0?[-9.8,.035,7.4]:[9.4,.035,7.4];}
   if(floor==='owner'&&Math.abs(x+4)<.1&&Math.abs(z-3.1)<.1){item.at=[-3.05,y,3.1];item.height=.5;}
   if(floor==='lobby'&&Math.abs(y-.76)<.1&&z>6){item.at=[x-.7,y,z-.15];item.height=.48;}
   if(floor==='lobby'&&y<.1&&Math.abs(z-4)<.1){item.at=[x,.035,2.8];item.height=1.65;}
   if(floor==='hebe'&&y<.1){item.at=[4.7,.035,-5.7];item.height=1.55;}
   if(floor==='hebe'&&Math.abs(x-1)<.1&&Math.abs(z+2.7)<.1){item.at=[.47,y,-2.65];item.height=.42;}
   // The front tea table carries a gift, so retain that arrangement without a second plant.
   if(floor==='hebe'&&Math.abs(x-3.4)<.1&&Math.abs(z-5.1)<.1)item.removeOnly=true;
   if(floor==='dolly'){
    if((y<.1&&z>0)||Math.abs(x+4.8)<.1)item.removeOnly=true;
    if(y<.1&&z<0){item.at=[-1.8,.035,-5.5];item.height=1.4;}
   }
  }
  if(id==='landmark_feihua'){
   if(y<2&&x>8&&x<10){item.prefixes=['13_接待台花瓶_'];item.height=.65;item.at=[9,1.6,5.85];}
   else if(y<1){item.prefixes=['14_大厅角落花器_'];item.height=1.35;}
   else if(x>0){const i=z<0?0:z<1?1:2;item.prefixes=[`32_外廊插花_${i}_`];item.height=1.15;item.at=[2.3,7.05,z];}
   else item.prefixes=['49_盆景陶钵与曲干'];
  }
  if(id==='landmark_feihua')item.url=plant;
  placements.push(item);
 };
 if(id==='base_office'){add(-1.45,1.73,.15,.32,.36);add(2.45,3.4,-5.2,.32,.36);placements[0].prefixes=['42_桌上粉色花束_'];placements[1].prefixes=['48_书柜绿植_'];return placements;}
 const matrix=new T.Matrix4();root.traverse(n=>{
  if(!(n instanceof T.Mesh)||!/(ceramic-pot|ceramic-planter)$/.test(String(n.geometry.userData.sourceKey)))return;
  n.geometry.computeBoundingBox();const record=(m:T.Matrix4)=>{const b=n.geometry.boundingBox!.clone().applyMatrix4(inverse.clone().multiply(n.matrixWorld).multiply(m)),size=b.getSize(new T.Vector3());add((b.min.x+b.max.x)/2,b.min.y,(b.min.z+b.max.z)/2,size.y,Math.max(size.x,size.z));};
  if(n instanceof T.InstancedMesh)for(let i=0;i<n.count;i++){n.getMatrixAt(i,matrix);record(matrix);}else record(new T.Matrix4());
 });if(id==='shrine_residence'&&placements.length)placements[0].prefixes=['43_柜顶小花盆_','44_墙角绿植_'];return placements;
}
