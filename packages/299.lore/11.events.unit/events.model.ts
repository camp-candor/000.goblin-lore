import type Events from './fce/events.interface.js'
import type EventsBit from './fce/events.bit.js'

export class EventsModel implements Events {
  idx: string = '11.events'
  eventsBitList: EventsBit[] = []
  eventsBits: Record<string, EventsBit> = {}
}
