import clone from 'clone-deep'
import * as Act from './threshold.action.js'
import { ThresholdModel } from './threshold.model.js'
import * as Buzz from './threshold.buzzer.js'
import type State from '../99.core/state.js'

export function reducer(
    model: ThresholdModel = new ThresholdModel(),
    act: Act.Actions,
    state?: State,
): ThresholdModel {
    switch (act.type) {
        case Act.INIT_THRESHOLD:
            return Buzz.initThreshold(clone(model), act.bale, state!)

        case Act.UPDATE_THRESHOLD:
            return Buzz.updateThreshold(clone(model), act.bale, state!)

        case Act.EVALUATE_POST_BREAK_THRESHOLD:
            Buzz.evaluatePostBreakThreshold(
                clone(model),
                act.bale as any,
                state!,
            )
            return model

        default:
            return model
    }
}
