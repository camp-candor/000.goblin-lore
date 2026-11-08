import { PortModel } from '../port.model.js'
import type PortBit from '../fce/port.bit.js'
import type State from '../../99.core/state.js'

export const initPort = (
    cpy: PortModel,
    bal: PortBit,
    ste?: State,
): PortModel => {
    cpy.idx = bal.idx || '23.port'
    if (bal.slv) {
        bal.slv({ prtBit: { idx: 'init-port', val: 0 } })
    }
    return cpy
}

export const updatePort = (
    cpy: PortModel,
    bal: PortBit,
    ste?: State,
): PortModel => {
    if (bal.slv) {
        bal.slv({ prtBit: { idx: 'update-port', val: 0 } })
    }
    return cpy
}
