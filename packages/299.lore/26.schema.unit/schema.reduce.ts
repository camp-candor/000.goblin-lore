import clone from 'clone-deep'
import * as Act from './act/schema.action.js'
import { SchemaModel } from './schema.model.js'
import * as Buzz from './schema.buzzer.js'
import State from '../99.core/state.js'

export function reducer(
    model: SchemaModel = new SchemaModel(),
    action: Act.Actions,
    state?: State,
): SchemaModel {
    const cpy = clone(model)
    switch (action.type) {
        case Act.INIT_SCHEMA:
            return Buzz.initSchema(cpy, action.bale, state as State)
        case Act.UPDATE_SCHEMA:
            return Buzz.updateSchema(cpy, action.bale, state as State)
        case Act.VALIDATE_CHARACTER_DOSSIER:
            return Buzz.validateCharacterDossier(
                cpy,
                action.bale,
                state as State,
            )
        default:
            return cpy
    }
}

export default reducer
