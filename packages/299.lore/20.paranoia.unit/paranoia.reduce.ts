import clone from 'clone-deep'
import * as Act from './paranoia.action.js'
import { ParanoiaModel } from './paranoia.model.js'
import * as Buzz from './paranoia.buzzer.js'
import type State from '../99.core/state.js'

export function reducer(
    model: ParanoiaModel = new ParanoiaModel(),
    act: Act.Actions,
    state?: State,
): ParanoiaModel {
    switch (act.type) {
        case Act.INIT_PARANOIA:
            return Buzz.initParanoia(clone(model), act.bale, state!)

        case Act.UPDATE_PARANOIA:
            return Buzz.updateParanoia(clone(model), act.bale, state!)

        case Act.APPLY_ACOUSTIC_TRANSIENT_IMPULSE:
            Buzz.applyAcousticTransientImpulse(
                clone(model),
                act.bale as any,
                state!,
            )
            return model

        case Act.DECAY_PARANOIA_TICK:
            Buzz.decayParanoiaTick(clone(model), act.bale as any, state!)
            return model

        case Act.COMPUTE_PARANOIA_PITCH_FLUTTER:
            return Buzz.computeParanoiaPitchFlutter(
                clone(model),
                act.bale as any,
                state!,
            )

        default:
            return model
    }
}
