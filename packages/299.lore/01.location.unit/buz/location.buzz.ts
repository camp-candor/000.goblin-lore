import { LocationModel } from '../location.model.js'
import type LocationBit from '../fce/location.bit.js'
import type State from '../../99.core/state.js'

export const initLocation = (
    cpy: LocationModel,
    bal: LocationBit,
    ste?: State,
): LocationModel => {
    cpy.idx = bal.idx || '01.location'
    if (bal.slv) {
        bal.slv({ locBit: { idx: 'init-location', val: 0 } })
    }
    return cpy
}

export const updateLocation = (
    cpy: LocationModel,
    bal: LocationBit,
    ste?: State,
): LocationModel => {
    if (bal.slv) {
        bal.slv({ locBit: { idx: 'update-location', val: 0 } })
    }
    return cpy
}
