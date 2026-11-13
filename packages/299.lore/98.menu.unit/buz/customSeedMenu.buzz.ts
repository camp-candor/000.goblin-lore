import type State from '../../99.core/state.js'
import type { MenuModel } from '../menu.model.js'
import type MenuBit from '../fce/menu.bit.js'
import * as ActSed from '../../27.seed.unit/seed.action.js'
import { injectCustomSeedIdentifiers } from '../../27.seed.unit/buz/customSeed.buzz.js'
import {
    promptBlessedInput,
    resolveLibraryBus,
} from '../../98.menu.unit/buz/blessedModal.buzz.js'

const UPDATE_CONSOLE = '[Console action] Update Console'

function emitConsole(lib: any, ste: State | undefined, line: string): void {
    const clean = String(line || '')
        .replace(/[^\x20-\x7E]/g, '')
        .trim()
    if (lib && typeof lib.hunt === 'function') {
        lib.hunt(UPDATE_CONSOLE, { idx: 'cns00', src: clean })
        return
    }
    if (ste && typeof ste.hunt === 'function') {
        ste.hunt(UPDATE_CONSOLE, { idx: 'cns00', src: clean })
    }
}

export const promptCustomSeedMenu = async (
    cpy: MenuModel,
    bal: MenuBit,
    ste?: State,
): Promise<MenuModel> => {
    const lib = resolveLibraryBus()
    const dat = (bal?.dat || {}) as Record<string, any>
    const seriesSlug = bal?.src || dat.seriesSlug || ''

    const abortPrompt = (reason: string): MenuModel => {
        const line = `>> [CUSTOM_SEED:CANCELLED] ${reason}`
        emitConsole(lib, ste, line)
        cpy.statusMessage = line
        if (bal?.slv) {
            bal.slv({
                mnuBit: {
                    idx: 'prompt-custom-seed-cancel',
                    val: 0,
                    dat: { cancelled: true, receipt: line },
                },
            })
        }
        return cpy
    }

    if (!seriesSlug) {
        return abortPrompt('MISSING_SERIES_SLUG')
    }

    emitConsole(
        lib,
        ste,
        '>> [CUSTOM_SEED] Launching custom seed identifier injection...',
    )

    const charRes = await promptBlessedInput({
        promptLabel: 'Seed 1/4: Character ID (default: char_wonder_woman)',
        defaultValue: 'char_wonder_woman',
        sanitizeSlug: false,
    })
    if (charRes.cancelled) {
        return abortPrompt('Aborted at Character ID.')
    }

    const locRes = await promptBlessedInput({
        promptLabel: 'Seed 2/4: Location ID (default: loc_gotham_rooftop)',
        defaultValue: 'loc_gotham_rooftop',
        sanitizeSlug: false,
    })
    if (locRes.cancelled) {
        return abortPrompt('Aborted at Location ID.')
    }

    const itemRes = await promptBlessedInput({
        promptLabel: 'Seed 3/4: Possession ID (default: item_lasso_of_truth)',
        defaultValue: 'item_lasso_of_truth',
        sanitizeSlug: false,
    })
    if (itemRes.cancelled) {
        return abortPrompt('Aborted at Possession ID.')
    }

    const grvRes = await promptBlessedInput({
        promptLabel: 'Seed 4/4: Grievance ID (default: grv_gotham_standoff)',
        defaultValue: 'grv_gotham_standoff',
        sanitizeSlug: false,
    })
    if (grvRes.cancelled) {
        return abortPrompt('Aborted at Grievance ID.')
    }

    const customIdentifiers = {
        characterId: charRes.value || 'char_wonder_woman',
        locationId: locRes.value || 'loc_gotham_rooftop',
        possessionId: itemRes.value || 'item_lasso_of_truth',
        grievanceId: grvRes.value || 'grv_gotham_standoff',
    }

    let seedReceipt: any = null
    const payload = {
        idx: 'menu-custom-seed-inject',
        src: seriesSlug,
        dat: {
            seriesSlug,
            repoRoot: dat.repoRoot,
            customIdentifiers,
        },
        slv: (res: any) => {
            seedReceipt = res?.seedBit
        },
    }

    if (ste && typeof ste.hunt === 'function') {
        const huntRes = await ste.hunt(
            ActSed.INJECT_CUSTOM_SEED_IDENTIFIERS,
            payload,
        )
        if (!seedReceipt) {
            seedReceipt = huntRes?.seedBit || huntRes
        }
    }

    if (!seedReceipt || seedReceipt.val !== 1) {
        await injectCustomSeedIdentifiers({}, payload, ste)
    }

    const ok = seedReceipt?.val === 1
    const summaryLine = ok
        ? `>> [CUSTOM_SEED:OK] Injected 4 Byte-0 dossiers (${customIdentifiers.characterId}, ${customIdentifiers.locationId}, ${customIdentifiers.possessionId}, ${customIdentifiers.grievanceId}) for '${seriesSlug}'`
        : `:: [CUSTOM_SEED:FAIL] ${seedReceipt?.dat?.error || 'Injection failed'}`

    emitConsole(lib, ste, summaryLine)
    cpy.statusMessage = summaryLine

    if (bal?.slv) {
        bal.slv({
            mnuBit: {
                idx: 'prompt-custom-seed',
                val: ok ? 1 : 0,
                src: seriesSlug,
                dat: seedReceipt?.dat || { customIdentifiers },
            },
        })
    }

    return cpy
}
