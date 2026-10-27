import type {IslandObject} from '../data/model';

// These objects have authored GLBs; all other procedural meshes remain in use
// for terrain placement, collision and objects without a refined replacement.
const ids = new Set([
 'layout_lighthouse','layout_treehouse','landmark_feihua','feihua_annex','feihua_onsen','feihua_terrace','feihua_bridge',
 'shrine_main','shrine_torii','shrine_temizu','shrine_office','shrine_residence','shrine_court','shrine_path','shrine_garden',
 'base_office','base_bedroom','base_pond','base_warehouse','landmark_liuli','landmark_library','layout_shopping','layout_market',
 'scenic_sakura','scenic_cliff','scenic_academy','scenic_farm'
]);
export function hasRefinedModel(object:IslandObject){return ids.has(object.id)&&object.id===object.templateId;}
