import type { Action } from '../99.core/interface/action.interface.js'
import type TargetBit from './fce/target.bit.js'
import type { TargetSeriesBit } from './fce/targetSeries.bit.js'

// Target actions

export const INIT_TARGET = '[Target action] Init Target'
export class InitTarget implements Action {
    readonly type = INIT_TARGET
    constructor(public bale: TargetBit) {}
}

export const UPDATE_TARGET = '[Target action] Update Target'
export class UpdateTarget implements Action {
    readonly type = UPDATE_TARGET
    constructor(public bale: TargetBit) {}
}

export const SELECT_TARGET_SERIES = '[Target action] Select Target Series'
export class SelectTargetSeries implements Action {
    readonly type = SELECT_TARGET_SERIES
    constructor(public bale: TargetSeriesBit | any) {}
}

export type Actions = InitTarget | UpdateTarget | SelectTargetSeries
