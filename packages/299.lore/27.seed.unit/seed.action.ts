import type { Action } from '../99.core/interface/action.interface.js'
import type SeedBit from './fce/seed.bit.js'

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

export const POPULATE_GENESIS_SEEDS = '[Seed action] Populate Genesis Seeds'
export class PopulateGenesisSeeds implements Action {
    readonly type = POPULATE_GENESIS_SEEDS
    constructor(public bale: SeedBit) {}
}

export const INJECT_CUSTOM_SEED_IDENTIFIERS =
    '[Seed action] Inject Custom Seed Identifiers'
export class InjectCustomSeedIdentifiers implements Action {
    readonly type = INJECT_CUSTOM_SEED_IDENTIFIERS
    constructor(public bale: SeedBit) {}
}

export type Actions =
    InitSeed | UpdateSeed | PopulateGenesisSeeds | InjectCustomSeedIdentifiers
