import { ClockModel } from '../clock.model.js'
import type ClockBit from '../fce/clock.bit.js'
import type State from '../../99.core/state.js'

export const initClock = (
    cpy: ClockModel,
    bal: ClockBit,
    ste?: State,
): ClockModel => {
    cpy.idx = bal.idx || '05.clock'
    if (bal.slv) {
        bal.slv({ clkBit: { idx: 'init-clock', val: 0 } })
    }
    return cpy
}

export const updateClock = (
    cpy: ClockModel,
    bal: ClockBit,
    ste?: State,
): ClockModel => {
    if (bal.slv) {
        bal.slv({ clkBit: { idx: 'update-clock', val: 0 } })
    }
    return cpy
}
