import clone from 'clone-deep'
import * as Act from './wound.action.js'
import { WoundModel } from './wound.model.js'
import * as Buzz from './wound.buzzer.js'
import type State from '../99.core/state.js'

export function reducer(
    model: WoundModel = new WoundModel(),
    act: Act.Actions,
    state?: State,
): WoundModel {
    switch (act.type) {
        case Act.INIT_WOUND:
            return Buzz.initWound(clone(model, true), act.bale, state!)

        case Act.UPDATE_WOUND:
            return Buzz.updateWound(clone(model, true), act.bale, state!)

        case Act.CLAMP_COMPOUND_TRAUMA:
            return Buzz.clampCompoundTrauma(
                clone(model, true),
                act.bale,
                state!,
            )

        default:
            return model
    }
}
