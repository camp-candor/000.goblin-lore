import clone from 'clone-deep'
import * as Act from './intensity.action'
import { IntensityModel } from './intensity.model'
import * as Buzz from './intensity.buzzer'
import State from '../99.core/state'

export function reducer(
    model: IntensityModel = new IntensityModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.UPDATE_INTENSITY:
            return Buzz.updateIntensity(clone(model), act.bale, state)

        case Act.INIT_INTENSITY:
            return Buzz.initIntensity(clone(model), act.bale, state)

        default:
            return model
    }
}
