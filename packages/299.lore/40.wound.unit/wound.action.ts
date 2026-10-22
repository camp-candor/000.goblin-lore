import { Action } from '../99.core/interface/action.interface'
import WoundBit from './fce/wound.bit'

// Wound actions

export const INIT_WOUND = '[Wound action] Init Wound'
export class InitWound implements Action {
    readonly type = INIT_WOUND
    constructor(public bale: WoundBit) {}
}

export const UPDATE_WOUND = '[Wound action] Update Wound'
export class UpdateWound implements Action {
    readonly type = UPDATE_WOUND
    constructor(public bale: WoundBit) {}
}

export type Actions = InitWound | UpdateWound
