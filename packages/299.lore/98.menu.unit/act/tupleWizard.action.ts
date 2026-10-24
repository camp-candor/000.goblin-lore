import type { Action } from '../../99.core/interface/action.interface.js'
import type MenuBit from '../fce/menu.bit.js'

export const OPEN_TUPLE_WIZARD = '[Menu action] Open Tuple Wizard'
export class OpenTupleWizard implements Action {
    readonly type = OPEN_TUPLE_WIZARD
    constructor(public bale?: MenuBit) {}
}

export const PROMPT_GENRE_MODALITY = '[Menu action] Prompt Genre Modality'
export class PromptGenreModality implements Action {
    readonly type = PROMPT_GENRE_MODALITY
    constructor(public bale?: MenuBit) {}
}

export const PROMPT_SCARCITY_PRESET = '[Menu action] Prompt Scarcity Preset'
export class PromptScarcityPreset implements Action {
    readonly type = PROMPT_SCARCITY_PRESET
    constructor(public bale?: MenuBit) {}
}

export const PROMPT_ACOUSTIC_FLOOR = '[Menu action] Prompt Acoustic Floor'
export class PromptAcousticFloor implements Action {
    readonly type = PROMPT_ACOUSTIC_FLOOR
    constructor(public bale?: MenuBit) {}
}

export type Actions =
    | OpenTupleWizard
    | PromptGenreModality
    | PromptScarcityPreset
    | PromptAcousticFloor

export type TupleWizardActions = Actions
