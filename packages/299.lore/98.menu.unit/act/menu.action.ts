import type { Action } from '../../99.core/interface/action.interface.js'
import type MenuBit from '../fce/menu.bit.js'

export const INIT_MENU = '[Menu action] Init Menu'
export class InitMenu implements Action {
    readonly type = INIT_MENU
    constructor(public bale: MenuBit) {}
}

export const UPDATE_MENU = '[Menu action] Update Menu'
export class UpdateMenu implements Action {
    readonly type = UPDATE_MENU
    constructor(public bale: MenuBit) {}
}

export const FACT_SCHEMA_MENU = '[Menu action] Fact Schema Menu'
export class FactSchemaMenu implements Action {
    readonly type = FACT_SCHEMA_MENU
    constructor(public bale: MenuBit) {}
}

export const OPEN_CHARACTER_DOSSIER_SUBMENU =
    '[Menu action] Open Character Dossier Submenu'
export class OpenCharacterDossierSubmenu implements Action {
    readonly type = OPEN_CHARACTER_DOSSIER_SUBMENU
    constructor(public bale?: MenuBit) {}
}

export const PROMPT_LOCOMOTION_CHOICE = '[Menu action] Prompt Locomotion Choice'
export class PromptLocomotionChoice implements Action {
    readonly type = PROMPT_LOCOMOTION_CHOICE
    constructor(public bale?: MenuBit) {}
}

export const PROMPT_EQUIPMENT_SLOTS = '[Menu action] Prompt Equipment Slots'
export class PromptEquipmentSlots implements Action {
    readonly type = PROMPT_EQUIPMENT_SLOTS
    constructor(public bale?: MenuBit) {}
}

export const RUN_CHARACTER_AUDIT_TELEMETRY =
    '[Menu action] Run Character Audit Telemetry'
export class RunCharacterAuditTelemetry implements Action {
    readonly type = RUN_CHARACTER_AUDIT_TELEMETRY
    constructor(public bale?: MenuBit) {}
}

export type Actions =
    | InitMenu
    | UpdateMenu
    | FactSchemaMenu
    | OpenCharacterDossierSubmenu
    | PromptLocomotionChoice
    | PromptEquipmentSlots
    | RunCharacterAuditTelemetry
