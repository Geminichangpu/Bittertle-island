/** A compositor-animated sky streak. The island's WebGL scene can stay idle throughout. */
export const METEOR_INTERVAL_MS=15_000;
export const METEOR_FLIGHT_MS=1_450;

export class NightMeteors {
 readonly layer=document.createElement('div');
 readonly streak=document.createElement('div');
 startedCount=0;
 lastStartedAt=0;
 private night=false;
 private overview=false;
 private visible=!document.hidden;
 private disposed=false;
 private timer:ReturnType<typeof setTimeout>|undefined;
 private animation:Animation|undefined;
 constructor(private host:HTMLElement){
  this.layer.className='night-meteors';this.layer.setAttribute('aria-hidden','true');
  this.streak.className='night-meteor';this.streak.dataset.active='false';
  this.layer.append(this.streak);host.append(this.layer);
 }
 setNight(night:boolean){if(night===this.night)return;this.night=night;this.restart();}
 setOverview(overview:boolean){if(overview===this.overview)return;this.overview=overview;this.restart();}
 setVisible(visible:boolean){if(visible===this.visible)return;this.visible=visible;this.restart();}
 private stop(){
  clearTimeout(this.timer);this.timer=undefined;
  this.animation?.cancel();this.animation=undefined;this.streak.dataset.active='false';
 }
 private restart(){this.stop();if(this.night&&this.overview&&this.visible&&!this.disposed)this.schedule();}
 private schedule(){this.timer=setTimeout(()=>{this.timer=undefined;if(this.disposed||!this.night||!this.overview||!this.visible)return;this.fly();this.schedule();},METEOR_INTERVAL_MS);}
 private fly(){
  const w=this.host.clientWidth,h=this.host.clientHeight;if(!w||!h)return;
  const length=Math.min(170,Math.max(70,w*.13));
  // Head travels from upper right to lower left; the rotated tail follows behind it.
  const x=w*(.70+Math.random()*.20),y=h*(.08+Math.random()*.09);
  const dx=-w*(.37+Math.random()*.12),dy=h*(.17+Math.random()*.07);
  const angle=Math.atan2(dy,dx);
  const transform=(t:number)=>`translate3d(${x+dx*t-length}px,${y+dy*t}px,0) rotate(${angle}rad)`;
  this.streak.style.width=`${length}px`;this.streak.dataset.active='true';
  this.startedCount++;this.lastStartedAt=performance.now();
  const animation=this.streak.animate([
   {transform:transform(0),opacity:0,offset:0},
   {transform:transform(.12),opacity:1,offset:.12},
   {transform:transform(.72),opacity:.9,offset:.72},
   {transform:transform(1),opacity:0,offset:1},
  ],{duration:METEOR_FLIGHT_MS,easing:'linear'});
  this.animation=animation;
  animation.onfinish=()=>{if(this.animation===animation){this.animation=undefined;this.streak.dataset.active='false';}};
 }
 dispose(){this.disposed=true;this.stop();this.layer.remove();}
}
