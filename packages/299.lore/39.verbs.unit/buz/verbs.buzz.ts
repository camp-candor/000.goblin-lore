import { VerbsModel } from '../verbs.model.js'
import type VerbsBit from '../fce/verbs.bit.js'
import type State from '../../99.core/state.js'

export const initVerbs = (
    cpy: VerbsModel,
    bal: VerbsBit,
    ste?: State,
): VerbsModel => {
    cpy.idx = bal.idx || '39.verbs'
    if (bal.slv) {
        bal.slv({ vrbBit: { idx: 'init-verbs', val: 0 } })
    }
    return cpy
}

export const updateVerbs = (
    cpy: VerbsModel,
    bal: VerbsBit,
    ste?: State,
): VerbsModel => {
    if (bal.slv) {
        bal.slv({ vrbBit: { idx: 'update-verbs', val: 0 } })
    }
    return cpy
}
