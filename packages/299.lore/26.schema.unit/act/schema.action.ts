import { Action } from '../../99.core/interface/action.interface.js'
import SchemaBit from '../fce/schema.bit.js'

export const INIT_SCHEMA = '[Schema action] Init Schema'
export class InitSchema implements Action {
    readonly type = INIT_SCHEMA
    constructor(public bale: SchemaBit) {}
}

export const UPDATE_SCHEMA = '[Schema action] Update Schema'
export class UpdateSchema implements Action {
    readonly type = UPDATE_SCHEMA
    constructor(public bale: SchemaBit) {}
}

export const VALIDATE_CHARACTER_DOSSIER =
    '[Schema action] Validate Character Dossier'
export class ValidateCharacterDossier implements Action {
    readonly type = VALIDATE_CHARACTER_DOSSIER
    constructor(public bale: SchemaBit) {}
}

export type Actions = InitSchema | UpdateSchema | ValidateCharacterDossier
