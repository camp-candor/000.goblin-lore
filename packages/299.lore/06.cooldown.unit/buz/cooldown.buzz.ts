import { CooldownModel } from '../cooldown.model.js'
import type CooldownBit from '../fce/cooldown.bit.js'
import type State from '../../99.core/state.js'

export const initCooldown = (
    cpy: CooldownModel,
    bal: CooldownBit,
    ste?: State,
): CooldownModel => {
    cpy.idx = bal.idx || '06.cooldown'
    if (bal.slv) {
        bal.slv({ cldBit: { idx: 'init-cooldown', val: 0 } })
    }
    return cpy
}

export const updateCooldown = (
    cpy: CooldownModel,
    bal: CooldownBit,
    ste?: State,
): CooldownModel => {
    if (bal.slv) {
        bal.slv({ cldBit: { idx: 'update-cooldown', val: 0 } })
    }
    return cpy
}
