import type Clock from './fce/clock.interface.js'
import type ClockBit from './fce/clock.bit.js'
import type { CalendarClockSnapshot } from '../38.types.unit/fce/chronology.interface.js'

export class ClockModel implements Clock {
    idx: string = '05.clock'
    clockBitList: ClockBit[] = []
    clockBits: Record<string, ClockBit> = {}
    snapshot: CalendarClockSnapshot | null = null
    lastFormattedBanner: string = ''
}
