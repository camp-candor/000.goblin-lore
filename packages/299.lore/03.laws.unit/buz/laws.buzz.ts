import { LawsModel } from '../laws.model.js'
import type LawsBit from '../fce/laws.bit.js'
import type State from '../../99.core/state.js'

export const initLaws = (
    cpy: LawsModel,
    bal: LawsBit,
    ste?: State,
): LawsModel => {
    cpy.idx = bal.idx || '03.laws'
    if (bal.slv) {
        bal.slv({ lawBit: { idx: 'init-laws', val: 0 } })
    }
    return cpy
}

export const updateLaws = (
    cpy: LawsModel,
    bal: LawsBit,
    ste?: State,
): LawsModel => {
    if (bal.slv) {
        bal.slv({ lawBit: { idx: 'update-laws', val: 0 } })
    }
    return cpy
}
