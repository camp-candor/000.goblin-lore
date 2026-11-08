import type EventsBit from './events.bit.js'

export default interface Events {
    idx: string
    eventsBitList: EventsBit[]
    eventsBits: Record<string, EventsBit>
}
