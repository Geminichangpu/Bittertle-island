import {InteractionHUD} from './InteractionHUD';
import {useEffect,useRef,useState} from 'react';
import type {SceneController} from '../scene/SceneController';
import {CompoundController} from '../exploration/CompoundController';
import {COMPOUNDS,type CompoundId} from '../exploration/registry';
import type {ExplorationState} from '../interiors/ExplorationController';
import type {Hotspot} from '../interiors/exploration-config';
import type {InteriorId} from '../interiors/registry';
import {InteriorPreview} from './InteriorPreview';
import {EnvironmentControls} from './EnvironmentControls';
import '../interiors/exploration.css';
import '../exploration/compound.css';

export function CompoundPreview({island,id,onClose}:{island:SceneController;id:CompoundId;onClose:()=>void}){
 const host=useRef<HTMLDivElement>(null),controller=useRef<CompoundController|null>(null);
 const [state,setState]=useState<ExplorationState>({active:false,locked:false,hint:'',target:'',message:''}),[error,setError]=useState('');
 const [places,setPlaces]=useState<{id:string;name:string}[]>([]),[room,setRoom]=useState<InteriorId|null>(null),[detail,setDetail]=useState<Hotspot|null>(null);
 useEffect(()=>{island.setActive(false);const element=host.current!;let c:CompoundController|undefined;
  const lost=(e:Event)=>setError((e as CustomEvent).detail);element.addEventListener('compound-error',lost);
  try{c=new CompoundController(element,island,id,setState,h=>{const inside=controller.current?.interiorFor(h.id);if(inside){controller.current?.setActive(false);setRoom(inside);}else setDetail(h);},onClose);controller.current=c;setPlaces(c.locations);if(import.meta.env.DEV)(window as any).__compound=c;}catch(e){setError(String(e));}
  return()=>{element.removeEventListener('compound-error',lost);c?.dispose();controller.current=null;if(import.meta.env.DEV)delete (window as any).__compound;island.setActive(true);};
 },[island,id]);
 function resume(){setRoom(null);island.setActive(false);controller.current?.setActive(true);}
 const name=COMPOUNDS.find(c=>c.id===id)!.name;
 return <><section className="interior-preview compound-preview" role="dialog" aria-modal="true" aria-label={name+(id==='coast_group'?'漫游':'整体漫游')} inert={!!room} style={{visibility:room?'hidden':'visible'}}>
  <div className="interior-canvas compound-canvas" ref={host}/>
  <div className="interior-heading"><span className="pill">{id==='coast_group'?'临海石径 · 第一人称漫游':'建筑群 · 第一人称漫游'}</span><h1>{name}</h1><p>WASD 移动 · Shift 加速 · E 查看 / 进入室内 · ESC 返回沙盘</p></div>
  <InteractionHUD host={host} manager={()=>controller.current?.interactions}/>
  <EnvironmentControls/><button className="interior-exit" onClick={onClose}>返回沙盘</button>
  <div className="walk-toolbar">{!state.locked&&<button className="primary" onClick={()=>void controller.current?.exploration.capturePointer()}>开始鼠标观察</button>}</div>
  <span className="walk-reticle" aria-hidden="true">+</span><div className="walk-hint" role="status">{state.hint||state.message||'拖动画面或点击「开始鼠标观察」，在建筑群之间自由行走'}</div>
  <div className="walk-touch" aria-label="建筑群漫游方向">{[['KeyW','前进'],['KeyA','左移'],['KeyS','后退'],['KeyD','右移']].map(([code,label])=><button key={code} aria-label={label} onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);controller.current?.exploration.touch(code,true);}} onPointerUp={()=>controller.current?.exploration.touch(code,false)} onPointerCancel={()=>controller.current?.exploration.touch(code,false)}>{label}</button>)}<button onClick={()=>{if(!controller.current?.interactions.interactFocused())controller.current?.exploration.interact();}}>查看 / 进入</button></div>
  <nav className="interior-actions" aria-label="建筑群漫游地点">{places.map(p=><button key={p.id} onClick={()=>controller.current?.moveTo(p.id)}>{p.name}</button>)}</nav>
  {detail&&<div className="walk-detail" role="dialog" aria-label="建筑说明"><h2>{detail.label}</h2><p>{detail.description}</p><button autoFocus onClick={()=>{setDetail(null);void controller.current?.exploration.capturePointer();}}>继续漫游</button></div>}
  {error&&<div className="error" role="alert">{error}</div>}
 </section>{room&&<InteriorPreview island={island} buildingId={room} onClose={resume} returnToCompound/>}</>;
}
