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

export const FORMAT_UNBOUND_BANNER = '[Status action] Format Unbound Banner'
export class FormatUnboundBanner implements Action {
    readonly type = FORMAT_UNBOUND_BANNER
    constructor(public bale: StatusBit) {}
}

export const SET_DISPATCH_LOCKOUT = '[Status action] Set Dispatch Lockout'
export class SetDispatchLockout implements Action {
    readonly type = SET_DISPATCH_LOCKOUT
    constructor(public bale: StatusBit) {}
}

export const READ_DISPATCH_LOCKOUT = '[Status action] Read Dispatch Lockout'
export class ReadDispatchLockout implements Action {
    readonly type = READ_DISPATCH_LOCKOUT
    constructor(public bale: StatusBit) {}
}

export type Actions =
    | InitStatus
    | UpdateStatus
    | EvaluateVoidState
    | FormatUnboundBanner
    | SetDispatchLockout
    | ReadDispatchLockout
