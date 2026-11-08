import type WoundBit from './wound.bit.js'

export default interface Wound {
  idx: string
  woundBitList: WoundBit[]
  woundBits: Record<string, WoundBit>
}
