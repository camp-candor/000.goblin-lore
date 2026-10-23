import type { Action } from '../99.core/interface/action.interface'
import type VoiceBit from './fce/voice.bit'

export const INIT_VOICE = '[Voice action] Init Voice'
export class InitVoice implements Action {
    readonly type = INIT_VOICE
    constructor(public bale: VoiceBit) {}
}

export const UPDATE_VOICE = '[Voice action] Update Voice'
export class UpdateVoice implements Action {
    readonly type = UPDATE_VOICE
    constructor(public bale: VoiceBit) {}
}

export const PARSE_VOICE_RAIL = '[Voice action] Parse Voice Rail'
export class ParseVoiceRail implements Action {
    readonly type = PARSE_VOICE_RAIL
    constructor(public bale: VoiceBit) {}
}

export const DIFFERENTIATE_WANTS = '[Voice action] Differentiate Wants'
export class DifferentiateWants implements Action {
    readonly type = DIFFERENTIATE_WANTS
    constructor(public bale: VoiceBit) {}
}

export const VALIDATE_COMEDIC_REGISTER =
    '[Voice action] Validate Comedic Register'
export class ValidateComedicRegister implements Action {
    readonly type = VALIDATE_COMEDIC_REGISTER
    constructor(public bale: VoiceBit) {}
}

export type Actions =
    | InitVoice
    | UpdateVoice
    | ParseVoiceRail
    | DifferentiateWants
    | ValidateComedicRegister
