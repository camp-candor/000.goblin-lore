import type Canon from './fce/canon.interface.js'
import type CanonBit from './fce/canon.bit.js'

export class CanonModel implements Canon {
    idx: string = '41.canon'
    canonBitList: CanonBit[] = []
    canonBits: Record<string, CanonBit> = {}
}
