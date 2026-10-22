import { Action } from '../99.core/interface/action.interface'
import StatusBit from './fce/status.bit'

// Status actions

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

export type Actions = InitStatus | UpdateStatus
