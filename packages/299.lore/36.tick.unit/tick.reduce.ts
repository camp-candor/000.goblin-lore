import clone from 'clone-deep'
import * as Act from './tick.action'
import { TickModel } from './tick.model'
import * as Buzz from './tick.buzzer'
import State from '../99.core/state'

export function reducer(
    model: TickModel = new TickModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.UPDATE_TICK:
            return Buzz.updateTick(clone(model), act.bale, state)

        case Act.INIT_TICK:
            return Buzz.initTick(clone(model), act.bale, state)

        case Act.CONFIGURE_TICK_CADENCE:
            return Buzz.configureTickCadence(clone(model), act.bale, state)

        case Act.STEP_TICK_FRAME:
            return Buzz.stepTickFrame(clone(model), act.bale, state)

        default:
            return model
    }
}
