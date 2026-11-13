import type { CalendarClockSnapshot } from '../../38.types.unit/fce/chronology.interface.js'
import type ClockBit from './clock.bit.js'

export default interface Clock {
    idx: string
    clockBitList: ClockBit[]
    clockBits: Record<string, ClockBit>
    snapshot: CalendarClockSnapshot | null
    lastFormattedBanner: string
}
