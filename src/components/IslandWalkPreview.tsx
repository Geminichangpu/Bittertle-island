import {useEffect,useRef,useState} from 'react';
import type {SceneController} from '../scene/SceneController';
import {IslandWalkController} from '../exploration/IslandWalkController';
import type {ExplorationState} from '../interiors/ExplorationController';
import '../interiors/exploration.css';
import '../exploration/compound.css';
import '../exploration/island-walk.css';

export function IslandWalkPreview({island,onClose}:{island:SceneController;onClose:()=>void}){
 const host=useRef<HTMLDivElement>(null),controller=useRef<IslandWalkController|null>(null);
 const [state,setState]=useState<ExplorationState>({active:false,locked:false,hint:'',target:'',message:''}),[error,setError]=useState('');
 useEffect(()=>{island.setActive(false);const element=host.current!;let c:IslandWalkController|undefined;const lost=(e:Event)=>setError((e as CustomEvent).detail);element.addEventListener('island-walk-error',lost);
  let cancelled=false;void island.prepareAboWalk().then(()=>{if(cancelled)return;try{c=new IslandWalkController(element,island,setState,onClose);controller.current=c;if(import.meta.env.DEV)(window as any).__islandWalk=c;}catch(e){setError(String(e));}}).catch(e=>{if(!cancelled)setError(String(e));});
  return()=>{cancelled=true;element.removeEventListener('island-walk-error',lost);c?.dispose();controller.current=null;if(import.meta.env.DEV)delete (window as any).__islandWalk;island.setActive(true);};
 },[island]);
 return <section className="interior-preview compound-preview island-walk" role="dialog" aria-modal="true" aria-label="全岛第一人称漫游">
  <div className="interior-canvas compound-canvas" ref={host}/>
  <div className="interior-heading"><span className="pill">全岛 · 第一人称</span><h1>漫游小岛</h1><p>WASD 移动 · 鼠标观察 · Shift 加速 · Esc 释放鼠标 / 退出</p></div>
  <button className="interior-exit" onClick={onClose}>退出漫游，返回沙盘</button>
  <div className="walk-toolbar">{!state.locked&&<button className="primary" onClick={()=>void controller.current?.exploration.capturePointer()}>点击开始鼠标观察</button>}</div>
  <span className="walk-reticle" aria-hidden="true">+</span><div className="walk-hint" role="status">{state.message||'点击开始鼠标观察，或按住画面拖动；WASD 移动。'}</div>
  <div className="walk-touch" aria-label="漫游方向">{[['KeyW','前进'],['KeyA','左移'],['KeyS','后退'],['KeyD','右移']].map(([code,label])=><button key={code} aria-label={label} onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);controller.current?.exploration.touch(code,true);}} onPointerUp={()=>controller.current?.exploration.touch(code,false)} onPointerCancel={()=>controller.current?.exploration.touch(code,false)}>{label}</button>)}</div>
  {error&&<div className="error" role="alert">{error}</div>}
 </section>;
}
