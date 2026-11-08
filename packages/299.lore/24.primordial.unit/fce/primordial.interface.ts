import type PrimordialBit from './primordial.bit.js'

export default interface Primordial {
    idx: string
    primordialBitList: PrimordialBit[]
    primordialBits: Record<string, PrimordialBit>
}
