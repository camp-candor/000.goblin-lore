import clone from 'clone-deep'
import * as Act from './canon.action.js'
import { CanonModel } from './canon.model.js'
import * as Buzz from './canon.buzzer.js'
import type State from '../99.core/state.js'

export const reducer = (
    model: CanonModel = new CanonModel(),
    action: any,
    state?: State,
): any => {
    const cpy = clone(model)
    switch (action.type) {
        case Act.INIT_CANON:
            return Buzz.initCanon(cpy, action.bale, state as State)
        case Act.UPDATE_CANON:
            return Buzz.updateCanon(cpy, action.bale, state as State)
        case Act.COMPILE_GENESIS_SEAL:
            return Buzz.compileGenesisMaster(cpy, action.bale, state as State)
        default:
            return cpy
    }
}
