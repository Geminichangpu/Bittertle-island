import Dexie,{type Table} from 'dexie';
import type {Project} from '../data/model';
import {validateProject} from '../data/validation';
type Record={key:string;project:Project;updatedAt:number};
class IslandDB extends Dexie{projects!:Table<Record>;backups!:Table<Record>;constructor(){super('bitelt-island-editor');this.version(1).stores({projects:'key',backups:'key,updatedAt'});}}
const db=new IslandDB();
export async function loadProject(){
 const r=await db.projects.get('active');if(!r)return null;
 const migrate=r.project.objects.some(o=>o.id==='landmark_feihua')&&!r.project.groups?.some(g=>g.id==='feihua_group');
 const project=validateProject(r.project);
 if(migrate){
  await db.backups.put({key:'before-feihua-hillside-'+Date.now(),project:structuredClone(r.project),updatedAt:Date.now()});
  await db.projects.put({key:'active',project:structuredClone(project),updatedAt:Date.now()});
 }
 return project;
}
export async function saveProject(project:Project){validateProject(project);await db.projects.put({key:'active',project:structuredClone(project),updatedAt:Date.now()});}
export async function loadBackups(){return db.backups.orderBy('updatedAt').reverse().toArray();}
export async function recoverBackup(key:string){const backup=await db.backups.get(key);if(!backup)throw new Error('备份不存在');return validateProject(backup.project);}
