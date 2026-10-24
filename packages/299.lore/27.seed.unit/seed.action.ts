import { Action } from '../99.core/interface/action.interface.js'
import SeedBit from './fce/seed.bit.js'
import SeedGenesisCorpusBit from './fce/seedGenesisCorpus.bit.js'

export const INIT_SEED = '[Seed action] Init Seed'
export class InitSeed implements Action {
    readonly type = INIT_SEED
    constructor(public bale: SeedBit) {}
}

export const UPDATE_SEED = '[Seed action] Update Seed'
export class UpdateSeed implements Action {
    readonly type = UPDATE_SEED
    constructor(public bale: SeedBit) {}
}

export const SEED_GENESIS_CORPUS = '[Seed action] Seed Genesis Corpus'
export class SeedGenesisCorpus implements Action {
    readonly type = SEED_GENESIS_CORPUS
    constructor(public bale: SeedGenesisCorpusBit) {}
}

export type Actions = InitSeed | UpdateSeed | SeedGenesisCorpus
