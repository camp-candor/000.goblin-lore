import type { TTSGenerationRequest } from '../val/ttsPayload.val.js'
import type { TTSPayloadValidationReceiptBit } from './ttsPayload.bit.js'
import type {
    VocalFeasibilityCandidate,
    VocalFeasibilityReceipt,
} from '../val/aphoniaGate.val.js'
import type {
    StalenessEvaluationInput,
    StalenessEvaluationReceipt,
} from '../val/factPinning.val.js'
import type {
    PayloadHashReceipt,
    PayloadParityResult,
    PayloadParityVerificationInput,
} from '../val/payloadHash.val.js'

export interface UnifiedPayloadBitData {
    candidatePayload?: unknown
    candidate?: VocalFeasibilityCandidate
    stalenessInput?: StalenessEvaluationInput
    parityInput?: PayloadParityVerificationInput
    hashPayload?: unknown
    epoch?: number
}

export default interface PayloadBit {
    idx: string
    src?: string
    val?: number
    dat?:
        | UnifiedPayloadBitData
        | TTSGenerationRequest
        | TTSPayloadValidationReceiptBit
        | VocalFeasibilityReceipt
        | StalenessEvaluationReceipt
        | PayloadHashReceipt
        | PayloadParityResult
    slv?: (result: { pldBit: Partial<PayloadBit> }) => void
}
