import { CharacterModel } from '../character.model.js'
import type CharacterBit from '../fce/character.bit.js'
import type State from '../../99.core/state.js'

export const initCharacter = (
    cpy: CharacterModel,
    bal: CharacterBit,
    ste?: State,
): CharacterModel => {
    cpy.idx = bal.idx || '02.character'
    if (bal.slv) {
        bal.slv({ chrBit: { idx: 'init-character', val: 0 } })
    }
    return cpy
}

export const updateCharacter = (
    cpy: CharacterModel,
    bal: CharacterBit,
    ste?: State,
): CharacterModel => {
    if (bal.slv) {
        bal.slv({ chrBit: { idx: 'update-character', val: 0 } })
    }
    return cpy
}
