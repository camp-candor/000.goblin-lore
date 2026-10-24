import type { Action } from '../../99.core/interface/action.interface.js'
import type CompileGenesisBit from '../fce/compileGenesis.bit.js'

export const COMPILE_GENESIS_SEAL = '[Canon action] Compile Genesis Seal'
export class CompileGenesisSeal implements Action {
    readonly type = COMPILE_GENESIS_SEAL
    constructor(public bale: CompileGenesisBit) {}
}

export type Actions = CompileGenesisSeal
