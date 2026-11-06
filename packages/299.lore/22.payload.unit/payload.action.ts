import { Action } from '../99.core/interface/action.interface.js'
import type PayloadBit from './fce/ttsPayload.bit.js'
import type AphoniaGateBit from './fce/aphoniaGate.bit.js'
import type FactPinningBit from './fce/factPinning.bit.js'
import type PayloadHashBit from './fce/payloadHash.bit.js'
import type { VocalFeasibilityCandidate } from './val/aphoniaGate.val.js'
import type { StalenessEvaluationInput } from './val/factPinning.val.js'
import type { PayloadParityVerificationInput } from './val/payloadHash.val.js'

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

export const VERIFY_VOCAL_FEASIBILITY =
    '[Payload action] Verify Vocal Feasibility'
export class VerifyVocalFeasibility implements Action {
    readonly type = VERIFY_VOCAL_FEASIBILITY
    constructor(
        public bale: AphoniaGateBit & {
            dat: {
                candidate: VocalFeasibilityCandidate
                epoch?: number
            }
        },
    ) {}
}

export const CHECK_SCENE_SOMATIC_STALENESS =
    '[Payload action] Check Scene Somatic Staleness'
export class CheckSceneSomaticStaleness implements Action {
    readonly type = CHECK_SCENE_SOMATIC_STALENESS
    constructor(
        public bale: FactPinningBit & {
            dat: {
                input: StalenessEvaluationInput
                epoch?: number
            }
        },
    ) {}
}

export const HASH_TTS_GENERATION_PAYLOAD =
    '[Payload action] Hash TTS Generation Payload'
export class HashTtsGenerationPayload implements Action {
    readonly type = HASH_TTS_GENERATION_PAYLOAD
    constructor(
        public bale: PayloadHashBit & {
            dat: {
                payload: unknown
                epoch?: number
            }
        },
    ) {}
}

export const VERIFY_PAYLOAD_HASH_PARITY =
    '[Payload action] Verify Payload Hash Parity'
export class VerifyPayloadHashParity implements Action {
    readonly type = VERIFY_PAYLOAD_HASH_PARITY
    constructor(
        public bale: PayloadHashBit & {
            dat: PayloadParityVerificationInput
        },
    ) {}
}

export type Actions =
    | InitPayload
    | UpdatePayload
    | ValidateTtsPayload
    | VerifyVocalFeasibility
    | CheckSceneSomaticStaleness
    | HashTtsGenerationPayload
    | VerifyPayloadHashParity
