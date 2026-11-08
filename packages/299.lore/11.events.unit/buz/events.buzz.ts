import { EventsModel } from '../events.model.js'
import type EventsBit from '../fce/events.bit.js'
import type State from '../../99.core/state.js'

export const initEvents = (cpy: EventsModel, bal: EventsBit, ste?: State): EventsModel => {
  cpy.idx = bal.idx || '11.events'
  if (bal.slv) {
    bal.slv({ eveBit: { idx: 'init-events', val: 0 } })
  }
  return cpy
}

export const updateEvents = (cpy: EventsModel, bal: EventsBit, ste?: State): EventsModel => {
  if (bal.slv) {
    bal.slv({ eveBit: { idx: 'update-events', val: 0 } })
  }
  return cpy
}
