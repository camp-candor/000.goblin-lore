import type TickBit from './tick.bit.js'

export default interface Tick {
    idx: string
    tickBitList: TickBit[]
    tickBits: Record<string, TickBit>
}
