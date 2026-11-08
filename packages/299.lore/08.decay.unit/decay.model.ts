import type Decay from './fce/decay.interface.js'
import type DecayBit from './fce/decay.bit.js'

export class DecayModel implements Decay {
  idx: string = '08.decay'
  decayBitList: DecayBit[] = []
  decayBits: Record<string, DecayBit> = {}
}
