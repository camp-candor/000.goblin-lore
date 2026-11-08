import type LoreBit from './lore.bit.js'

export default interface Lore {
  idx: string
  loreBitList: LoreBit[]
  loreBits: Record<string, LoreBit>
}
