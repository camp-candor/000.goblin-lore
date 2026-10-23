import type { Action } from '../99.core/interface/action.interface'
import type VerbsBit from './fce/verbs.bit'

export const INIT_VERBS = '[Verbs action] Init Verbs'
export class InitVerbs implements Action {
    readonly type = INIT_VERBS
    constructor(public bale: VerbsBit) {}
}

export const UPDATE_VERBS = '[Verbs action] Update Verbs'
export class UpdateVerbs implements Action {
    readonly type = UPDATE_VERBS
    constructor(public bale: VerbsBit) {}
}

export const COMPILE_SOMATIC_MASK = '[Verbs action] Compile Somatic Mask'
export class CompileSomaticMask implements Action {
    readonly type = COMPILE_SOMATIC_MASK
    constructor(public bale: VerbsBit) {}
}

export const ASSERT_KINETIC_VERBS = '[Verbs action] Assert Kinetic Verbs'
export class AssertKineticVerbs implements Action {
    readonly type = ASSERT_KINETIC_VERBS
    constructor(public bale: VerbsBit) {}
}

export type Actions =
    InitVerbs | UpdateVerbs | CompileSomaticMask | AssertKineticVerbs
