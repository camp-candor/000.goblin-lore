import type { Action } from '../99.core/interface/action.interface.js'
import type StreamBit from './fce/stream.bit.js'

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

export const STREAM_VOID_WARNING = '[Stream action] Stream Void Warning'
export class StreamVoidWarning implements Action {
    readonly type = STREAM_VOID_WARNING
    constructor(public bale: StreamBit) {}
}

export type Actions = InitStream | UpdateStream | StreamVoidWarning
