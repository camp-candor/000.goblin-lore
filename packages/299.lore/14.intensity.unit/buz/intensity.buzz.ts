import { IntensityModel } from '../intensity.model.js'
import type IntensityBit from '../fce/intensity.bit.js'
import type State from '../../99.core/state.js'

export const initIntensity = (
    cpy: IntensityModel,
    bal: IntensityBit,
    ste?: State,
): IntensityModel => {
    cpy.idx = bal.idx || '14.intensity'
    if (bal.slv) {
        bal.slv({ itnBit: { idx: 'init-intensity', val: 0 } })
    }
    return cpy
}

export const updateIntensity = (
    cpy: IntensityModel,
    bal: IntensityBit,
    ste?: State,
): IntensityModel => {
    if (bal.slv) {
        bal.slv({ itnBit: { idx: 'update-intensity', val: 0 } })
    }
    return cpy
}
