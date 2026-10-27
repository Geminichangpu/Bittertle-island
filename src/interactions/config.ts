import type {Sound} from './audio';
export type V=[number,number,number];
export type InteractionSpec={id:string;label:string;at:V;size:V;effect:'sway'|'slide'|'turn'|'steam'|'ripple'|'light'|'fireflies';sound:Sound;message:string;delta?:V;night?:boolean;duration?:number};
const item=(id:string,label:string,at:V,size:V,effect:InteractionSpec['effect'],sound:Sound,message:string,extra:Partial<InteractionSpec>={}):InteractionSpec=>({id,label,at,size,effect,sound,message,...extra});

/** Authored in the existing room's local units; root scale/rotation is applied by the manager. */
export function interiorInteractions(id:string,floor:string):InteractionSpec[]{
 if(id==='base_office')return [
  item('paper','桌上手稿',[-.3,1.75,.15],[1.45,.08,.9],'sway','paper','手稿轻轻翻起，又落回桌面。'),
  item('book','书柜里的书',[-2.85,2.08,-5.25],[1.65,.7,.55],'slide','paper','书柜里的旧书轻轻滑出，又收回原位。',{delta:[0,0,.2]}),
  item('drawer','书桌抽屉',[.72,.88,-.7],[.8,.35,.18],'slide','wood','抽屉滑开一小段，里面整齐放着办公用品。',{delta:[0,0,-.18]}),
  item('flowers','桌上花束',[-1.45,2.3,.15],[.8,.65,.7],'sway','paper','花枝轻晃，桌上的水光也跟着闪了一下。'),
  item('lamp','办公室吊灯',[0,4.15,0],[.8,.7,.8],'light','switch','吊灯的开关轻响。'),
  item('tea','书柜上的茶具',[-1.35,1.79,-5.05],[.8,.4,.5],'steam','water','刚泡好的茶散出一缕热气。'),
 ];
 if(id==='base_bedroom')return [
  item('lamp','床旁吊灯',[2,4.2,-1],[.65,.8,.65],'light','switch','房间里的灯光变得柔和。'),
  item('plant','书桌绿植',[-5.43,2.2,-4],[.7,.7,.7],'sway','paper','叶片轻轻摆动，房间安静下来。'),
  item('books','床边书柜',[.7,1.25,.9],[.85,.7,.7],'slide','paper','随手翻开一本床边读物。',{delta:[.16,0,0]}),
  item('night','窗边的夜色',[3.38,2.85,5.28],[4.4,3.2,.3],'fireflies','sparkle','窗外掠过几点微光，像是小岛在向你道晚安。',{night:true,duration:2200}),
 ];
 if(id==='shrine_residence')return [
  item('chime','缘侧风铃',[-5.2,4.42,5.8],[.5,1.4,.5],'sway','bell','风铃清响，声音沿着木质外廊散开。'),
  item('tea','起居室茶壶',[-1,.93,0],[1.5,.55,.9],'steam','water','茶香随着细细的蒸汽升起。'),
  item('lamp','起居室灯笼',[-3,4.25,.8],[.6,.9,.6],'light','switch','纸灯笼亮起一团温暖的光。'),
  item('night','庭院石灯',[-5.9,.95,7.6],[1.3,1.5,1.3],'fireflies','bell','石灯旁亮起几只萤火虫，很快又隐入庭院。',{night:true,duration:2400}),
 ];
 if(id==='landmark_feihua')return [
  item('reception','前台手记',[9,1.65,3.5],[1,.2,1.2],'sway','paper','值班手记翻过一页，纸边轻响。'),
  item('tea','二楼茶具',[-7.8,8.24,1.5],[1.7,.65,1.1],'steam','water','茶壶冒起热气，窗外的风吹过长廊。'),
  item('lamp','二楼落地灯',[.4,8.1,3.7],[.8,1.2,.8],'light','switch','暖光映在榻榻米和木地板上。'),
  item('night','外廊夜灯',[6,12.4,6.5],[.8,1,.8],'fireflies','bell','夜灯下，微光顺着外廊飘过。',{night:true}),
 ];
 if(id==='landmark_liuli'){
  if(floor==='lobby')return [item('sculpture','中庭雕塑',[-2,3,1],[2.2,5,2.2],'turn','sparkle','银白的螺旋缓缓转动，洒下一串清亮的回音。'),item('tea','大厅茶桌',[-7.7,.9,7.15],[1.2,.45,.75],'steam','water','一杯热茶，让大厅多了些生活气息。')];
  if(floor==='owner')return [item('paper','岛主的笔记',[3.24,1.63,-3.65],[1.2,.23,.7],'sway','paper','桌上的工作笔记轻轻翻动，又回到原位。'),item('tea','会客茶壶',[-4.2,.95,3.1],[1.4,.55,.8],'steam','water','会客区的热茶已经备好。')];
  if(floor==='hecate')return [item('globe','旅行地球仪',[-7.73,5.62,.8],[1,.95,1],'turn','wood','地球仪转过半圈，下次又会去往哪里呢？'),item('collection','宝石收藏盘',[2.4,1.05,4.4],[2.8,.4,1.5],'fireflies','sparkle','收藏的小石头折出一闪而过的光。')];
  if(floor==='hebe')return [item('tea','窗边茶具',[1.15,.93,-2.75],[1,.5,.7],'steam','water','茶气轻轻掠过酒红色的软榻。'),item('vanity','梳妆台香水',[6.93,1.8,-1],[.7,.7,.8],'fireflies','sparkle','瓶身映出细碎光芒，留下淡淡花香的想象。')];
  return [item('toy','天使玩偶',[-7.65,5.7,-.05],[.8,1,.85],'sway','bell','小小的天使玩偶摇了摇，像是在打招呼。'),item('paper','多莉的便笺',[3,1.55,-5.9],[1.1,.15,.8],'sway','paper','便笺轻轻翻起，书桌上是一段安静的阅读时光。'),item('night','海景窗',[1.7,3.1,-6.96],[9.6,6,.2],'fireflies','sparkle','窗前掠过几点星光，海面仍旧安静。',{night:true})];
 }
 return [];
}

export function outdoorInteractions(template:string,w:number,d:number,h=6):InteractionSpec[]{
 if(template==='base_pond')return [item('water','鱼塘水面',[0,.22,0],[w*.82,.18,d*.8],'ripple','water','水面泛起一圈圈涟漪，随后慢慢平静。'),item('lilies','池边睡莲',[-w*.21,.3,-d*.17],[w*.25,.25,d*.25],'fireflies','sparkle','睡莲旁的微光短暂亮起。',{night:true})];
 if(template==='shrine_main')return [item('bell','神社铃绳',[0,(h+1.5)/2,d/2+1.8],[1.1,h-.5,1.1],'sway','bell','铃声在神社前缓缓散开。')];
 return [];
}
