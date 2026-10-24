import clone from 'clone-deep'
import * as Act from './entity.action.js'
import { EntityModel } from './entity.model.js'
import * as Buzz from './entity.buzzer.js'
import type State from '../99.core/state.js'

export function reducer(
    model: EntityModel = new EntityModel(),
    act: Act.Actions,
    state?: State,
): EntityModel {
    const cpy = clone(model)
    switch (act.type) {
        case Act.INIT_ENTITY:
            return Buzz.initEntity(cpy, act.bale, state as any)
        case Act.UPDATE_ENTITY:
            return Buzz.updateEntity(cpy, act.bale, state as any)
        case Act.OPEN_HUMAN_SAVE_GATE:
            Buzz.threeStrikeSaveGate(cpy, act.bale, state as any)
            return cpy
        default:
            return cpy
    }
}
