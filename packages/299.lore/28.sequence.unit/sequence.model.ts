import type Sequence from './fce/sequence.interface.js'
import type SequenceBit from './fce/sequence.bit.js'

export class SequenceModel implements Sequence {
  idx: string = '28.sequence'
  sequenceBitList: SequenceBit[] = []
  sequenceBits: Record<string, SequenceBit> = {}
}
