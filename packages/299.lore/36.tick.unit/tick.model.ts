import type Tick from './fce/tick.interface.js'
import type TickBit from './fce/tick.bit.js'

export class TickModel implements Tick {
    idx: string = '36.tick'
    tickBitList: TickBit[] = []
    tickBits: Record<string, TickBit> = {}
    tickIndex: number = 0
    tickSeconds: number = 60
    framesPerSecond: number = 24
    totalElapsedSeconds: number = 0
    totalFrames: number = 0
}
