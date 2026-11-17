import {useEffect,useState,type RefObject} from 'react';
import type {InteractionManager,InteractionStatus} from '../interactions/InteractionManager';
import '../interactions/interactions.css';
export function InteractionHUD({host,manager}:{host:RefObject<HTMLDivElement|null>;manager:()=>InteractionManager|undefined}){
 const [status,setStatus]=useState<InteractionStatus>({hint:'',message:'',muted:false,lights:false});
 useEffect(()=>{const element=host.current;if(!element)return;const handle=(e:Event)=>setStatus((e as CustomEvent<InteractionStatus>).detail);element.addEventListener('island-interaction',handle);return()=>element.removeEventListener('island-interaction',handle);},[host]);
 return <aside className="interaction-hud" aria-label="环境互动">
  <div className="interaction-tools"><button aria-pressed={!status.muted} onClick={()=>manager()?.setMuted(!status.muted)}>{status.muted?'音效：关':'音效：开'}</button>{status.lights&&<button onClick={()=>manager()?.resetLights()}>灯具随昼夜</button>}</div>
  <p className="interaction-tip" role="status">{status.hint||'点击物件 · 靠近后可按 E'}<span className="interaction-response">{status.message||'听听小岛里的声音。'}</span></p>
 </aside>;
}
