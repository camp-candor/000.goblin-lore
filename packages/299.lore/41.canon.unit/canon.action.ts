import { Action } from '../99.core/interface/action.interface.js'
import CanonBit from './fce/canon.bit.js'

export * from './act/byteZero.action.js'
export * from './act/compileGenesis.action.js'
import type { Actions as CompileGenesisActions } from './act/compileGenesis.action.js'

export const INIT_CANON = '[Canon action] Init Canon'
export class InitCanon implements Action {
    readonly type = INIT_CANON
    constructor(public bale: CanonBit) {}
}

export const UPDATE_CANON = '[Canon action] Update Canon'
export class UpdateCanon implements Action {
    readonly type = UPDATE_CANON
    constructor(public bale: CanonBit) {}
}

export type Actions = InitCanon | UpdateCanon | CompileGenesisActions
