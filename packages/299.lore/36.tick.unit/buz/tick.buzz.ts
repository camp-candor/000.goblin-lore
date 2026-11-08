import { TickModel } from '../tick.model.js'
import type TickBit from '../fce/tick.bit.js'
import type State from '../../99.core/state.js'

export const initTick = (cpy: TickModel, bal: TickBit, ste?: State): TickModel => {
  cpy.idx = bal.idx || '36.tick'
  if (bal.slv) {
    bal.slv({ ticBit: { idx: 'init-tick', val: 0 } })
  }
  return cpy
}

export const updateTick = (cpy: TickModel, bal: TickBit, ste?: State): TickModel => {
  if (bal.slv) {
    bal.slv({ ticBit: { idx: 'update-tick', val: 0 } })
  }
  return cpy
}
