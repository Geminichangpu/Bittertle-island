import {create} from 'zustand';
import type {TimeMode} from './time-presets';

/** Session-wide preview state, separate from authored layout and future manual lamp overrides. */
export const useEnvironment=create<{mode:TimeMode;fps:30|60;waterEffect:boolean;waterReflection:boolean;labelsVisible:boolean;setMode:(mode:TimeMode)=>void;setFps:(fps:30|60)=>void;setWaterEffect:(enabled:boolean)=>void;setWaterReflection:(enabled:boolean)=>void;setLabelsVisible:(visible:boolean)=>void}>(set=>({
 mode:'day',fps:60,waterEffect:true,waterReflection:true,labelsVisible:false,setMode:mode=>set({mode}),setFps:fps=>set({fps}),setWaterEffect:waterEffect=>set(s=>({waterEffect,waterReflection:waterEffect?s.waterReflection:false})),setWaterReflection:waterReflection=>set(s=>({waterReflection:s.waterEffect&&waterReflection})),setLabelsVisible:labelsVisible=>set({labelsVisible})
}));
