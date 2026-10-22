import clone from 'clone-deep'
import * as Act from './target.action'
import { TargetModel } from './target.model'
import * as Buzz from './target.buzzer'
import State from '../99.core/state'

export function reducer(
    model: TargetModel = new TargetModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.UPDATE_TARGET:
            return Buzz.updateTarget(clone(model), act.bale, state)

        case Act.INIT_TARGET:
            return Buzz.initTarget(clone(model), act.bale, state)

        default:
            return model
    }
}
