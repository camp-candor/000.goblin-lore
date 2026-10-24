import clone from 'clone-deep'
import * as Act from './character.action.js'
import { CharacterModel } from './character.model.js'
import * as Buzz from './character.buzzer.js'
import State from '../99.core/state.js'

export function reducer(
    model: CharacterModel = new CharacterModel(),
    action: Act.Actions,
    state?: State,
): CharacterModel {
    const cpy = clone(model)
    switch (action.type) {
        case Act.INIT_CHARACTER:
            return Buzz.initCharacter(cpy, action.bale, state as State)
        case Act.UPDATE_CHARACTER:
            return Buzz.updateCharacter(cpy, action.bale, state as State)
        case Act.PROJECT_SOMATIC_MASK:
            return Buzz.projectSomaticMask(cpy, action.bale, state as State)
        case Act.GENERATE_SEED_PROTAGONIST:
            return Buzz.generateSeedProtagonist(
                cpy,
                action.bale,
                state as State,
            )
        case Act.SERIALIZE_CHARACTER_DOSSIER:
            return Buzz.serializeCharacterDossier(
                cpy,
                action.bale,
                state as State,
            )
        default:
            return cpy
    }
}

export default reducer
