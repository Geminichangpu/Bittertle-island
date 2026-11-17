import * as T from 'three';
/** Remove only furniture triangles in authored replacement volumes; architecture is untouched. */
export function applyAssetReplacement(root:T.Group,assets:T.Group){
 root.updateWorldMatrix(true,true);const inverse=root.matrixWorld.clone().invert();
 const cuts=assets.children.flatMap(n=>n.userData.assetCut?[new T.Box3(new T.Vector3(...n.userData.assetCut.slice(0,3)),new T.Vector3(...n.userData.assetCut.slice(3,6)))]:[]);
 const plantCuts=assets.children.flatMap(n=>n.userData.assetPlantCut&&n.userData.assetCut?[new T.Box3(new T.Vector3(...n.userData.assetCut.slice(0,3)),new T.Vector3(...n.userData.assetCut.slice(3,6)))]:[]);const furnitureCuts=assets.children.flatMap(n=>!n.userData.assetPlantCut&&!n.userData.assetFrameCut&&!n.userData.assetCutMaterial&&n.userData.assetCut?[new T.Box3(new T.Vector3(...n.userData.assetCut.slice(0,3)),new T.Vector3(...n.userData.assetCut.slice(3,6)))]:[]);const frameCuts=assets.children.flatMap(n=>n.userData.assetFrameCut&&n.userData.assetCut?[new T.Box3(new T.Vector3(...n.userData.assetCut.slice(0,3)),new T.Vector3(...n.userData.assetCut.slice(3,6)))]:[]);
 const selectiveCuts=assets.children.flatMap(n=>n.userData.assetCutMaterial&&n.userData.assetCut?[{material:String(n.userData.assetCutMaterial),box:new T.Box3(new T.Vector3(...n.userData.assetCut.slice(0,3)),new T.Vector3(...n.userData.assetCut.slice(3,6)))}]:[]);
 const prefixes=assets.children.flatMap(n=>(n.userData.assetPrefixes||[]) as string[]);
 let hidden=0,removed=0;const meshes:T.Mesh[]=[];
 root.traverse(n=>{if(n instanceof T.Mesh){let parent:T.Object3D|null=n;while(parent){if(parent.userData.islandAssetGroup)return;parent=parent.parent;}meshes.push(n);}});
 for(const mesh of meshes){
  if(prefixes.some(p=>mesh.name.startsWith(p))){mesh.visible=false;hidden++;continue;}
  const bedroomBatch=mesh.name.startsWith('03_保留陈设与地板');
  const feihuaPotBatch=mesh.name.startsWith('03_原有楼板楼梯栏杆门窗_FI_79958d_');
  const towerInteraction=['lobby','hecate','hebe','dolly','owner'].includes(assets.userData.assetKind)&&mesh.name.startsWith('互动_');
  if(!cuts.length||!(bedroomBatch||feihuaPotBatch||towerInteraction||/^(furniture_|1[0-3]_寝具|14_床头|24_软榻|25_阅读区)/.test(mesh.name)||/花|绿植|盆|plant|地毯/i.test(mesh.name))||mesh.userData.assetCutApplied)continue;
  const g=mesh.geometry,p=g.getAttribute('position'),index=g.index,transform=inverse.clone().multiply(mesh.matrixWorld),box=new T.Box3().setFromBufferAttribute(p as T.BufferAttribute).applyMatrix4(transform);
  if(!cuts.some(c=>c.intersectsBox(box)))continue;
  if(g.groups.length>1)continue;
  const next:number[]=[],v=new T.Vector3(),a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3();let count=0;
  // Tower foliage and white pots share spatial batches with flooring and nearby gifts.
  // Only plant materials participate in plant masks; preserve every ground tile triangle.
  const towerBatch=mesh.name.startsWith('furniture_区域_')||towerInteraction;
  const plantMaterial=towerBatch?/_(5f8057|6d9463|7b9b70|675e51|a44859|f3efdc)_|_eef0f2_marble_/.test(mesh.name):bedroomBatch?/_(4f4938|55735d|64837a|e4dfd2)_/.test(mesh.name):true;
  for(let i=0;i<(index?index.count:p.count);i+=3){const x=index?index.getX(i):i,y=index?index.getX(i+1):i+1,z=index?index.getX(i+2):i+2;a.fromBufferAttribute(p,x).applyMatrix4(transform);b.fromBufferAttribute(p,y).applyMatrix4(transform);c.fromBufferAttribute(p,z).applyMatrix4(transform);v.copy(a).add(b).add(c).multiplyScalar(1/3);const floorTriangle=(towerBatch||bedroomBatch)&&Math.max(a.y,b.y,c.y)<=.031;const framePart=bedroomBatch&&mesh.name.includes('_594733_')&&frameCuts.some(cut=>cut.containsPoint(a)&&cut.containsPoint(b)&&cut.containsPoint(c));const remove=!floorTriangle&&(framePart||furnitureCuts.some(cut=>cut.containsPoint(v))||selectiveCuts.some(cut=>mesh.name.includes('_'+cut.material+'_')&&cut.box.containsPoint(v))||(plantMaterial&&plantCuts.some(cut=>cut.containsPoint(a)&&cut.containsPoint(b)&&cut.containsPoint(c))));if(remove){count++;continue;}next.push(x,y,z);}
  if(count){const copy=g.clone();copy.clearGroups();copy.setIndex(next);copy.computeBoundingBox();copy.computeBoundingSphere();mesh.geometry=copy;mesh.userData.assetCutApplied=true;mesh.userData.assetReplacedGeometry=g;removed+=count;}
 }
 assets.userData.replacement={hidden,removed};
}
export function restoreAssetReplacement(root:T.Group){root.traverse(n=>{if(n instanceof T.Mesh&&n.userData.assetReplacedGeometry){n.geometry.dispose();n.geometry=n.userData.assetReplacedGeometry;delete n.userData.assetReplacedGeometry;delete n.userData.assetCutApplied;}});}
