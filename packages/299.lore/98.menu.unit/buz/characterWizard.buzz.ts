import * as ActLoc from '../../19.locomotion.unit/locomotion.action.js'
import type { MenuModel } from '../menu.model.js'
import type MenuBit from '../fce/menu.bit.js'

const UPDATE_GRID = '[Grid action] Update Grid'
const UPDATE_CONSOLE = '[Console action] Update Console'
const OPEN_CHOICE = '[Open action] Open Choice'

export interface LocomotionChoiceResult {
    readonly baseline: string
    readonly maxVelocityBps: number
    readonly bannedVerbs: readonly string[]
    readonly availableArmsBps: number
    readonly cancelled: boolean
}

export const CANONICAL_LOCOMOTION_CHOICES = [
    'bipedal_standard (10,000 bps | 1.00x)',
    'bipedal_hunched (8,000 bps | 0.80x)',
    'limping (5,000 bps | 0.50x)',
    'neuropathy_shuffle (4,000 bps | 0.40x)',
    'quadrupedal (9,000 bps | 0.90x)',
    'slithering (3,500 bps | 0.35x)',
    'sessile (0 bps | 0.00x)',
    'brachiation (6,500 bps | 0.65x)',
    'heavy_grounded_slog (4,500 bps | 0.45x)',
    'CANCEL',
] as const

export const promptLocomotionChoice = async (
    cpy: MenuModel,
    bal: MenuBit,
    ste: any,
): Promise<LocomotionChoiceResult> => {
    const lib = (globalThis as any).LIBRARY

    // Headless environment bypass (Vitest / CLI runners)
    if (!lib || typeof lib.hunt !== 'function') {
        const headlessResult: LocomotionChoiceResult = {
            baseline: 'bipedal_hunched',
            maxVelocityBps: 8000,
            bannedVerbs: ['sprint', 'vault'],
            availableArmsBps: 20000,
            cancelled: false,
        }
        if (bal?.slv) {
            bal.slv({
                mnuBit: {
                    idx: 'locomotion-choice-headless',
                    dat: headlessResult,
                },
            })
        }
        return headlessResult
    }

    await lib.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: '>> [CHAR WIZARD: STEP 2] Select Anatomical Locomotion Baseline...',
    })

    // Position gait choice selector on 12x12 grid: x:0, y:4, w:4, h:11
    const gridBit = await lib.hunt(UPDATE_GRID, {
        x: 0,
        y: 4,
        xSpan: 4,
        ySpan: 11,
    })

    const choiceBit = await lib.hunt(OPEN_CHOICE, {
        dat: { clr0: 'black', clr1: 'cyan' },
        src: 'vertical',
        lst: [...CANONICAL_LOCOMOTION_CHOICES],
        net: gridBit?.grdBit?.dat,
    })

    const rawSelection: string | undefined = choiceBit?.chcBit?.src

    if (!rawSelection || rawSelection === 'CANCEL') {
        await lib.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: '>> [CHAR WIZARD] Locomotion baseline selection cancelled.',
        })
        const cancelResult: LocomotionChoiceResult = {
            baseline: 'bipedal_standard',
            maxVelocityBps: 10000,
            bannedVerbs: [],
            availableArmsBps: 20000,
            cancelled: true,
        }
        if (bal?.slv) {
            bal.slv({
                mnuBit: {
                    idx: 'locomotion-choice-cancelled',
                    dat: cancelResult,
                },
            })
        }
        return cancelResult
    }

    // Extract raw enum key from label: "neuropathy_shuffle (4,000 bps...)" -> "neuropathy_shuffle"
    const baselineKey = rawSelection.split(' ')[0].trim().toLowerCase()

    // Synchronously validate baseline across 19.locomotion.unit
    let valResponse: any = null
    if (ste && typeof ste.hunt === 'function') {
        valResponse = await ste.hunt(ActLoc.VALIDATE_LOCOMOTION, {
            idx: 'val-locomotion-prompt',
            dat: { baseline: baselineKey },
        })
    }

    const rawProfile = valResponse?.locomotionBit?.dat?.profile
    const maxVelocityBps =
        rawProfile?.max_velocity_bps ??
        rawProfile?.maxVelocityBps ??
        (baselineKey === 'limping'
            ? 5000
            : baselineKey === 'neuropathy_shuffle'
              ? 4000
              : 8000)
    const bannedVerbs: string[] =
        rawProfile?.default_banned_verbs ??
        rawProfile?.bannedVerbs ??
        (baselineKey === 'limping'
            ? ['sprint', 'vault', 'leap']
            : baselineKey === 'neuropathy_shuffle'
              ? ['dive', 'leap', 'rapid_stairs', 'sprint', 'vault']
              : ['sprint', 'vault'])

    const armsBps =
        baselineKey === 'sessile' || baselineKey === 'slithering'
            ? 0
            : (rawProfile?.default_arms_bps ??
              rawProfile?.availableArmsBps ??
              20000)

    const profile = {
        baseline: baselineKey,
        maxVelocityBps,
        bannedVerbs,
        availableArmsBps: armsBps,
    }

    // Stream pure 7-bit ASCII telemetry to cns00
    await lib.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: `>> [LOCOMOTION UNIT] Baseline selected: ${profile.baseline}`,
    })
    await lib.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: `>> [VELOCITY CAP] Max velocity: ${profile.maxVelocityBps.toLocaleString()} bps`,
    })
    const formattedBanned = profile.bannedVerbs
        .map((v: string) => `"${v}"`)
        .join(', ')
    await lib.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: `>> [NEGATIVE MASK] Banned: [${formattedBanned}]`,
    })
    if (armsBps === 0) {
        await lib.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: '>> [ANATOMICAL CLAMP] Limb capacity clamped to 0 bps (Non-Articulated Archetype)',
        })
    }
    await lib.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: '>> [STATUS] Stage T_0 Physical Bounds Locked [OK]',
    })

    const finalResult: LocomotionChoiceResult = {
        baseline: profile.baseline,
        maxVelocityBps: profile.maxVelocityBps,
        bannedVerbs: profile.bannedVerbs,
        availableArmsBps: armsBps,
        cancelled: false,
    }

    if (bal?.slv) {
        bal.slv({
            mnuBit: { idx: 'locomotion-choice-selected', dat: finalResult },
        })
    }

    return finalResult
}
