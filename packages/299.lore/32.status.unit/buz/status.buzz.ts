import { StatusModel } from '../status.model.js'
import type StatusBit from '../fce/status.bit.js'
import type State from '../../99.core/state.js'

export const initStatus = (
    cpy: StatusModel,
    bal: StatusBit,
    ste?: State,
): StatusModel => {
    cpy.idx = bal.idx || '32.status'
    if (bal.slv) {
        bal.slv({ stsBit: { idx: 'init-status', val: 0 } })
    }
    return cpy
}

export const updateStatus = (
    cpy: StatusModel,
    bal: StatusBit,
    ste?: State,
): StatusModel => {
    if (bal.slv) {
        bal.slv({ stsBit: { idx: 'update-status', val: 0 } })
    }
    return cpy
}
