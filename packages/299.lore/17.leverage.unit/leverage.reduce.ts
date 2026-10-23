import clone from 'clone-deep'
import * as Act from './leverage.action'
import { LeverageModel } from './leverage.model'
import * as Buzz from './leverage.buzzer'
import State from '../99.core/state'

export function reducer(
    model: LeverageModel = new LeverageModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.INIT_LEVERAGE:
            return Buzz.initLeverage(clone(model), act.bale, state!)
        case Act.UPDATE_LEVERAGE:
            return Buzz.updateLeverage(clone(model), act.bale, state!)
        case Act.INDEX_LEVERAGE_DIRECTORY:
            return Buzz.indexLeverageDirectoryBuzz(
                clone(model),
                act.bale,
                state!,
            )
        case Act.SPEND_LEVERAGE_STRINGS:
            return Buzz.spendLeverageStringsBuzz(clone(model), act.bale, state!)
        case Act.VERIFY_LEVERAGE_INTEGRITY:
            return Buzz.verifyLeverageIntegrityBuzz(
                clone(model),
                act.bale,
                state!,
            )
        case Act.EVALUATE_BELIEF_DIVERGENCE:
            return Buzz.evaluateBeliefDivergenceBuzz(
                clone(model),
                act.bale as any,
                state!,
            )
        default:
            return model
    }
}
