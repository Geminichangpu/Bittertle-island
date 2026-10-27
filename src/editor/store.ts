import {settleBuildings} from '../terrain/placement';
import {create} from 'zustand';
import {createDemo,type Project} from '../data/model';
import {validateProject} from '../data/validation';
type State={project:Project;past:Project[];future:Project[];selected:string|null;revision:number;ready:boolean;storageBlocked:boolean;saveStatus:string;error:string;commit:(fn:(p:Project)=>void)=>boolean;replace:(p:Project)=>void;hydrate:(p:Project)=>void;undo:()=>void;redo:()=>void;select:(id:string|null)=>void};
export const useEditor=create<State>((set,get)=>({project:createDemo(),past:[],future:[],selected:null,revision:0,ready:false,storageBlocked:false,saveStatus:'正在读取本地工程…',error:'',
 commit(fn){try{const s=get();if(!s.ready)return false;const next=structuredClone(s.project);fn(next);if(next.terrain.heightmapRevision===1&&JSON.stringify([next.objects,next.groups])!==JSON.stringify([s.project.objects,s.project.groups]))settleBuildings(next,true);validateProject(next);if(JSON.stringify(next)===JSON.stringify(s.project))return false;set({project:next,past:[...s.past,s.project].slice(-40),future:[],revision:s.revision+1,saveStatus:'修改未保存',error:''});return true;}catch(e){set({error:String(e)});return false;}},
 replace(p){const validated=validateProject(p);set({storageBlocked:false});get().commit(draft=>{Object.keys(draft).forEach(k=>delete (draft as any)[k]);Object.assign(draft,validated);});set({selected:null});},
 hydrate(p){set({project:validateProject(p),past:[],future:[],selected:null,ready:true,storageBlocked:false,saveStatus:'已恢复本地工程',error:''});},
 undo(){const s=get();if(!s.ready||!s.past.length)return;set({project:s.past.at(-1)!,past:s.past.slice(0,-1),future:[s.project,...s.future].slice(0,40),revision:s.revision+1,saveStatus:'修改未保存',selected:null,error:''});},
 redo(){const s=get();if(!s.ready||!s.future.length)return;set({project:s.future[0],past:[...s.past,s.project].slice(-40),future:s.future.slice(1),revision:s.revision+1,saveStatus:'修改未保存',selected:null,error:''});},
 select(selected){set({selected});}
}));
