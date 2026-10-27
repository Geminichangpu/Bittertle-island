import {upgradeM3} from './m3-upgrade.ts';
import authoredLayout from '../../比特尔特岛-布局.json' with {type:'json'};
import {landmarkTemplates} from './landmarks.ts';
import {baseTemplates} from './base-layout.ts';
import {createReferenceDemo,shrineTemplates} from './reference.ts';
export type Vec3=[number,number,number];
export type Point=[number,number];
export type LayoutGroup={id:string;name:string;position:Vec3;rotation:Vec3;scale:Vec3};
export type IslandObject={id:string;parentId?:string;category:string;templateId:string;name:string;position:Vec3;rotation:Vec3;scale:Vec3;snapToGround:boolean;locked:boolean;regionId:string;locationId:string;params:{width:number;depth:number;wallHeight:number;roofColor:string;wallColor:string;bridgeEndHeight?:number}};
export type Marker={id:string;followId?:string;parentId?:string;name:string;locationId:string;regionId:string;description:string;visible:boolean;position:Vec3};
export type CameraPreset={id:string;name:string;position:Vec3;target:Vec3;zoom:number;perspective:boolean};
export type GroundPad={ownerId:string;minX:number;maxX:number;minZ:number;maxZ:number;level:number;feather:number};
export type LandscapeGrade={base:Point;hill:Point;baseRect:[number,number,number,number];baseLevel:number;hillLevel:number};
export type Terrain={village?:{revision:1;center:Point;level:number;halfSize:Point};scenicCoast?:{revision:1|2|3;center:Point;level:number;sakura:Point;sakuraLevel:number};feihua?:{revision:1;origin:Vec3;rotationY:number;scale:Vec3;width:number;depth:number};campus?:{revision:1;center:Point;radius:number;level:number};size:number;resolution:number;heights:number[];outer:Point[];bay:Point[];islet:Point[];topology?:'open-bay';heightmapRevision?:1;landscapeRevision?:1|2;grading?:LandscapeGrade;pads?:GroundPad[]};
export type Project={schemaVersion:1;expansionRevision?:1;settlementPlacementRevision?:1;environment?:{revision:1;seed:number};layoutRevision?:number;groups?:LayoutGroup[];projectId:string;projectName:string;world:{seaLevel:number};terrain:Terrain;objects:IslandObject[];markers:Marker[];regions:{id:string;name:string;color:string;visible:boolean;points:Point[]}[];cameraPresets:CameraPreset[];settings:{quality:'low'|'standard';labels:boolean}};
export function makeObject(templateId:string,index=0):IslandObject{return {id:crypto.randomUUID(),category:templateId==='tree'||templateId==='rock'?'nature':'building',templateId,name:({...shrineTemplates,...baseTemplates,...landmarkTemplates,house_gable:'双坡住宅',house_hip:'四坡住宅',shop:'海边商店',warehouse:'仓库',shrine:'神社',academy:'学院',pier:'码头',tree:'树木',rock:'岩石'} as Record<string,string>)[templateId]||'建筑',position:[95,0,index*14-40],rotation:[0,0,0],scale:[1,1,1],snapToGround:true,locked:false,regionId:'village',locationId:'',params:{width:10,depth:8,wallHeight:6,roofColor:'#cf795d',wallColor:'#f6edcf'}};}
const ring=(rx:number,rz:number,cx=0,cz=0,n=16):Point[]=>Array.from({length:n},(_,i)=>{let a=i/n*Math.PI*2;return [cx+Math.cos(a)*rx*(1+.035*Math.sin(3*a)),cz+Math.sin(a)*rz*(1+.04*Math.cos(5*a))];});
export function createLegacyDemo():Project {
  const resolution=65,size=320;
  const heights=Array.from({length:resolution**2},(_,i)=>{const x=(i%resolution)/(resolution-1)*size-size/2,z=Math.floor(i/resolution)/(resolution-1)*size-size/2;return 5+29*Math.exp(-((x+15)**2/3700+(z+88)**2/400))+26*Math.exp(-((x+112)**2/230+(z-12)**2/500));});
  const objects=Array.from({length:8},(_,i)=>{const o=makeObject(i%2?'house_hip':'house_gable',i);o.id=`house_${i+1}`;o.name=`沿岸住宅 ${String(i+1).padStart(2,'0')}`;o.position=[99+Math.sin(i)*5,0,-43+i*12];o.rotation[1]=-.3;return o;});
  for(let i=0;i<44;i++){const a=i*2.399963, r=106+Math.sin(i*8)*9; const o=makeObject('tree');o.id=`tree_${i}`;o.position=[Math.cos(a)*r,0,Math.sin(a)*r*.77];o.scale=[.8+(i%3)*.15,1+(i%4)*.13,.8];objects.push(o);}
  for(let i=0;i<5;i++){const o=makeObject('rock');o.id=`rock_${i}`;o.position=[-114+i*4,0,12+i*3];o.scale=[2,3+i*.4,2];objects.push(o);}
  return {schemaVersion:1,projectId:crypto.randomUUID(),projectName:'比特尔特岛 · 岛屿规划',world:{seaLevel:0},terrain:{size,resolution,heights,outer:ring(143,116),bay:ring(84,65,0,-4),islet:ring(23,16,9,0,12)},objects,markers:[{id:'marker_shrine',name:'神社预定地',locationId:'shrine',regionId:'west',description:'西侧岩峰旁的静谧地点，作为剧情构图参考。',visible:true,position:[-109,0,42]},{id:'marker_village',name:'沿岸住宅区',locationId:'village',regionId:'village',description:'沿内湾布置的住宅与步行空间。',visible:true,position:[105,0,25]},{id:'marker_islet',name:'湾中小岛',locationId:'islet',regionId:'bay',description:'与主岛分离，保留中央水域。',visible:true,position:[9,0,0]}],regions:[],cameraPresets:[],settings:{quality:'standard',labels:true}};
}
export function createDemo():Project{return upgradeM3(structuredClone(authoredLayout) as unknown as Project);}


