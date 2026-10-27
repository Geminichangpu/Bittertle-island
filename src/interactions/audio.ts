export type Sound='paper'|'wood'|'bell'|'water'|'switch'|'sparkle';
let mutedPreference=false;try{mutedPreference=localStorage.getItem('island-sound-muted')==='true';}catch{/* Optional preference. */}
const clients=new Set<InteractionAudio>();
/** One short synthesized sound per gesture; no downloaded audio, timers or music loops. */
export class InteractionAudio {
 private context:AudioContext|null=null;
 private generation=0;private disposed=false;
 private voices=new Set<OscillatorNode|AudioBufferSourceNode>();
 get muted(){return mutedPreference;}
 volume=.22;played=0;lastError='';
 constructor(){clients.add(this);}
 setMuted(value:boolean){mutedPreference=value;if(value)clients.forEach(c=>c.stop());try{localStorage.setItem('island-sound-muted',String(value));}catch{/* Optional preference. */}}
 async play(kind:Sound){
  if(this.muted||this.disposed)return;this.lastError='';const generation=this.generation;
  try{
   const ctx=this.context??=new AudioContext();await ctx.resume();if(this.disposed||generation!==this.generation||this.muted||ctx.state!=='running')return;
   const start=ctx.currentTime,master=ctx.createGain();master.gain.value=this.volume;master.connect(ctx.destination);
   const voices:typeof this.voices=new Set();
   const track=(source:OscillatorNode|AudioBufferSourceNode)=>{this.voices.add(source);voices.add(source);source.onended=()=>{source.disconnect();this.voices.delete(source);voices.delete(source);if(!voices.size)master.disconnect();};};
   const tone=(frequency:number,delay:number,length:number,gain:number,type:OscillatorType='sine')=>{
    const node=ctx.createOscillator(),amp=ctx.createGain(),at=start+delay;node.type=type;node.frequency.setValueAtTime(frequency,at);node.frequency.exponentialRampToValueAtTime(frequency*.85,at+length);
    amp.gain.setValueAtTime(.0001,at);amp.gain.exponentialRampToValueAtTime(gain,at+.008);amp.gain.exponentialRampToValueAtTime(.0001,at+length);node.connect(amp);amp.connect(master);track(node);node.start(at);node.stop(at+length+.02);node.addEventListener('ended',()=>amp.disconnect());
   };
   if(kind==='bell'||kind==='sparkle')for(let i=0;i<4;i++)tone((kind==='bell'?880:1046)*[1,1.5,2.01,2.5][i],i*.065,.75-i*.08,.22/(i+1));
   else if(kind==='water')for(let i=0;i<5;i++)tone(450+i*130,i*.065,.17,.12);
   else if(kind==='switch')tone(190,0,.07,.3,'triangle');
   else{
    const length=kind==='paper'?.35:.19,buffer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*length),ctx.sampleRate),data=buffer.getChannelData(0);let seed=17;
    for(let i=0;i<data.length;i++){seed=(seed*1664525+1013904223)>>>0;data[i]=(seed/4294967296*2-1)*Math.sin(Math.PI*i/data.length)*.25;}
    const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter();filter.type='bandpass';filter.frequency.value=kind==='paper'?1800:420;source.buffer=buffer;source.connect(filter);filter.connect(master);track(source);source.start(start);source.addEventListener('ended',()=>filter.disconnect());
    if(kind==='wood')tone(145,0,.16,.16,'triangle');
   }this.played++;
  }catch(e){this.lastError=String(e);}
 }
 stop(){this.generation++;for(const voice of this.voices){try{voice.stop();}catch{/* Already ended. */}}this.voices.clear();}
 suspend(){this.stop();void this.context?.suspend();}
 dispose(){this.disposed=true;clients.delete(this);this.stop();void this.context?.close();this.context=null;}
 get activeVoices(){return this.voices.size;}
}
