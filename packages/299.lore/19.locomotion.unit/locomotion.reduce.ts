import clone from 'clone-deep'
import * as Act from './locomotion.action.js'
import { LocomotionModel } from './locomotion.model.js'
import * as Buzz from './locomotion.buzzer.js'
import State from '../99.core/state.js'

export function reducer(
    model: LocomotionModel = new LocomotionModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.UPDATE_LOCOMOTION:
            return Buzz.updateLocomotion(clone(model), act.bale, state)

        case Act.INIT_LOCOMOTION:
            return Buzz.initLocomotion(clone(model), act.bale, state)

        case Act.VALIDATE_LOCOMOTION:
            return Buzz.validateLocomotion(clone(model), act.bale, state)

        default:
            return model
    }
}
