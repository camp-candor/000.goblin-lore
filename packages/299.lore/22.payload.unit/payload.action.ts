import { Action } from '../99.core/interface/action.interface.js'
import type PayloadBit from './fce/ttsPayload.bit.js'
import type { TTSGenerationRequest } from './val/ttsPayload.val.js'

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

export const VALIDATE_TTS_PAYLOAD = '[Payload action] Validate TTS Payload'
export class ValidateTtsPayload implements Action {
    readonly type = VALIDATE_TTS_PAYLOAD
    constructor(
        public bale: PayloadBit & {
            dat: {
                candidatePayload: unknown
            }
        },
    ) {}
}

export type Actions = InitPayload | UpdatePayload | ValidateTtsPayload
