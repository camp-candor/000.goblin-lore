import { SequenceModel } from '../sequence.model.js'
import type SequenceBit from '../fce/sequence.bit.js'
import type State from '../../99.core/state.js'

export const initSequence = (
    cpy: SequenceModel,
    bal: SequenceBit,
    ste?: State,
): SequenceModel => {
    cpy.idx = bal.idx || '28.sequence'
    if (bal.slv) {
        bal.slv({ sqnBit: { idx: 'init-sequence', val: 0 } })
    }
    return cpy
}

export const updateSequence = (
    cpy: SequenceModel,
    bal: SequenceBit,
    ste?: State,
): SequenceModel => {
    if (bal.slv) {
        bal.slv({ sqnBit: { idx: 'update-sequence', val: 0 } })
    }
    return cpy
}
