import clone from 'clone-deep'
import * as Act from './payload.action'
import { PayloadModel } from './payload.model'
import * as Buzz from './payload.buzzer'
import State from '../99.core/state'

export function reducer(
    model: PayloadModel = new PayloadModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.UPDATE_PAYLOAD:
            return Buzz.updatePayload(clone(model), act.bale, state)

        case Act.INIT_PAYLOAD:
            return Buzz.initPayload(clone(model), act.bale, state)

        default:
            return model
    }
}
