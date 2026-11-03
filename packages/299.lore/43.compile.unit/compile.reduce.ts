import clone from 'clone-deep'
import * as Act from './compile.action'
import { CompileModel } from './compile.model'
import * as Buzz from './compile.buzzer'
import type State from '../99.core/state'

export function reducer(
    model: CompileModel = new CompileModel(),
    act: Act.Actions | { type: string; bale: any },
    state?: State,
) {
    switch (act.type) {
        case Act.INIT_COMPILE:
            return Buzz.initCompile(clone(model), act.bale, state)
        case Act.RUN_COMPILE:
        case Act.RUN_COMPLETE_GAUNTLET:
            return Buzz.runCompile(clone(model), act.bale, state)
        case Act.PASS1_EVALUATE:
        case Act.PASS1_STRUCTURAL_BOUNDS:
            return Buzz.pass1Evaluate(clone(model), act.bale, state)
        case Act.PASS2_TRAVERSE:
        case Act.PASS2_RELATIONAL_TOPOLOGY:
            return Buzz.pass2Traverse(clone(model), act.bale, state)
        case Act.PASS3_SEAL:
        case Act.PASS3_DETERMINISTIC_SEAL:
            return Buzz.pass3Seal(clone(model), act.bale, state)
        case Act.GATE0_VERIFY:
        case Act.GATE0_VERIFICATION_AUDIT:
            return Buzz.gate0Verify(clone(model), act.bale, state)
        case Act.OFFLINE_DELETION_TEST:
            return Buzz.offlineDeletionTest(clone(model), act.bale, state)
        case Act.STYLOMETRIC_LINT:
            return Buzz.stylometricLint(clone(model), act.bale, state)
        default:
            return model
    }
}
