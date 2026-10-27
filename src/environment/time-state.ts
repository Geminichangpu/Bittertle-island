import {create} from 'zustand';
import type {TimeMode} from './time-presets';

/** Session-wide preview state, separate from authored layout and future manual lamp overrides. */
export const useEnvironment=create<{mode:TimeMode;fps:30|60;setMode:(mode:TimeMode)=>void;setFps:(fps:30|60)=>void}>(set=>({
 mode:'day',fps:60,setMode:mode=>set({mode}),setFps:fps=>set({fps})
}));
