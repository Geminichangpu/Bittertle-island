import {create} from 'zustand';
import type {TimeMode} from './time-presets';

/** Session-wide preview state, separate from authored layout and future manual lamp overrides. */
export const useEnvironment=create<{mode:TimeMode;fps:30|60;waterMotion:boolean;setMode:(mode:TimeMode)=>void;setFps:(fps:30|60)=>void;setWaterMotion:(waterMotion:boolean)=>void}>(set=>({
 mode:'day',fps:60,waterMotion:false,setMode:mode=>set({mode}),setFps:fps=>set({fps}),setWaterMotion:waterMotion=>set({waterMotion})
}));
