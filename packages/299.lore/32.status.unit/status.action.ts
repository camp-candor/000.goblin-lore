import type { Action } from '../99.core/interface/action.interface.js'
import type StatusBit from './fce/status.bit.js'

export const INIT_STATUS = '[Status action] Init Status'
export class InitStatus implements Action {
    readonly type = INIT_STATUS
    constructor(public bale: StatusBit) {}
}

export const UPDATE_STATUS = '[Status action] Update Status'
export class UpdateStatus implements Action {
    readonly type = UPDATE_STATUS
    constructor(public bale: StatusBit) {}
}

export const EVALUATE_VOID_STATE = '[Status action] Evaluate Void State'
export class EvaluateVoidState implements Action {
    readonly type = EVALUATE_VOID_STATE
    constructor(public bale: StatusBit) {}
}

export type Actions = InitStatus | UpdateStatus | EvaluateVoidState
