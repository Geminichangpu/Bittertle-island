import {useEnvironment} from '../environment/time-state';
import {TIME_PRESETS,type TimeMode} from '../environment/time-presets';

export function EnvironmentControls(){const {mode,fps,setMode,setFps}=useEnvironment();return <div className="environment-controls" aria-label="环境氛围">
 <div className="time-buttons" role="group" aria-label="时间档位">{(Object.keys(TIME_PRESETS) as TimeMode[]).map(key=><button key={key} aria-pressed={key===mode} className={key===mode?'active':''} onClick={()=>setMode(key)}>{TIME_PRESETS[key].label}</button>)}</div>
 <select aria-label="帧率上限" value={fps} onChange={e=>setFps(Number(e.target.value) as 30|60)}><option value={60}>最高 60 FPS</option><option value={30}>最高 30 FPS</option></select>
 </div>;}
