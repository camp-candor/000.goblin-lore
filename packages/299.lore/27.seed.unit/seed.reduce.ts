import clone from 'clone-deep'
import * as Act from './seed.action'
import { SeedModel } from './seed.model'
import * as Buzz from './seed.buzzer'
import State from '../99.core/state'

export function reducer(
    model: SeedModel = new SeedModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.UPDATE_SEED:
            return Buzz.updateSeed(clone(model), act.bale, state)

        case Act.INIT_SEED:
            return Buzz.initSeed(clone(model), act.bale, state)

        default:
            return model
    }
}
