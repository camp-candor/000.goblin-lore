import type {
    RefusalVectorRule,
    RefusalValidationResult,
} from '../val/refusal.val'

/**
 * Payload interface for refusal rule validation requests.
 */
export interface ValidateRefusalPayload {
    character_id: string
    refusals: RefusalVectorRule[]
}

/**
 * Extension bit for 45.refusal.unit validation receipts.
 */
export interface RefusalValidationReceiptBit {
    idx: string
    val: number
    dat: RefusalValidationResult
}
