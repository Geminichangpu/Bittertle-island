import {InteractionHUD} from './InteractionHUD';
import '../interiors/tower.css';
import '../interiors/exploration.css';
import {TOWER_FLOORS,type TowerFloor} from '../interiors/tower';
import {useEffect,useRef,useState} from 'react';
import type {SceneController} from '../scene/SceneController';
import {InteriorController} from '../interiors/InteriorController';
import {INTERIORS,interiorEntrance,type InteriorId} from '../interiors/registry';
import type {RoomView} from '../interiors/room-kit';
import type {ExplorationState} from '../interiors/ExplorationController';
import type {Hotspot} from '../interiors/exploration-config';
import {EnvironmentControls} from './EnvironmentControls';

const idle:ExplorationState={active:false,locked:false,hint:'',target:'',message:''};
export function InteriorPreview({island,buildingId,onClose,returnToCompound=false}:{island:SceneController;buildingId:InteriorId;onClose:()=>void;returnToCompound?:boolean}){
 const host=useRef<HTMLDivElement>(null),controller=useRef<InteriorController|null>(null);
 const [error,setError]=useState(''),[modelReady,setModelReady]=useState(false),[views,setViews]=useState<RoomView[]>([]),[view,setView]=useState('reference'),[attempt,setAttempt]=useState(0);
 const [floor,setFloor]=useState<TowerFloor>('lobby'),[liftOpen,setLiftOpen]=useState(false);
 const [walk,setWalk]=useState<ExplorationState>(idle),[detail,setDetail]=useState<Hotspot|null>(null);
 const isTower=buildingId==='landmark_liuli',floorLabel=TOWER_FLOORS.find(f=>f.id===floor)!.label;
 const definition=INTERIORS.find(i=>i.id===buildingId)!;
 function leave(){const object=island.project.objects.find(o=>o.id===buildingId),node=island.node(buildingId);if(!returnToCompound&&object&&node)island.focus(interiorEntrance(node,object).toArray());onClose();}
 useEffect(()=>{
  island.setActive(false);const object=island.project.objects.find(o=>o.id===buildingId);let s:InteriorController|undefined;
  const element=host.current!,onError=(e:Event)=>setError((e as CustomEvent).detail),onModelReady=()=>setModelReady(true);setModelReady(false);
  const onWalk=(e:Event)=>setWalk((e as CustomEvent<ExplorationState>).detail);
  const onAction=(e:Event)=>{const point=(e as CustomEvent<Hotspot>).detail;if(point.action==='exit')leave();else if(point.action==='elevator')setLiftOpen(true);else setDetail(point);};
  element.addEventListener('interior-error',onError);element.addEventListener('interior-model-ready',onModelReady);element.addEventListener('exploration-state',onWalk);element.addEventListener('exploration-action',onAction);
  setWalk(idle);setDetail(null);
  try{if(!object)throw new Error('当前布局没有这栋建筑');s=new InteriorController(element,object,island.project.settings.quality,floor);setView('reference');setError('');controller.current=s;setViews(s.views);if(import.meta.env.DEV)(window as any).__interior=s;}catch(e){setError(String(e));}
  return()=>{element.removeEventListener('interior-error',onError);element.removeEventListener('interior-model-ready',onModelReady);element.removeEventListener('exploration-state',onWalk);element.removeEventListener('exploration-action',onAction);s?.dispose();controller.current=null;if(import.meta.env.DEV)delete (window as any).__interior;if(!returnToCompound)island.setActive(true);};
 },[island,buildingId,floor,attempt]);
 return <section className="interior-preview" role="dialog" aria-modal="true" aria-label={definition.name+'室内'}>
  <div ref={host} className="interior-canvas" data-building-id={buildingId}/>
  <div className="interior-heading"><span className="pill">M8–M9 / ISLAND LIFE</span><h1>{definition.name}{isTower&&' · '+floorLabel}</h1><p>{walk.active?'WASD 移动 · 鼠标观察 · Shift 加速 · E 查看 · ESC 退出':'拖动观察 · 滚轮缩放 · '+(views.find(v=>v.id===view)?.label||'独立室内预览')}</p></div>
  <InteractionHUD host={host} manager={()=>controller.current?.interactions}/>
  <EnvironmentControls/><button className="interior-exit" onClick={leave}>{returnToCompound?'返回建筑群漫游':'返回岛屿'} · {definition.exit}</button>
  {isTower&&<div className="tower-elevator"><button aria-expanded={liftOpen} onClick={()=>{controller.current?.view('elevator');setView('elevator');setLiftOpen(!liftOpen);}}>电梯 · 选择楼层</button>{liftOpen&&<div className="tower-floor-list" role="group" aria-label="电梯楼层"><strong>请选择目的地</strong>{TOWER_FLOORS.map(f=><button autoFocus={f.id===floor} key={f.id} aria-pressed={floor===f.id} onClick={()=>{setFloor(f.id);setLiftOpen(false);}}>{f.label}{floor===f.id?' · 当前':''}</button>)}</div>}</div>}
  <div className="walk-toolbar"><button className="primary" disabled={!modelReady} onClick={()=>{if(walk.active)controller.current?.stopExploration();else controller.current?.startExploration();}}>{walk.active?'返回观察':'开始漫游'}</button>{walk.active&&!walk.locked&&<button onClick={()=>void controller.current?.exploration.capturePointer()}>继续鼠标观察</button>}</div>
  {walk.active&&<><span className="walk-reticle" aria-hidden="true">+</span><div className="walk-hint" role="status">{walk.hint||walk.message||'WASD 移动 · E 查看附近物件'}</div><div className="walk-touch" aria-label="漫游方向">{[['KeyW','前进'],['KeyA','左移'],['KeyS','后退'],['KeyD','右移']].map(([code,label])=><button key={code} aria-label={label} onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);controller.current?.exploration.touch(code,true);}} onPointerUp={()=>controller.current?.exploration.touch(code,false)} onPointerCancel={()=>controller.current?.exploration.touch(code,false)}>{label}</button>)}<button onClick={()=>{if(!controller.current?.interactions.interactFocused())controller.current?.exploration.interact();}}>查看 / 使用</button></div></>}
  {detail&&<div className="walk-detail" role="dialog" aria-label="物件说明"><h2>{detail.label}</h2><p>{detail.description}</p><button autoFocus onClick={()=>{setDetail(null);void controller.current?.exploration.capturePointer();}}>继续探索</button></div>}
  <div className="interior-actions">{views.map(v=><button key={v.id} aria-pressed={view===v.id} onClick={()=>{controller.current?.view(v.id);setView(v.id);}}>{v.label}</button>)}<button onClick={()=>{const url=controller.current?.capture();if(url){const a=document.createElement('a');a.href=url;a.download=definition.name+'-'+(isTower?floorLabel+'-':'')+(views.find(v=>v.id===view)?.label||'室内')+'.png';a.click();}}}>室内截图</button></div>
  {!modelReady&&!error&&<div className="loading" role="status">正在加载精修室内…</div>}
  {error&&<div className="error" role="alert">{error}<button onClick={()=>setAttempt(n=>n+1)}>重试室内模型</button></div>}
 </section>;
}

