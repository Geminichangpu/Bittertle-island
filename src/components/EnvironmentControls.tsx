import {useEnvironment} from '../environment/time-state';
import {TIME_PRESETS,type TimeMode} from '../environment/time-presets';
import {useEffect,useRef,useState} from 'react';
import waterLicense from '../vendor/ultra-water/LICENSE?raw';
import waterNotices from '../vendor/ultra-water/THIRD_PARTY_NOTICES.md?raw';

export function EnvironmentControls(){const {mode,fps,setMode,setFps,waterEffect,setWaterEffect,waterReflection,setWaterReflection,labelsVisible,setLabelsVisible}=useEnvironment();const [legal,setLegal]=useState<'license'|'notices'|null>(null),dialog=useRef<HTMLDialogElement>(null);useEffect(()=>{if(legal&&dialog.current&&!dialog.current.open)dialog.current.showModal();},[legal]);return <div className="environment-controls" aria-label="环境氛围">
 <div className="time-buttons" role="group" aria-label="时间档位">{(Object.keys(TIME_PRESETS) as TimeMode[]).map(key=><button key={key} aria-pressed={key===mode} className={key===mode?'active':''} onClick={()=>setMode(key)}>{TIME_PRESETS[key].label}</button>)}</div>
 <select aria-label="帧率上限" value={fps} onChange={e=>setFps(Number(e.target.value) as 30|60)}><option value={60}>最高 60 FPS</option><option value={30}>最高 30 FPS</option></select>
 <label><input type="checkbox" checked={waterEffect} onChange={e=>setWaterEffect(e.target.checked)}/>水面效果</label>
 {waterEffect&&<label><input type="checkbox" checked={waterReflection} onChange={e=>setWaterReflection(e.target.checked)}/>近岸倒影</label>}
 <label><input type="checkbox" checked={labelsVisible} onChange={e=>setLabelsVisible(e.target.checked)}/>地点标签</label>
 <button type="button" onClick={()=>setLegal('license')}>海浪许可</button><button type="button" onClick={()=>setLegal('notices')}>第三方声明</button>
 <dialog ref={dialog} aria-labelledby="water-legal-title" onClose={()=>setLegal(null)} style={{width:'min(720px, 90vw)',maxHeight:'80vh',overflow:'auto',padding:'20px',borderRadius:'12px'}}>
  <h2 id="water-legal-title">{legal==='license'?'海浪许可':'第三方声明'}</h2>
  <pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',fontFamily:'inherit',textAlign:'left'}}>{legal==='license'?waterLicense:legal==='notices'?waterNotices:''}</pre>
  <button type="button" onClick={()=>dialog.current?.close()}>关闭</button>
 </dialog>
 </div>;}
