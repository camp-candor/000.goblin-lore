import clone from 'clone-deep'
import * as Act from './trauma.action'
import { TraumaModel } from './trauma.model'
import * as Buzz from './trauma.buzzer'
import type State from '../99.core/state'

export function reducer(
    model: TraumaModel = new TraumaModel(),
    act: Act.Actions,
    state?: State,
): TraumaModel {
    switch (act.type) {
        case Act.INIT_TRAUMA:
            return Buzz.initTrauma(clone(model, true), act.bale, state!)

        case Act.UPDATE_TRAUMA:
            return Buzz.updateTrauma(clone(model, true), act.bale, state!)

        case Act.CONFIGURE_SENSORY_ACUITY:
            return Buzz.configureSensoryAcuity(
                clone(model, true),
                act.bale,
                state!,
            )

        case Act.CONFIGURE_VOCAL_DSP:
            return Buzz.configureVocalDsp(clone(model, true), act.bale, state!)

        case Act.RESOLVE_SOMATIC_DELTA:
            return Buzz.resolveSomaticDelta(
                clone(model, true),
                act.bale,
                state!,
            )

        default:
            return model
    }
}
