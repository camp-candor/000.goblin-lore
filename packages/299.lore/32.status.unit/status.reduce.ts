import clone from 'clone-deep'
import * as Act from './status.action.js'
import { StatusModel } from './status.model.js'
import * as Buzz from './status.buzzer.js'
import State from '../99.core/state.js'

export function reducer(
    model: StatusModel = new StatusModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.INIT_STATUS:
            return Buzz.initStatus(clone(model), act.bale, state as State)

        case Act.UPDATE_STATUS:
            return Buzz.updateStatus(clone(model), act.bale, state as State)

        case Act.EVALUATE_VOID_STATE:
            return Buzz.voidStateScan(clone(model), act.bale, state as State)

        case Act.FORMAT_UNBOUND_BANNER:
            return Buzz.formatUnboundBanner(
                clone(model),
                act.bale,
                state as State,
            )

        case Act.SET_DISPATCH_LOCKOUT:
            return Buzz.setDispatchLockout(
                clone(model),
                act.bale,
                state as State,
            )

        case Act.READ_DISPATCH_LOCKOUT:
            return Buzz.readDispatchLockout(
                clone(model),
                act.bale,
                state as State,
            )

        default:
            return model
    }
}
