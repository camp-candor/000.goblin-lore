import clone from 'clone-deep'
import * as Act from './stream.action'
import { StreamModel } from './stream.model'
import * as Buzz from './stream.buzzer'
import State from '../99.core/state'

export function reducer(
    model: StreamModel = new StreamModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.UPDATE_STREAM:
            return Buzz.updateStream(clone(model), act.bale, state)

        case Act.INIT_STREAM:
            return Buzz.initStream(clone(model), act.bale, state)

        default:
            return model
    }
}
