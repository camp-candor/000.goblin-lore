import clone from 'clone-deep'
import * as Act from './canon.action'
import { CanonModel } from './canon.model'
import * as Buzz from './canon.buzzer'
import State from '../99.core/state'

export function reducer(
    model: CanonModel = new CanonModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.UPDATE_CANON:
            return Buzz.updateCanon(clone(model), act.bale, state)

        case Act.INIT_CANON:
            return Buzz.initCanon(clone(model), act.bale, state)

        default:
            return model
    }
}
