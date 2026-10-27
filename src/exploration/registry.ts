import type {Project} from '../data/model';
import type {InteriorId} from '../interiors/registry';
export const COMPOUNDS=[{id:'shrine_group',name:'神社建筑群',prefix:'shrine_'},{id:'base_group',name:'生活基地建筑群',prefix:'base_'},{id:'feihua_group',name:'绯华楼建筑群',prefix:'feihua_'},{id:'coast_group',name:'海边山崖',prefix:'scenic_'}] as const;
export type CompoundId=typeof COMPOUNDS[number]['id'];
export type VisitId=InteriorId|CompoundId;
export function compoundMembers(project:Project,id:CompoundId){const definition=COMPOUNDS.find(c=>c.id===id)!;if(id==='coast_group')return project.objects.filter(o=>o.id==='scenic_cliff');return project.objects.filter(o=>o.parentId===id||(!o.parentId&&((o.templateId.startsWith(definition.prefix)&&o.id!=='scenic_sakura')||(id==='feihua_group'&&o.id==='landmark_feihua'))));}
