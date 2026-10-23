import clone from 'clone-deep'
import * as Act from './locomotion.action.js'
import { LocomotionModel } from './locomotion.model.js'
import * as Buzz from './locomotion.buzzer.js'
import type State from '../99.core/state.js'

export function reducer(
    model: LocomotionModel = new LocomotionModel(),
    act: Act.Actions,
    state?: State,
): LocomotionModel | Promise<LocomotionModel> {
    const cpy: LocomotionModel = Object.assign(
        new LocomotionModel(),
        clone({ ...clone(model) }),
    )
    switch (act.type) {
        case Act.INIT_LOCOMOTION:
            return Buzz.initLocomotion(cpy, act.bale, state!)

        case Act.UPDATE_LOCOMOTION:
            return Buzz.updateLocomotion(cpy, act.bale, state!)

        case Act.VALIDATE_LOCOMOTION:
            return Buzz.validateLocomotion(cpy, act.bale, state!)

        default:
            return cpy
    }
}
