import type State from '../../99.core/state.js'
import type { MenuModel } from '../menu.model.js'
import type MenuBit from '../fce/menu.bit.js'
import {
    LOCOMOTION_PROFILES,
    VALID_LOCOMOTION_BASELINES,
    resolveLocomotionProfile,
} from '../../19.locomotion.unit/val/locomotion.val.js'
import { resolveLibraryBus } from '../../98.menu.unit/buz/blessedModal.buzz.js'

const UPDATE_GRID = '[Grid action] Update Grid'
const OPEN_CHOICE = '[Open action] Open Choice'
const UPDATE_CONSOLE = '[Console action] Update Console'

function emitConsole(ste: State | undefined, line: string): void {
    const cleanLine = String(line || '')
        .replace(/[^\x20-\x7E]/g, '')
        .trim()
    const lib = resolveLibraryBus()
    if (lib && typeof lib.hunt === 'function') {
        lib.hunt(UPDATE_CONSOLE, { idx: 'cns00', src: cleanLine })
        return
    }
    if (ste && typeof ste.hunt === 'function') {
        ste.hunt(UPDATE_CONSOLE, { idx: 'cns00', src: cleanLine })
    }
}

export const promptLocomotionChoice = async (
    cpy: MenuModel,
    bal: MenuBit,
    ste?: State,
): Promise<MenuModel> => {
    const lib = resolveLibraryBus()
    const choices = VALID_LOCOMOTION_BASELINES.map(
        (b) => LOCOMOTION_PROFILES[b].label,
    )

    emitConsole(
        ste,
        '>> [LOCOMOTION:PROMPT] Launching baseline gait selector...',
    )

    let selectedLabel = choices[0]
    if (lib && typeof lib.hunt === 'function') {
        const gridBit: any = await lib.hunt(UPDATE_GRID, {
            x: 0,
            y: 4,
            xSpan: 4,
            ySpan: 11,
        })
        const choiceBit: any = await lib.hunt(OPEN_CHOICE, {
            dat: { clr0: 'black', clr1: 'cyan' },
            src: 'vertical',
            lst: [...choices, 'CANCEL'],
            net: gridBit?.grdBit?.dat,
        })
        selectedLabel = choiceBit?.chcBit?.src || choices[0]
    }

    if (selectedLabel === 'CANCEL' || !selectedLabel) {
        emitConsole(
            ste,
            '>> [LOCOMOTION:CANCELLED] Baseline selection aborted.',
        )
        if (bal?.slv) {
            bal.slv({ mnuBit: { idx: 'prompt-locomotion-cancel', val: 0 } })
        }
        return cpy
    }

    const rawBaselineKey = selectedLabel.split(' ')[0].trim() as any
    const profile = resolveLocomotionProfile(
        rawBaselineKey || 'bipedal_standard',
    )

    emitConsole(
        ste,
        `>> [LOCOMOTION UNIT] Baseline selected: ${profile.baseline}`,
    )
    emitConsole(
        ste,
        `>> [VELOCITY CAP] Max velocity: ${profile.max_velocity_bps} bps`,
    )
    emitConsole(
        ste,
        `>> [NEGATIVE MASK] Banned: ${JSON.stringify(profile.default_banned_verbs)}`,
    )
    if (profile.default_arms_bps === 0) {
        emitConsole(
            ste,
            '>> [ANATOMY] Upper-limb capacity clamped to 0 bps (availableArmsBps: 0).',
        )
    }
    emitConsole(ste, '>> [STATUS] Stage T_0 Physical Bounds Locked [OK]')

    cpy.activeSelection = 'PROMPT_LOCOMOTION_CHOICE'
    cpy.statusMessage = `Locomotion locked: ${profile.baseline}`

    if (bal?.slv) {
        bal.slv({
            mnuBit: {
                idx: 'prompt-locomotion-success',
                val: 1,
                src: profile.baseline,
                dat: { profile },
            },
        })
    }

    return cpy
}
