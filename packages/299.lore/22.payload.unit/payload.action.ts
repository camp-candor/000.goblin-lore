import { Action } from '../99.core/interface/action.interface'
import PayloadBit from './fce/payload.bit'

// Payload actions

export const INIT_PAYLOAD = '[Payload action] Init Payload'
export class InitPayload implements Action {
    readonly type = INIT_PAYLOAD
    constructor(public bale: PayloadBit) {}
}

export const UPDATE_PAYLOAD = '[Payload action] Update Payload'
export class UpdatePayload implements Action {
    readonly type = UPDATE_PAYLOAD
    constructor(public bale: PayloadBit) {}
}

export type Actions = InitPayload | UpdatePayload
