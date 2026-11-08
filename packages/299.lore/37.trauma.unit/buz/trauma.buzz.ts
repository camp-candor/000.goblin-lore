import { TraumaModel } from '../trauma.model.js'
import type TraumaBit from '../fce/trauma.bit.js'
import type State from '../../99.core/state.js'

export const initTrauma = (
    cpy: TraumaModel,
    bal: TraumaBit,
    ste?: State,
): TraumaModel => {
    cpy.idx = bal.idx || '37.trauma'
    if (bal.slv) {
        bal.slv({ trmBit: { idx: 'init-trauma', val: 0 } })
    }
    return cpy
}

export const updateTrauma = (
    cpy: TraumaModel,
    bal: TraumaBit,
    ste?: State,
): TraumaModel => {
    if (bal.slv) {
        bal.slv({ trmBit: { idx: 'update-trauma', val: 0 } })
    }
    return cpy
}
