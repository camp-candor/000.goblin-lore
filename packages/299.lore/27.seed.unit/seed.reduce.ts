import clone from 'clone-deep'
import * as Act from './seed.action.js'
import { SeedModel } from './seed.model.js'
import * as Buzz from './seed.buzzer.js'
import type State from '../99.core/state.js'

export function reducer(
    model: SeedModel = new SeedModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.INIT_SEED:
            return Buzz.initSeed(clone(model), act.bale, state)

        case Act.UPDATE_SEED:
            return Buzz.updateSeed(clone(model), act.bale, state)

        case Act.POPULATE_GENESIS_SEEDS:
            return Buzz.populateGenesisSeeds(clone(model), act.bale, state)

        default:
            return model
    }
}
