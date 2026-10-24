import type Refusal from './fce/refusal.interface'
import type RefusalBit from './fce/refusal.bit'

/**
 * Concrete model state for 45.refusal.unit
 */
export class RefusalModel implements Refusal {
    idx: string = '45.refusal'
    refusalBitList: RefusalBit[] = []
    refusalBits: Record<string, RefusalBit> = {}
}
