import { CanonModel } from '../canon.model.js'
import type CanonBit from '../fce/canon.bit.js'
import type State from '../../99.core/state.js'

export const initCanon = (
    cpy: CanonModel,
    bal: CanonBit,
    ste?: State,
): CanonModel => {
    cpy.idx = bal.idx || '41.canon'
    if (bal.slv) {
        bal.slv({ canBit: { idx: 'init-canon', val: 0 } })
    }
    return cpy
}

export const updateCanon = (
    cpy: CanonModel,
    bal: CanonBit,
    ste?: State,
): CanonModel => {
    if (bal.slv) {
        bal.slv({ canBit: { idx: 'update-canon', val: 0 } })
    }
    return cpy
}
