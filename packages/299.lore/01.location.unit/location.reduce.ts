import clone from 'clone-deep'
import * as Act from './location.action.js'
import { LocationModel } from './location.model.js'
import * as Buzz from './location.buzzer.js'
import type State from '../99.core/state.js'

export function reducer(
    model: LocationModel = new LocationModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.INIT_LOCATION:
            return Buzz.initLocation(clone(model), act.bale, state)

        case Act.UPDATE_LOCATION:
            return Buzz.updateLocation(clone(model), act.bale, state)

        case Act.RECONCILE_RECIPROCAL_LINKS:
            return Buzz.reconcileReciprocalLinks(clone(model), act.bale, state)

        default:
            return model
    }
}
