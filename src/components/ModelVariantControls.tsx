import {useEffect,useReducer} from 'react';
import type {SceneController} from '../scene/SceneController';

export function ModelVariantControls({scene}:{scene:SceneController|null}){
 if(!scene)return null;
 return <details className="model-variant-menu"><summary>模型外观</summary><div className="model-variant-options"><Variant model={scene.refinement} title="灯塔外观"/><Variant model={scene.feihuaRefinement} title="绯华楼外观"/><Variant model={scene.treehouseRefinement} title="树屋外观"/><Variant model={scene.exteriorSetRefinement} title="市集、地标与建筑群外观"/><Variant model={scene.scenicRefinement} title="自然景观细节"/></div></details>;
}
function Variant({model,title}:{model:SceneController['refinement']|SceneController['feihuaRefinement']|SceneController['treehouseRefinement']|SceneController['exteriorSetRefinement']|SceneController['scenicRefinement'];title:string}){
 const [,refresh]=useReducer(n=>n+1,0);
 useEffect(()=>{if(!model)return;model.addEventListener('change',refresh);return()=>model.removeEventListener('change',refresh);},[model]);
 if(!model)return null;
 return <div className="model-variant-controls"><div className="section-label">{title}</div><div role="group" aria-label={title+'版本'}>
  <button aria-pressed={!model.enabled} onClick={()=>model.setEnabled(false)}>原版模型</button>
  <button aria-pressed={model.enabled} disabled={!model.compatible} onClick={()=>model.setEnabled(true)}>精修模型</button>
 </div><small role="status">{!model.compatible?'当前参数使用原版':!model.enabled?'已显示原版':model.status==='loading'?'正在加载，暂时显示原版':model.status==='error'?'加载失败，已保留原版':model.active?'已显示精修版':'已显示原版'}</small>
 {model.enabled&&model.status==='error'&&<button onClick={()=>model.retry()}>重试精修模型</button>}</div>;
}
