import { Action } from '../99.core/interface/action.interface'
import StreamBit from './fce/stream.bit'

// Stream actions

export const INIT_STREAM = '[Stream action] Init Stream'
export class InitStream implements Action {
    readonly type = INIT_STREAM
    constructor(public bale: StreamBit) {}
}

export const UPDATE_STREAM = '[Stream action] Update Stream'
export class UpdateStream implements Action {
    readonly type = UPDATE_STREAM
    constructor(public bale: StreamBit) {}
}

export type Actions = InitStream | UpdateStream
