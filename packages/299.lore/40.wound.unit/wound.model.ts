import type Wound from './fce/wound.interface.js'
import type WoundBit from './fce/wound.bit.js'

export class WoundModel implements Wound {
  idx: string = '40.wound'
  woundBitList: WoundBit[] = []
  woundBits: Record<string, WoundBit> = {}
}
