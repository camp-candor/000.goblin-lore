import clone from 'clone-deep'
import * as Act from './wound.action'
import { WoundModel } from './wound.model'
import * as Buzz from './wound.buzzer'
import State from '../99.core/state'

export function reducer(
    model: WoundModel = new WoundModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.UPDATE_WOUND:
            return Buzz.updateWound(clone(model), act.bale, state)

        case Act.INIT_WOUND:
            return Buzz.initWound(clone(model), act.bale, state)

        default:
            return model
    }
}
