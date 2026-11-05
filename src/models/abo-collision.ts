import * as T from 'three';
import type {CollisionWorld} from '../interiors/CollisionWorld';

export function removeReplacedNativeProps(proxy:T.Object3D,visible:T.Object3D){
 for(const name of ['town-original-dining','town-original-planters','town-park-bench-original','town-original-slide','villa-original-flowers'])if(visible.getObjectByName(name)?.visible===false)proxy.getObjectByName(name)?.removeFromParent();
}

/** One solid footprint per placed object, independent of its decorative submeshes. */
export function addAboCollisions(world:CollisionWorld,root:T.Object3D){
 root.updateWorldMatrix(true,true);let count=0;
 root.traverse(node=>{
  if(!node.userData.aboAsset||node.userData.assetSolid===false)return;
  const box=new T.Box3().setFromObject(node);
  if(!box.isEmpty()){world.add(box);count++;}
 });
 const beach=root.userData.aboBeachPlaces as {x:number;y:number;z:number}[]|undefined;
 for(const p of beach||[]){world.add(new T.Box3(new T.Vector3(p.x-.5,p.y,p.z-1.15),new T.Vector3(p.x+.5,p.y+.75,p.z+1.15)));count++;}
 return count;
}
