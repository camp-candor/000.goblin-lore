import clone from 'clone-deep'
import * as Act from './seed.action.js'
import { SeedModel } from './seed.model.js'
import * as Buzz from './seed.buzzer.js'
import State from '../99.core/state.js'

export const reducer = (
    model: SeedModel = new SeedModel(),
    action: Act.Actions,
    state?: State,
): any => {
    const cpy = clone(model)
    switch (action.type) {
        case Act.INIT_SEED:
            return Buzz.initSeed(cpy, action.bale, state as State)
        case Act.UPDATE_SEED:
            return Buzz.updateSeed(cpy, action.bale, state as State)
        case Act.SEED_GENESIS_CORPUS:
            return Buzz.orchestrateGenesisSeeds(
                cpy,
                action.bale as any,
                state as State,
            )
        default:
            return cpy
    }
}
