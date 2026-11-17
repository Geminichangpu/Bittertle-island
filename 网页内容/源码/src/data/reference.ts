import {addReferenceLandmarks} from './landmarks.ts';
import {arrangeShrineAndBase} from './base-layout.ts';
import {makeObject,type Project,type Point,type IslandObject} from './model.ts';

export const shrineTemplates:Record<string,string>={
 shrine_main:'神社 · 主殿',shrine_torii:'神社 · 鸟居',shrine_temizu:'神社 · 手水舍',
 shrine_office:'神社 · 授予所',shrine_residence:'神社 · 住居',shrine_court:'神社 · 参拜庭',shrine_garden:'神社 · 居住庭院',shrine_path:'神社 · 右侧小路'
};

/** These are open coastal arcs, ordered from the northern mouth to the southern mouth.
 * The land polygon joins outer + reverse(bay), leaving an actual western inlet. */
export function createReferenceDemo():Project {
 const outer:Point[]=[[-128,-66],[-111,-84],[-80,-99],[-46,-108],[-10,-110],[27,-105],[61,-96],[94,-81],[120,-57],[138,-26],[145,10],[139,43],[121,75],[95,94],[59,111],[22,119],[-15,117],[-51,108],[-83,92],[-108,73],[-121,49],[-130,25],[-124,7]];
 const bay:Point[]=[[-95,-57],[-76,-63],[-60,-58],[-47,-47],[-34,-49],[-22,-62],[9,-67],[40,-61],[66,-46],[83,-24],[89,1],[80,27],[57,48],[25,61],[-9,65],[-43,57],[-66,41],[-82,19],[-94,9]];
 const islet:Point[]=[[-13,-4],[-10,-12],[1,-16],[16,-14],[30,-8],[34,0],[24,9],[9,13],[-6,9],[-16,3]];
 const resolution=65,size=320,heights=Array.from({length:resolution**2},(_,i)=>{
  const x=(i%resolution)/(resolution-1)*size-size/2,z=Math.floor(i/resolution)/(resolution-1)*size-size/2;
  let h=4.2+30*Math.exp(-((x+35)**2/2200+(z+93)**2/280))+18*Math.exp(-((x-52)**2/1300+(z+86)**2/300))+39*Math.exp(-((x+110)**2/180+(z-28)**2/260))+6*Math.exp(-((x+12)**2/900+(z-94)**2/600));
  // Raised hillside clearing, slightly northeast of the previous coastal site.
  h+=12*Math.exp(-((x-92)**2/1050+(z-57)**2/950));
  const edge=Math.min(x-58,123-x,z-26,89-z),blend=Math.max(0,Math.min(1,edge/8));
  h=h*(1-blend)+14*blend;return h;
 });
 const objects:IslandObject[]=[];
 function add(templateId:string,id:string,x:number,z:number,w:number,d:number,h:number,angle=0){const o=makeObject(templateId);o.id=id;o.name=shrineTemplates[templateId];o.regionId='shrine_precinct';o.position=[x+12,0,z-10];o.rotation=[0,angle,0];o.params={width:w,depth:d,wallHeight:h,wallColor:'#d5c8ae',roofColor:'#50565a'};objects.push(o);}
 add('shrine_main','shrine_main',68,59,16,12,7);
 add('shrine_torii','shrine_torii',68,85,12,3,8);
 add('shrine_temizu','shrine_temizu',54,74,6.5,5.5,4.6,Math.PI/2);
 add('shrine_office','shrine_office',96,81,12,8,5.2,-Math.PI/2);
 add('shrine_residence','shrine_residence',93,57,15,9,5.3,-Math.PI/2);
 add('shrine_court','shrine_court',68,76,22,22,1);
 add('shrine_path','shrine_path',85,69,12,24,1);
 add('shrine_garden','shrine_garden',81,59,8,20,1);
 return addReferenceLandmarks(arrangeShrineAndBase({schemaVersion:1,projectId:crypto.randomUUID(),projectName:'比特尔特岛 · 反 C 岛形与神社',world:{seaLevel:0},terrain:{size,resolution,heights,outer,bay,islet,topology:'open-bay'},objects,
  markers:[{id:'marker_shrine',name:'神社',locationId:'shrine',regionId:'shrine_precinct',description:'位于岛屿东侧山坡，较上一版向右上方略移。鸟居通向主殿，左侧手水舍逆时针转向；右侧小路连接南侧授予所与北侧居住庭院。',visible:true,position:[80,15,66]}],
  regions:[{id:'shrine_precinct',name:'神社境内',color:'#bda97b',visible:false,points:[[57,34],[115,24],[120,79],[103,87],[60,81]]}],
  cameraPresets:[{id:'view_shrine_overview',name:'神社 · 建筑群',position:[128,74,127],target:[89,17,61],zoom:4.4,perspective:false},{id:'view_shrine_front',name:'神社 · 鸟居与主殿',position:[101,40,113],target:[78,21,55],zoom:6,perspective:false},{id:'view_shrine_garden',name:'神社 · 右侧庭院',position:[66,38,73],target:[99,18,44],zoom:7,perspective:false}],settings:{quality:'standard',labels:true}}));
}

/** Explicit, undoable upgrade. Keep user-created objects and old views; only remove known demo placeholders. */
export function applyReferenceLayout(old:Project):Project {
 const fresh=createReferenceDemo(),known=/^(house_[1-8]|tree_\d+|rock_\d+)$/;
 const reserved=new Set(fresh.objects.map(o=>o.id));
 fresh.projectId=old.projectId;fresh.projectName=old.projectName;
 fresh.objects.push(...old.objects.filter(o=>!known.test(o.id)&&!reserved.has(o.id)));
 fresh.markers.push(...old.markers.filter(m=>!fresh.markers.some(n=>n.id===m.id)&&!['marker_village','marker_islet'].includes(m.id)));
 fresh.regions.push(...old.regions.filter(r=>!['shrine_precinct','base_precinct'].includes(r.id)));
 fresh.cameraPresets.push(...old.cameraPresets.filter(v=>!fresh.cameraPresets.some(n=>n.id===v.id)));
 fresh.settings={...old.settings};return fresh;
}


