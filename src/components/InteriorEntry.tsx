import {useState} from 'react';
import type {Project} from '../data/model';
import {INTERIORS} from '../interiors/registry';
import {COMPOUNDS,compoundMembers,type VisitId} from '../exploration/registry';

/** Separate navigation controls never select or transform an exterior object. */
export function InteriorEntry({project,ready,onEnter}:{project:Project|null;ready:boolean;onEnter:(id:VisitId)=>void}){
 const [choice,setChoice]=useState<VisitId>('base_office');
 const available:{id:VisitId;name:string;entry:string}[]=[...COMPOUNDS.filter(c=>project&&compoundMembers(project,c.id).length>0).map(c=>({id:c.id,name:c.name+(c.id==='coast_group'?' · 漫游':' · 整体漫游'),entry:'漫游'+c.name})),...INTERIORS.filter(i=>project?.objects.some(o=>o.id===i.id))];
 const selected=available.find(i=>i.id===choice)||available[0];
 return <div className="interior-entry-section"><span>室内 / 岛屿漫游</span><select aria-label="选择漫游地点" value={selected?.id||''} disabled={!ready||!selected} onChange={e=>setChoice(e.target.value as VisitId)}>{!selected&&<option value="">没有可进入的建筑</option>}{available.map(i=><option key={i.id} value={i.id}>{i.name}</option>)}</select><button className="interior-entry" disabled={!ready||!selected} onClick={()=>selected&&onEnter(selected.id)}>{selected?.entry||'进入室内'}</button></div>;
}
