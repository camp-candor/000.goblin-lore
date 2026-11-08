import { PrimordialModel } from '../primordial.model.js'
import type PrimordialBit from '../fce/primordial.bit.js'
import type State from '../../99.core/state.js'

export const initPrimordial = (
    cpy: PrimordialModel,
    bal: PrimordialBit,
    ste?: State,
): PrimordialModel => {
    cpy.idx = bal.idx || '24.primordial'
    if (bal.slv) {
        bal.slv({ prmBit: { idx: 'init-primordial', val: 0 } })
    }
    return cpy
}

export const updatePrimordial = (
    cpy: PrimordialModel,
    bal: PrimordialBit,
    ste?: State,
): PrimordialModel => {
    if (bal.slv) {
        bal.slv({ prmBit: { idx: 'update-primordial', val: 0 } })
    }
    return cpy
}
