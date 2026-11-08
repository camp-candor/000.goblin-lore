import type Clock from './fce/clock.interface.js'
import type ClockBit from './fce/clock.bit.js'

export class ClockModel implements Clock {
    idx: string = '05.clock'
    clockBitList: ClockBit[] = []
    clockBits: Record<string, ClockBit> = {}
}
