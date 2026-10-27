import {useEffect,useReducer} from 'react';
import type {OfficeInteriorRefinement} from '../models/OfficeInteriorRefinement';

export function OfficeModelControls({model}:{model:OfficeInteriorRefinement|undefined}){
 const [,refresh]=useReducer(n=>n+1,0);
 useEffect(()=>{if(!model)return;model.addEventListener('change',refresh);return()=>model.removeEventListener('change',refresh);},[model]);
 if(!model)return null;
 return <span className="bedroom-model-controls" role="group" aria-label="办公室模型版本">
  <button aria-pressed={!model.enabled} onClick={()=>model.setEnabled(false)}>原版室内</button>
  <button aria-pressed={model.enabled} onClick={()=>model.setEnabled(true)}>精修室内</button>
  {model.enabled&&model.status==='loading'&&<small role="status">精修模型加载中</small>}
  {model.enabled&&model.status==='error'&&<button onClick={()=>model.retry()}>加载失败 · 重试</button>}
 </span>;
}
