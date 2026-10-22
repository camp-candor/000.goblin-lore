import { Action } from '../99.core/interface/action.interface'
import TargetBit from './fce/target.bit'

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

export type Actions = InitTarget | UpdateTarget
