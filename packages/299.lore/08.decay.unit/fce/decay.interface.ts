import type DecayBit from './decay.bit.js'

export default interface Decay {
  idx: string
  decayBitList: DecayBit[]
  decayBits: Record<string, DecayBit>
}
