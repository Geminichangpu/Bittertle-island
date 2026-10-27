import * as T from 'three';
import type {IslandObject} from '../data/model';

// Stable association: no matching by translated label or changing array index.
export const OFFICE_ID='base_office';
export const INTERIORS=[
 {id:'landmark_liuli',name:'琉璃塔',entry:'进入琉璃塔大厅',exit:'琉璃塔门前'},
 {id:'base_office',name:'基地 · 办公室',entry:'进入基地办公室',exit:'办公室门前'},
 {id:'base_bedroom',name:'基地 · 卧室',entry:'进入基地卧室',exit:'卧室门前'},
 {id:'shrine_residence',name:'神社 · 住居',entry:'进入神社住居',exit:'住居门前'},
 {id:'landmark_feihua',name:'绯华楼',entry:'进入绯华楼',exit:'绯华楼门前'},
] as const;
export type InteriorId=typeof INTERIORS[number]['id'];
export function interiorEntrance(node:T.Object3D,o:IslandObject){
 const w=Number(o.params.width)||13,d=Number(o.params.depth)||9;
 const local=o.id==='base_bedroom'?new T.Vector3(-w*.14,.7,d*.04+1.3):o.id==='shrine_residence'?new T.Vector3(w*.12,1.1,d/2+2.9):o.id==='landmark_feihua'?new T.Vector3(0,2.2,d/2+4):new T.Vector3(0,.7,d/2+1.8);
 node.updateWorldMatrix(true,false);return node.localToWorld(local);
}
export function officeDimensions(o:IslandObject){return {width:Number(o.params.depth)||9,depth:Number(o.params.width)||12,height:Number(o.params.wallHeight)||5};}
/** Interior -X wall corresponds to exterior +Z sliding entrance (90° about Y). */
export function officeEntrance(node:T.Object3D,o:IslandObject){node.updateWorldMatrix(true,false);return node.localToWorld(new T.Vector3(0,.7,(Number(o.params.depth)||9)/2+1.8));}
