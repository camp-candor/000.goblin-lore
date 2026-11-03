import type { Action } from '../99.core/interface/action.interface'
import type CompileBit from './fce/compile.bit'

export const INIT_COMPILE = '[Compile action] Init Compile'
export class InitCompile implements Action {
    readonly type = INIT_COMPILE
    constructor(public bale: CompileBit) {}
}

export const RUN_COMPILE = '[Compile action] Run Compile'
export const RUN_COMPLETE_GAUNTLET = '[Compile action] Run Complete Gauntlet'
export class RunCompile implements Action {
    readonly type = RUN_COMPILE
    constructor(public bale: CompileBit) {}
}

export const PASS1_EVALUATE = '[Compile action] Pass 1 Evaluate'
export const PASS1_STRUCTURAL_BOUNDS =
    '[Compile action] Pass 1 Structural Bounds'
export class Pass1Evaluate implements Action {
    readonly type = PASS1_EVALUATE
    constructor(public bale: CompileBit) {}
}

export const PASS2_TRAVERSE = '[Compile action] Pass 2 Traverse'
export const PASS2_RELATIONAL_TOPOLOGY =
    '[Compile action] Pass 2 Relational Topology'
export class Pass2Traverse implements Action {
    readonly type = PASS2_TRAVERSE
    constructor(public bale: CompileBit) {}
}

export const PASS3_SEAL = '[Compile action] Pass 3 Seal'
export const PASS3_DETERMINISTIC_SEAL =
    '[Compile action] Pass 3 Deterministic Seal'
export class Pass3Seal implements Action {
    readonly type = PASS3_SEAL
    constructor(public bale: CompileBit) {}
}

export const GATE0_VERIFY = '[Compile action] Gate 0 Verify'
export const GATE0_VERIFICATION_AUDIT =
    '[Compile action] Gate 0 Verification Audit'
export class Gate0Verify implements Action {
    readonly type = GATE0_VERIFY
    constructor(public bale: CompileBit) {}
}

export const OFFLINE_DELETION_TEST = '[Compile action] Offline Deletion Test'
export class OfflineDeletionTest implements Action {
    readonly type = OFFLINE_DELETION_TEST
    constructor(public bale: CompileBit) {}
}

export const STYLOMETRIC_LINT = '[Compile action] Stylometric Lint'
export class StylometricLint implements Action {
    readonly type = STYLOMETRIC_LINT
    constructor(public bale: CompileBit) {}
}

export type Actions =
    | InitCompile
    | RunCompile
    | Pass1Evaluate
    | Pass2Traverse
    | Pass3Seal
    | Gate0Verify
    | OfflineDeletionTest
    | StylometricLint
