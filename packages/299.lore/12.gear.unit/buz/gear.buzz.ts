import { GearModel } from '../gear.model.js'
import type GearBit from '../fce/gear.bit.js'
import type State from '../../99.core/state.js'

export const initGear = (cpy: GearModel, bal: GearBit, ste?: State): GearModel => {
  cpy.idx = bal.idx || '12.gear'
  if (bal.slv) {
    bal.slv({ geaBit: { idx: 'init-gear', val: 0 } })
  }
  return cpy
}

export const updateGear = (cpy: GearModel, bal: GearBit, ste?: State): GearModel => {
  if (bal.slv) {
    bal.slv({ geaBit: { idx: 'update-gear', val: 0 } })
  }
  return cpy
}
