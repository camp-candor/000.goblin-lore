import type BusBit from './bus.bit.js'

export default interface Bus {
    idx: string
    busBitList: BusBit[]
    busBits: Record<string, BusBit>
}
