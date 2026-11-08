import type Lore from './fce/lore.interface.js'
import type LoreBit from './fce/lore.bit.js'

export class LoreModel implements Lore {
    idx: string = '00.lore'
    loreBitList: LoreBit[] = []
    loreBits: Record<string, LoreBit> = {}
}
