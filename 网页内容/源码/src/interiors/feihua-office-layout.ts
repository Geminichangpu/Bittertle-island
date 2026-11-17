import * as T from 'three';
import type {InteriorRoom} from './room-kit';

/** Apply before CollisionWorld is built. The Blender master uses the same offsets. */
export function openFeihuaDeskAccess(room:InteriorRoom){
 if(room.root.userData.feihuaDeskAccess)return;
 const desk=new T.Matrix4().makeTranslation(-5.5,0,.6)
  .multiply(new T.Matrix4().makeScale(.78,1,1))
  .multiply(new T.Matrix4().makeTranslation(5.5,0,0));
 const chair=new T.Matrix4().makeTranslation(0,0,-.25);
 const matrix=new T.Matrix4(),position=new T.Vector3();
 const furniture=room.root.children.find(n=>n instanceof T.Group&&n!==room.walls&&n!==room.lid&&n!==room.scenery);
 furniture?.traverse(node=>{
  if(!(node instanceof T.InstancedMesh))return;
  let changed=false;
  for(let i=0;i<node.count;i++){
   node.getMatrixAt(i,matrix);position.setFromMatrixPosition(matrix);
   const {x,y,z}=position;
   if(x>-10.1&&x<-.9&&z>-5.55&&z<-3.3&&y>7.3&&y<10.05){
    matrix.premultiply(desk);
   }else if(x>-6.2&&x<-4.8&&z>-6.7&&z<-5.55&&y>7.25&&y<9.6){
    matrix.premultiply(chair);
   }else continue;
   node.setMatrixAt(i,matrix);changed=true;
  }
  if(changed){node.instanceMatrix.needsUpdate=true;node.computeBoundingBox();node.computeBoundingSphere();}
 });
 room.root.userData.feihuaDeskAccess=true;
}
