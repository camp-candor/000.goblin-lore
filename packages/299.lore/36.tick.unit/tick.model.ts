import type Tick from './fce/tick.interface.js'
import type TickBit from './fce/tick.bit.js'

export class TickModel implements Tick {
    idx: string = '36.tick'
    tickBitList: TickBit[] = []
    tickBits: Record<string, TickBit> = {}
}
