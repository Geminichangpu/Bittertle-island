import * as T from 'three';
import type {InteriorRoom,V} from './room-kit';
import type {TowerFloor} from './tower';
export type Hotspot={id:string;label:string;description:string;position:T.Vector3;action:'inspect'|'exit'|'elevator';radius:number};
export function explorationConfig(id:string,floor:TowerFloor,room:InteriorRoom){
 const scale=room.root.scale,unit=Number(room.root.userData.walkUnit)||Math.min(Math.abs(scale.x),Math.abs(scale.y),Math.abs(scale.z));
 const points:Hotspot[]=[];
 const add=(key:string,label:string,at:V,description:string,action:Hotspot['action']='inspect')=>points.push({id:key,label,description,position:new T.Vector3(...at).multiply(scale),action,radius:action==='inspect'?3.2*unit:3.8*unit});
 let spawn:V=[2.7,.02,3.8],target:V=[-.4,3,.2];
 if(id==='landmark_liuli'){
  const lobby=floor==='lobby',owner=floor==='owner';spawn=lobby?[0,.04,6]:owner?[-1,.04,4]:[4.7,.04,4.9];target=lobby?[4,3,-4]:owner?[2,3,-4]:[-3,3,-2];
  const at:V=lobby?[-9.9,2,-10.4]:owner?[8.9,2,-8.4]:[7.45,2,4.9];
  add('lift','电梯 · 选择楼层',at,'电梯连接大厅及四个房间。','elevator');
  if(lobby){add('exit','返回岛屿',[0,2,10.5],'返回琉璃塔入口。','exit');add('reception','大厅前台',[5.2,2.05,-2.1],'白色接待台、办公终端与蓝色灯带。');add('sculpture','中庭雕塑',[-2,2.5,2.2],'银白螺旋雕塑位于通高中庭的中央。');}
  else if(owner){add('desk','岛主办公桌',[2.2,1.7,-2.7],'海景办公区，右侧通道通往电梯。');add('meeting','窗边会议桌',[-6,1.6,-3.5],'会议区与前部会客区分开布置。');}
  else{add('bed','床与床头陈设',[-3,1.5,.5],floor==='hecate'?'旅行地图、相片和收藏围绕床头布置。':floor==='hebe'?'酒红寝具、描金框架与床尾软凳。':'蓝白格纹寝具、照片与天使玩偶。');add('desk',floor==='hebe'?'梳妆台':'写字台',floor==='dolly'?[3.2,1.6,-5.2]:[6.2,1.6,floor==='hebe'?-.1:-3.5],floor==='hebe'?'椭圆镜、香水与三盏球形吊灯。':floor==='hecate'?'旅行纪念品与宝石收藏架。':'窗下写字台、书架和阅读物品。');}
 }else if(id==='base_office'){
  add('exit','木门 · 返回岛屿',[0,2,5.6],'返回办公室门前。','exit');add('desk','办公室书桌',[-.4,1.9,1.1],'木质书桌、纸张、花瓶和抽屉。');add('shelf','文件书柜',[.1,2.6,-4.8],'文件夹、书籍、储物盒与书写用品。');
 }else if(id==='base_bedroom'){
  spawn=[2,.02,-2.8];target=[-4,3,-2.5];add('exit','卧室门 · 返回岛屿',[-1.82,2,.1],'返回卧室入口。','exit');add('desk','书桌与书架',[-4.5,1.8,-2.55],'书桌沿门旁墙面布置。');add('bed','卧室床铺',[4.8,1.5,2.65],'床头靠长边内侧墙，侧面为海景窗与书柜。');
 }else if(id==='shrine_residence'){
  spawn=[2,.25,3];target=[-1,3,-1];add('exit','缘侧 · 返回岛屿',[2,2,6.3],'从外廊返回神社住居门前。','exit');add('tea','起居茶桌',[-1,1,1.1],'榻榻米、坐垫和茶具。');add('chime','缘侧风铃',[-5.2,3.8,5.8],'玻璃风铃与庭院石灯。');
 }else if(id==='landmark_feihua'){
  spawn=[-10,.1,4];target=[0,3,2];add('exit','大厅入口 · 返回岛屿',[-12.6,2,4],'返回绯华楼门前。','exit');add('reception','绯华楼前台',[7.8,1.8,4.3],'前台位于右侧，后方为通往二楼的楼梯。');add('stairs','通往二楼',[7.3,2,1.5],'沿右侧楼梯登上二楼，经后方平台与侧边走道，沿外廊进入尽头的办公室。');add('office','二楼办公室',[-5.5,8.8,-3.2],'办公桌、屏风、茶桌及紫金色坐垫。');
 }
 return {spawn:new T.Vector3(...spawn).multiply(scale),target:new T.Vector3(...target).multiply(scale),radius:.38*unit,height:3.18*unit,eye:3.05*unit,step:.38*unit,speed:3.2*unit,points};
}



