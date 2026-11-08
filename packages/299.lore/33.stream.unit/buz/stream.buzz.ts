import { StreamModel } from '../stream.model.js'
import type StreamBit from '../fce/stream.bit.js'
import type State from '../../99.core/state.js'

export const initStream = (
    cpy: StreamModel,
    bal: StreamBit,
    ste?: State,
): StreamModel => {
    cpy.idx = bal.idx || '33.stream'
    if (bal.slv) {
        bal.slv({ stmBit: { idx: 'init-stream', val: 0 } })
    }
    return cpy
}

export const updateStream = (
    cpy: StreamModel,
    bal: StreamBit,
    ste?: State,
): StreamModel => {
    if (bal.slv) {
        bal.slv({ stmBit: { idx: 'update-stream', val: 0 } })
    }
    return cpy
}
