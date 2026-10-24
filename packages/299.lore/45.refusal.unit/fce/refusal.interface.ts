import type RefusalBit from './refusal.bit'

/**
 * State container interface for 45.refusal.unit
 */
export default interface Refusal {
    idx?: string
    refusalBitList?: RefusalBit[]
    refusalBits?: Record<string, RefusalBit>
}
