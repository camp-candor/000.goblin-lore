import clone from 'clone-deep'
import * as Act from './schema.action'
import { SchemaModel } from './schema.model'
import * as Buzz from './schema.buzzer'
import State from '../99.core/state'

export function reducer(
    model: SchemaModel = new SchemaModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.UPDATE_SCHEMA:
            return Buzz.updateSchema(clone(model), act.bale, state)

        case Act.INIT_SCHEMA:
            return Buzz.initSchema(clone(model), act.bale, state)

        default:
            return model
    }
}
