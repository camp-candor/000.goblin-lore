import clone from 'clone-deep'
import * as Act from './stream.action.js'
import { StreamModel } from './stream.model.js'
import * as Buzz from './stream.buzzer.js'
import type State from '../99.core/state.js'

export function reducer(
    model: StreamModel = new StreamModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.INIT_STREAM:
            return Buzz.initStream(clone(model), act.bale, state as State)

        case Act.UPDATE_STREAM:
            return Buzz.updateStream(clone(model), act.bale, state as State)

        case Act.STREAM_VOID_WARNING:
            return Buzz.voidWarningStream(
                clone(model),
                act.bale,
                state as State,
            )

        default:
            return model
    }
}
