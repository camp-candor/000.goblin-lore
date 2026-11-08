import { PayloadModel } from '../payload.model.js'
import type PayloadBit from '../fce/payload.bit.js'
import type State from '../../99.core/state.js'

export const initPayload = (
    cpy: PayloadModel,
    bal: PayloadBit,
    ste?: State,
): PayloadModel => {
    cpy.idx = bal.idx || '22.payload'
    if (bal.slv) {
        bal.slv({ pldBit: { idx: 'init-payload', val: 0 } })
    }
    return cpy
}

export const updatePayload = (
    cpy: PayloadModel,
    bal: PayloadBit,
    ste?: State,
): PayloadModel => {
    if (bal.slv) {
        bal.slv({ pldBit: { idx: 'update-payload', val: 0 } })
    }
    return cpy
}
