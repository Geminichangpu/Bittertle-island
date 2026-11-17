import type {Project} from './model.ts';
import {upgradeM1} from './m1-layout.ts';
import {referenceHeightmap} from '../terrain/reference-heightmap.ts';
import {settleBuildings} from '../terrain/placement.ts';
import {addLandscapeRevision} from '../terrain/landscape.ts';

/** One-time height upgrade applies to the user's active project, never replaces their scene. */
export function upgradeM2(p:Project):Project{
 upgradeM1(p);if(p.terrain.heightmapRevision===1&&p.terrain.landscapeRevision===2)return p;
 if(p.terrain.heightmapRevision!==1)Object.assign(p.terrain,{...referenceHeightmap,heights:[...referenceHeightmap.heights],heightmapRevision:1});
 const preserveHeights=!!p.terrain.landscapeRevision;
 addLandscapeRevision(p);p.terrain.landscapeRevision=2;
 return settleBuildings(p,preserveHeights,true);
}
