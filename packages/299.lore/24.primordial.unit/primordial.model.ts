import type Primordial from './fce/primordial.interface.js'
import type PrimordialBit from './fce/primordial.bit.js'

export class PrimordialModel implements Primordial {
  idx: string = '24.primordial'
  primordialBitList: PrimordialBit[] = []
  primordialBits: Record<string, PrimordialBit> = {}
}
