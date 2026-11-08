import { SeedModel } from '../seed.model.js'
import type SeedBit from '../fce/seed.bit.js'
import type State from '../../99.core/state.js'

export const initSeed = (
    cpy: SeedModel,
    bal: SeedBit,
    ste?: State,
): SeedModel => {
    cpy.idx = bal.idx || '27.seed'
    if (bal.slv) {
        bal.slv({ sedBit: { idx: 'init-seed', val: 0 } })
    }
    return cpy
}

export const updateSeed = (
    cpy: SeedModel,
    bal: SeedBit,
    ste?: State,
): SeedModel => {
    if (bal.slv) {
        bal.slv({ sedBit: { idx: 'update-seed', val: 0 } })
    }
    return cpy
}
