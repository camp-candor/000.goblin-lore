import clone from 'clone-deep'
import * as Act from './menu.action.js'
import { MenuModel } from './menu.model.js'
import * as Buzz from './menu.buzzer.js'
import type State from '../99.core/state.js'

export function reducer(
    model: MenuModel = new MenuModel(),
    act: Act.Actions,
    state?: State,
) {
    let result: any
    switch (act.type) {
        case Act.INIT_MENU:
            result = Buzz.initMenu(clone(model), act.bale, state as any)
            break

        case Act.UPDATE_MENU:
            result = Buzz.updateMenu(clone(model), act.bale, state as any)
            break

        case Act.FACT_SCHEMA_MENU:
            result = Buzz.openFactSchemaSubmenu(
                clone(model),
                act.bale,
                state as any,
            )
            break

        case Act.OPEN_CHARACTER_DOSSIER_SUBMENU:
            result = Buzz.openCharacterDossierSubmenu(
                clone(model),
                act.bale,
                state as any,
            )
            break

        case Act.PROMPT_LOCOMOTION_CHOICE:
            result = Buzz.promptLocomotionChoice(
                clone(model),
                act.bale,
                state as any,
            )
            break

        case Act.PROMPT_EQUIPMENT_SLOTS:
            result = Buzz.promptEquipmentSlots(
                clone(model),
                act.bale,
                state as any,
            )
            break

        case Act.BIND_DISCOVERY_PROVENANCE:
            // Delegate logic handled via headless prompt or action route
            break

        case Act.RUN_CHARACTER_AUDIT_TELEMETRY:
            result = Buzz.runCharacterAuditTelemetry(
                clone(model),
                act.bale,
                state as any,
            )
            break

        case Act.INSPECT_HUD_STATUS:
            result = Buzz.inspectGenesisHudStatus(
                clone(model),
                act.bale,
                state as any,
            )
            break

        case Act.OPEN_TUPLE_WIZARD:
            result = Buzz.openTupleWizard(clone(model), act.bale, state as any)
            break

        case Act.PROMPT_GENRE_MODALITY:
            result = Buzz.promptGenreModality(
                clone(model),
                act.bale,
                state as any,
            )
            break

        case Act.PROMPT_SCARCITY_PRESET:
            result = Buzz.promptScarcityPreset(
                clone(model),
                act.bale,
                state as any,
            )
            break

        case Act.PROMPT_ACOUSTIC_FLOOR:
            result = Buzz.promptAcousticFloor(
                clone(model),
                act.bale,
                state as any,
            )
            break

        case Act.PROMPT_SWITCH_SERIES:
            result = Buzz.promptSwitchSeries(
                clone(model),
                act.bale,
                state as any,
            )
            break

        default:
            return model
    }

    if (result && typeof result.then === 'function') {
        result.idx = model.idx
        result.activeSubmenu = model.activeSubmenu
        result.lst = model.lst
        result.lastSelection = model.lastSelection
    }
    return result
}
