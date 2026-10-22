import clone from 'clone-deep'
import * as Act from './threshold.action'
import { ThresholdModel } from './threshold.model'
import * as Buzz from './threshold.buzzer'
import State from '../99.core/state'

export function reducer(
    model: ThresholdModel = new ThresholdModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.UPDATE_THRESHOLD:
            return Buzz.updateThreshold(clone(model), act.bale, state)

        case Act.INIT_THRESHOLD:
            return Buzz.initThreshold(clone(model), act.bale, state)

        default:
            return model
    }
}
