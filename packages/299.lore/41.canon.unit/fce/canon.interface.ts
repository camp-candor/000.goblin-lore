import type CanonBit from './canon.bit.js'

export default interface Canon {
  idx: string
  canonBitList: CanonBit[]
  canonBits: Record<string, CanonBit>
}
