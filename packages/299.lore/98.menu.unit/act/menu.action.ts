import type { Action } from '../../99.core/interface/action.interface.js'
import type MenuBit from '../fce/menu.bit.js'
import {
    OPEN_SERIES_GENESIS_WIZARD,
    OpenSeriesGenesisWizard,
    CLOSE_SERIES_GENESIS_WIZARD,
    CloseSeriesGenesisWizard,
    type GenesisMenuActions,
} from './genesisMenu.action.js'

export * from './genesisMenu.action.js'
export * from './tupleWizard.action.js'
import type { TupleWizardActions } from './tupleWizard.action.js'

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

export const INSPECT_HUD_STATUS = '[Menu action] Inspect Hud Status'
export class InspectHudStatus implements Action {
    readonly type = INSPECT_HUD_STATUS
    constructor(public bale: MenuBit) {}
}

export const BIND_DISCOVERY_PROVENANCE =
    '[Refusal action] Bind Discovery Provenance'
export class BindDiscoveryProvenance implements Action {
    readonly type = BIND_DISCOVERY_PROVENANCE
    constructor(public bale?: any) {}
}

export const PROMPT_SWITCH_SERIES = '[Menu action] Prompt Switch Series'
export class PromptSwitchSeries implements Action {
    readonly type = PROMPT_SWITCH_SERIES
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
    | InspectHudStatus
    | BindDiscoveryProvenance
    | PromptSwitchSeries
    | GenesisMenuActions
    | TupleWizardActions
