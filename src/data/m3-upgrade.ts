import {upgradeSettlement} from './settlement-upgrade.ts';
import {upgradeScenicCoast} from './scenic-upgrade.ts';
import {upgradeCentralCampus} from './central-campus.ts';
import {upgradeFeihua} from './feihua-upgrade.ts';
import type {Project} from './model.ts';
import {settleBuildings} from '../terrain/placement.ts';

/** M3 adds only the reproducible environment seed; existing layout data is left intact. */
export function upgradeM3(p:Project):Project{
 if(!p.environment){p.environment={revision:1,seed:34017};settleBuildings(p,true);}return upgradeSettlement(upgradeScenicCoast(upgradeFeihua(upgradeCentralCampus(p))));
}
