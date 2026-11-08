import { DecayModel } from '../decay.model.js'
import type DecayBit from '../fce/decay.bit.js'
import type State from '../../99.core/state.js'

export const initDecay = (
    cpy: DecayModel,
    bal: DecayBit,
    ste?: State,
): DecayModel => {
    cpy.idx = bal.idx || '08.decay'
    if (bal.slv) {
        bal.slv({ dcyBit: { idx: 'init-decay', val: 0 } })
    }
    return cpy
}

export const updateDecay = (
    cpy: DecayModel,
    bal: DecayBit,
    ste?: State,
): DecayModel => {
    if (bal.slv) {
        bal.slv({ dcyBit: { idx: 'update-decay', val: 0 } })
    }
    return cpy
}
