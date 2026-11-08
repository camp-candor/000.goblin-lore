import type Seed from './fce/seed.interface.js'
import type SeedBit from './fce/seed.bit.js'

export class SeedModel implements Seed {
    idx: string = '27.seed'
    seedBitList: SeedBit[] = []
    seedBits: Record<string, SeedBit> = {}
}
