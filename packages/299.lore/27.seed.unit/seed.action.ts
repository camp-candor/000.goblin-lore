import { Action } from '../99.core/interface/action.interface'
import SeedBit from './fce/seed.bit'

// Seed actions

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

export type Actions = InitSeed | UpdateSeed
