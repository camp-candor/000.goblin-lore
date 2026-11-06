import clone from 'clone-deep'
import * as Act from './intensity.action.js'
import { IntensityModel } from './intensity.model.js'
import * as Buzz from './intensity.buzzer.js'
import type State from '../99.core/state.js'

export function reducer(
    model: IntensityModel = new IntensityModel(),
    act: Act.Actions,
    state?: State,
): IntensityModel {
    switch (act.type) {
        case Act.INIT_INTENSITY:
            return Buzz.initIntensity(clone(model), act.bale, state!)

        case Act.UPDATE_INTENSITY:
            return Buzz.updateIntensity(clone(model), act.bale, state!)

        case Act.COMPOSE_ALGEBRAIC_DSP_MATRIX:
            return Buzz.composeAlgebraicDspMatrix(
                clone(model),
                act.bale as any,
                state!,
            )

        default:
            return model
    }
}
