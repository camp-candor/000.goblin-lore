import type { Model } from '../../99.core/interface/model.interface.js'
import type { TTSGenerationRequest } from '../val/ttsPayload.val.js'
import type { TTSPayloadValidationReceiptBit } from './ttsPayload.bit.js'
import type { VocalFeasibilityReceipt } from '../val/aphoniaGate.val.js'
import type { StalenessEvaluationReceipt } from '../val/factPinning.val.js'
import type {
    PayloadHashReceipt,
    PayloadParityResult,
} from '../val/payloadHash.val.js'

export default interface Payload extends Model {
    idx: string
    validatedPayloads: Record<string, TTSGenerationRequest>
    validationReceipts: Record<string, TTSPayloadValidationReceiptBit>
    feasibilityReceipts: Record<string, VocalFeasibilityReceipt>
    stalenessReceipts: Record<string, StalenessEvaluationReceipt>
    hashedPayloads: Record<string, PayloadHashReceipt>
    parityReceipts: Record<string, PayloadParityResult>
    totalValidatedCount: number
}
