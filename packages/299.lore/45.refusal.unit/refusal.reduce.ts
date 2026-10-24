import clone from 'clone-deep'
import * as Act from './refusal.action'
import { RefusalModel } from './refusal.model'
import * as Buzz from './refusal.buzzer'
import type State from '../99.core/state'

export function reducer(
    model: RefusalModel = new RefusalModel(),
    act: Act.Actions,
    state?: State,
): RefusalModel {
    const cpy: RefusalModel =
        clone(model) === model ? clone(model, true) : clone(model)
    const ste: State = state!

    switch (act.type) {
        case Act.INIT_REFUSAL:
            return Buzz.initRefusal(cpy, act.bale, ste)

        case Act.UPDATE_REFUSAL:
            return Buzz.updateRefusal(cpy, act.bale, ste)

        case Act.TEST_REFUSAL:
            return Buzz.testRefusal(cpy, act.bale, ste)

        case Act.VALIDATE_REFUSAL_TUPLE:
            return Buzz.validateRefusalTuple(cpy, act.bale, ste)

        case Act.CLAMP_REFUSAL_STRAIN:
            return Buzz.clampRefusalStrain(cpy, act.bale, ste)

        case Act.BIND_DISCOVERY_PROVENANCE:
            return Buzz.bindDiscoveryProvenance(cpy, act.bale, ste)

        default:
            return cpy
    }
}
