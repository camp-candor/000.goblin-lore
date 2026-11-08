import type SeedBit from './seed.bit.js'

export default interface Seed {
    idx: string
    seedBitList: SeedBit[]
    seedBits: Record<string, SeedBit>
}
