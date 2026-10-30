import clone from 'clone-deep'
import * as Act from './schema.action'
import { SchemaModel } from './schema.model'
import * as Buzz from './schema.buzzer'
import type State from '../99.core/state'

export function reducer(
    model: SchemaModel = new SchemaModel(),
    act: Act.Actions,
    state?: State,
): SchemaModel {
    const cpy = clone(model, true)

    switch (act.type) {
        case Act.INIT_SCHEMA:
            return Buzz.initSchema(cpy, act.bale, state as State)

        case Act.UPDATE_SCHEMA:
            return Buzz.updateSchema(cpy, act.bale, state as State)

        case Act.VALIDATE_ENTITY:
            Buzz.validateEntity(cpy, act.bale, state as State)
            return cpy

        case Act.SOLVE_SOMATIC_SAT:
            Buzz.solveSomaticSAT(cpy, act.bale, state as State)
            return cpy

        default:
            return cpy
    }
}
