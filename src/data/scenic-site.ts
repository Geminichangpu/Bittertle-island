import type {Point} from './model.ts';
// Local X is east/right, local -Z is north. Shared by terrain, mesh and collision.
export const COAST_CENTER:Point=[164,-64];
// Asymmetric headlands and recessed clefts, running north to south, sea on +X.
export const COAST_EDGE:Point[]=[[-14,-27],[-4,-26],[5,-23],[8,-20],[7,-16],[14,-13],[17,-8],[14,-4],[19,0],[21,6],[18,10],[13,11],[15,17],[12,23],[8.5,31.5]];
export const COAST_PATH:Point[]=[[-20,29],[-18,21],[-12,13],[-3,8],[7,5],[8,-2],[4,-9],[1,-16],[-5,-19]];
export const COAST_ROCK: [number,number,number]=[-5,0,-11];
