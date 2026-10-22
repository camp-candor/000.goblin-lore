import { Action } from '../99.core/interface/action.interface'
import ThresholdBit from './fce/threshold.bit'

// Threshold actions

export const INIT_THRESHOLD = '[Threshold action] Init Threshold'
export class InitThreshold implements Action {
    readonly type = INIT_THRESHOLD
    constructor(public bale: ThresholdBit) {}
}

export const UPDATE_THRESHOLD = '[Threshold action] Update Threshold'
export class UpdateThreshold implements Action {
    readonly type = UPDATE_THRESHOLD
    constructor(public bale: ThresholdBit) {}
}

export type Actions = InitThreshold | UpdateThreshold
