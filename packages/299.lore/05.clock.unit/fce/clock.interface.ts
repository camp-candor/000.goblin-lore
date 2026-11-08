import type ClockBit from './clock.bit.js'

export default interface Clock {
    idx: string
    clockBitList: ClockBit[]
    clockBits: Record<string, ClockBit>
}
