import { Action } from '../99.core/interface/action.interface.js'
import CharacterBit from './fce/character.bit.js'

export const INIT_CHARACTER = '[Character action] Init Character'
export class InitCharacter implements Action {
    readonly type = INIT_CHARACTER
    constructor(public bale: CharacterBit) {}
}

export const UPDATE_CHARACTER = '[Character action] Update Character'
export class UpdateCharacter implements Action {
    readonly type = UPDATE_CHARACTER
    constructor(public bale: CharacterBit) {}
}

export const PROJECT_SOMATIC_MASK = '[Character action] Project Somatic Mask'
export class ProjectSomaticMask implements Action {
    readonly type = PROJECT_SOMATIC_MASK
    constructor(public bale: CharacterBit) {}
}

export const GENERATE_SEED_PROTAGONIST =
    '[Character action] Generate Seed Protagonist'
export class GenerateSeedProtagonist implements Action {
    readonly type = GENERATE_SEED_PROTAGONIST
    constructor(public bale: CharacterBit) {}
}

export const SERIALIZE_CHARACTER_DOSSIER =
    '[Character action] Serialize Character Dossier'
export class SerializeCharacterDossier implements Action {
    readonly type = SERIALIZE_CHARACTER_DOSSIER
    constructor(public bale: CharacterBit) {}
}

export type Actions =
    | InitCharacter
    | UpdateCharacter
    | ProjectSomaticMask
    | GenerateSeedProtagonist
    | SerializeCharacterDossier
