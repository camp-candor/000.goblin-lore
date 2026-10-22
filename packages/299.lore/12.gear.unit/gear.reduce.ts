import clone from 'clone-deep'
import * as Act from './gear.action'
import { GearModel } from './gear.model'
import * as Buzz from './gear.buzzer'
import State from '../99.core/state'

export function reducer(
    model: GearModel = new GearModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.UPDATE_GEAR:
            return Buzz.updateGear(clone(model), act.bale, state)

        case Act.INIT_GEAR:
            return Buzz.initGear(clone(model), act.bale, state)

        default:
            return model
    }
}
