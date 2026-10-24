/**
 * packages/299.lore/02.character.unit/buz/characterScaffold.buzz.ts
 * Interactive Character Scaffolding Interview State Machine.
 * Sequences Blessed TUI prompts, evaluates Hand Capacity SAT at T0,
 * and serializes Byte-0 Dual-Rail Markdown character dossiers.
 * Strictly 7-bit ASCII. Zero emojis.
 */
import * as fs from 'node:fs'
import * as path from 'node:path'
import { CharacterModel } from '../character.model.js'
import type CharacterScaffoldBit from '../fce/characterScaffold.bit.js'
import type { CharacterScaffoldResult } from '../fce/characterScaffold.bit.js'
import type State from '../../99.core/state.js'

const UPDATE_CONSOLE = '[Console action] Update Console'
const UPDATE_GRID = '[Grid action] Update Grid'
const OPEN_CHOICE = '[Open action] Open Choice'
const OPEN_INPUT = '[Open action] Open Input'

export interface LocomotionProfile {
    baseline: string
    velocityBps: number
    defaultArmsBps: number
    bannedVerbs: string[]
}

export const LOCOMOTION_PROFILES: Record<string, LocomotionProfile> = {
    bipedal_standard: {
        baseline: 'bipedal_standard',
        velocityBps: 10000,
        defaultArmsBps: 20000,
        bannedVerbs: [],
    },
    bipedal_hunched: {
        baseline: 'bipedal_hunched',
        velocityBps: 8000,
        defaultArmsBps: 20000,
        bannedVerbs: ['vault'],
    },
    limping: {
        baseline: 'limping',
        velocityBps: 5000,
        defaultArmsBps: 20000,
        bannedVerbs: ['leap', 'scramble', 'sprint', 'vault'],
    },
    neuropathy_shuffle: {
        baseline: 'neuropathy_shuffle',
        velocityBps: 4000,
        defaultArmsBps: 20000,
        bannedVerbs: ['dive', 'leap', 'rapid_stairs', 'sprint', 'vault'],
    },
    quadrupedal: {
        baseline: 'quadrupedal',
        velocityBps: 9000,
        defaultArmsBps: 0,
        bannedVerbs: ['bimanual_lift', 'dual_wield', 'sprint'],
    },
    slithering: {
        baseline: 'slithering',
        velocityBps: 3500,
        defaultArmsBps: 0,
        bannedVerbs: ['dive', 'leap', 'sprint', 'vault', 'bimanual_lift'],
    },
    sessile: {
        baseline: 'sessile',
        velocityBps: 0,
        defaultArmsBps: 0,
        bannedVerbs: ['walk', 'run', 'sprint', 'leap', 'vault', 'crawl'],
    },
}

export interface TraumaConditionProfile {
    id: string
    armPenaltyBps: number
    bannedVerbs: string[]
}

export const TRAUMA_CONDITIONS: Record<string, TraumaConditionProfile> = {
    NONE: { id: 'NONE', armPenaltyBps: 0, bannedVerbs: [] },
    BRACHIAL_PLEXUS_RIGHT: {
        id: 'BRACHIAL_PLEXUS_RIGHT',
        armPenaltyBps: 10000,
        bannedVerbs: ['bimanual_lift', 'two_handed_strike'],
    },
    SEVERED_LEFT_ARM: {
        id: 'SEVERED_LEFT_ARM',
        armPenaltyBps: 10000,
        bannedVerbs: ['bimanual_lift', 'two_handed_strike', 'catch_two_handed'],
    },
    FRACTURED_COLLARBONE: {
        id: 'FRACTURED_COLLARBONE',
        armPenaltyBps: 5000,
        bannedVerbs: ['heavy_overhead_lift'],
    },
}

/**
 * Resolves repository root by walking upward from current working directory.
 */
export function resolveRepoRoot(): string {
    let curr = process.cwd()
    for (let i = 0; i < 6; i++) {
        if (
            fs.existsSync(path.join(curr, 'series')) ||
            fs.existsSync(path.join(curr, 'packages'))
        ) {
            return curr
        }
        const parent = path.dirname(curr)
        if (parent === curr) break
        curr = parent
    }
    return process.cwd()
}

/**
 * Evaluates Hand Saturation SAT: verifies occupied hand capacity does not exceed available arms.
 */
export function evaluateHandCapacitySAT(
    heldItemHandsBps: number[],
    availableArmsBps: number,
): { passed: boolean; demandedBps: number; availableBps: number } {
    const demandedBps = heldItemHandsBps.reduce((acc, val) => acc + val, 0)
    return {
        passed: demandedBps <= availableArmsBps,
        demandedBps,
        availableBps: availableArmsBps,
    }
}

/**
 * Formats character dossier Markdown strictly adhering to Byte-0 YAML delimiter law.
 */
export function renderCharacterDossierMarkdown(data: {
    id: string
    name: string
    locomotionBaseline: string
    bannedVerbs: string[]
    conditions: string[]
    availableArmsBps: number
    heldItems: string[]
    escalationCeiling: number
    stringsHeldOver: string[]
}): string {
    const yamlLines = [
        '---',
        `id: ${data.id}`,
        `name: "${data.name}"`,
        'type: character',
        'historical_reference: false',
        'status: active',
        'somatic:',
        `  locomotion_baseline: ${data.locomotionBaseline}`,
        `  available_arms_bps: ${data.availableArmsBps}`,
        '  banned_kinetic_verbs:',
        ...(data.bannedVerbs.length > 0
            ? data.bannedVerbs.map((v) => `    - ${v}`)
            : ['    - none']),
        '  conditions:',
        ...(data.conditions.length > 0
            ? data.conditions.map((c) => `    - ${c}`)
            : ['    - NONE']),
        '  signature_tics:',
        '    - "pauses and recalibrates posture before responding"',
        'logistical:',
        '  worn: []',
        '  held:',
        ...(data.heldItems.length > 0
            ? data.heldItems.map((h) => `    - ${h}`)
            : []),
        '  carried: []',
        '  cached: []',
        'epistemic:',
        `  escalation_ceiling: ${data.escalationCeiling}`,
        '  strings_held_over:',
        ...(data.stringsHeldOver.length > 0
            ? data.stringsHeldOver.map((s) => `    - ${s}`)
            : []),
        '  leverage_strings: {}',
        '  relationship_defaults: {}',
        '---',
        '',
        '## Wants (surface)',
        'Secure immediate scrap tallies and avoid upstairs attention.',
        '',
        '## Wants (actual)',
        'Establish permanent security near the warm pipe seam without owing concessions.',
        '',
        '## Blind spot',
        'Assumes total compliance shields the body from structural decay.',
        '',
        '## Voice notes',
        'Direct monosyllabic phrasing. Short rhythmic cadences. Zero modern colloquialisms.',
        '',
    ]

    return yamlLines.join('\n')
}

/**
 * Writes dossier string atomically via .tmp scratch file and verifies Byte-0 offset.
 */
export function writeCharacterDossierAtomic(
    targetPath: string,
    content: string,
): void {
    const dir = path.dirname(targetPath)
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
    }

    const tmpPath = `${targetPath}.tmp_${Date.now()}`
    fs.writeFileSync(tmpPath, content, 'utf8')

    // Verify Byte 0 invariant
    const buf = fs.readFileSync(tmpPath)
    if (
        buf.length < 3 ||
        buf[0] !== 0x2d ||
        buf[1] !== 0x2d ||
        buf[2] !== 0x2d
    ) {
        if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath)
        throw new Error(
            '[BYTE_ZERO_BREACH]: Serialized file does not begin with --- at offset 0',
        )
    }

    fs.renameSync(tmpPath, targetPath)
}

/**
 * Master Scaffolding Interview Wizard Buzzer.
 */
export const scaffoldCharacterWizard = async (
    cpy: CharacterModel,
    bal: CharacterScaffoldBit,
    ste: State,
): Promise<CharacterModel> => {
    const isHeadless = !(globalThis as any).LIBRARY && !ste?.hunt
    const rootDir = resolveRepoRoot()
    const seriesSlug = bal.dat?.seriesSlug || 'under-the-floorboards'

    await ste.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: '>> [SCAFFOLD:CHAR] Initializing Character Vector Interview...',
    })

    // Step 1: Character Slug & Name Input
    let charId = bal.dat?.charId
    let charName = bal.dat?.name

    if (!charId && !isHeadless) {
        await ste.hunt(UPDATE_GRID, { x: 0, y: 4, xSpan: 4, ySpan: 6 })
        const idBit: any = await ste.hunt(OPEN_INPUT, {
            src: 'Enter Character ID (e.g. char_wart):',
            dat: { val: 'char_' },
        })
        charId = idBit?.putBit?.src?.trim()
    }

    if (!charId || !/^char_[a-z0-9_]+$/.test(charId)) {
        charId = charId || 'char_new_actor'
        if (!/^char_[a-z0-9_]+$/.test(charId)) {
            charId = `char_${charId.replace(/[^a-z0-9_]/g, '_')}`
        }
    }

    if (!charName && !isHeadless) {
        const nameBit: any = await ste.hunt(OPEN_INPUT, {
            src: 'Enter Display Name (e.g. Wart):',
            dat: { val: 'Actor' },
        })
        charName = nameBit?.putBit?.src?.trim() || 'Actor'
    } else {
        charName = charName || 'Actor'
    }

    await ste.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: `>> [IDENTITY] Bound: ${charId} ("${charName}")`,
    })

    // Step 2: Locomotion Baseline Selection
    let baselineKey = bal.dat?.locomotionBaseline || 'bipedal_hunched'
    if (!bal.dat?.locomotionBaseline && !isHeadless) {
        await ste.hunt(UPDATE_GRID, { x: 0, y: 4, xSpan: 4, ySpan: 8 })
        const choiceBit: any = await ste.hunt(OPEN_CHOICE, {
            dat: { clr0: 'black', clr1: 'cyan' },
            src: 'vertical',
            lst: Object.keys(LOCOMOTION_PROFILES),
        })
        baselineKey = choiceBit?.chcBit?.src || 'bipedal_hunched'
    }

    const locoProfile =
        LOCOMOTION_PROFILES[baselineKey] || LOCOMOTION_PROFILES.bipedal_hunched
    let availableArmsBps = locoProfile.defaultArmsBps
    const bannedVerbs = [...locoProfile.bannedVerbs]

    await ste.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: `>> [LOCOMOTION] Baseline: ${locoProfile.baseline} | Vel: ${locoProfile.velocityBps} bps`,
    })

    // Step 3: Somatic Trauma / Conditions
    let conditionKey = bal.dat?.traumaCondition || 'NONE'
    if (!bal.dat?.traumaCondition && !isHeadless) {
        const traumaBit: any = await ste.hunt(OPEN_CHOICE, {
            dat: { clr0: 'black', clr1: 'yellow' },
            src: 'vertical',
            lst: Object.keys(TRAUMA_CONDITIONS),
        })
        conditionKey = traumaBit?.chcBit?.src || 'NONE'
    }

    const traumaProfile =
        TRAUMA_CONDITIONS[conditionKey] || TRAUMA_CONDITIONS.NONE
    availableArmsBps = Math.max(
        0,
        availableArmsBps - traumaProfile.armPenaltyBps,
    )
    for (const v of traumaProfile.bannedVerbs) {
        if (!bannedVerbs.includes(v)) bannedVerbs.push(v)
    }

    await ste.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: `>> [SOMATIC] Condition: ${traumaProfile.id} | Available Arms: ${availableArmsBps} bps`,
    })

    // Step 4: Equipment Loadout & Pre-Flight SAT Verification Gate
    let heldItems = bal.dat?.heldItemIds || []
    let heldItemHandsBps = heldItems.map(() => 10000) // Standard 1-hand default

    // SAT Check Gate
    let sat = evaluateHandCapacitySAT(heldItemHandsBps, availableArmsBps)
    if (!sat.passed) {
        await ste.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: `>> [FAIL] [CAPABILITY ERROR]: Limb capacity exceeded. Demanded: ${sat.demandedBps} bps > Available: ${sat.availableBps} bps`,
        })

        // In interactive mode, clamp loadout to fit available arms
        const maxItems = Math.floor(availableArmsBps / 10000)
        heldItems = heldItems.slice(0, maxItems)
        heldItemHandsBps = heldItems.map(() => 10000)
        sat = evaluateHandCapacitySAT(heldItemHandsBps, availableArmsBps)

        await ste.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: `>> [REPAIR] Held loadout clamped to ${heldItems.length} items to satisfy Hand Capacity SAT.`,
        })
    } else {
        await ste.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: `>> [SAT:PASS] Hand Capacity Invariant Satisfied: ${sat.demandedBps} <= ${sat.availableBps} bps [OK]`,
        })
    }

    // Step 5: Escalation Ceiling & Strings
    const escalationCeiling = bal.dat?.escalationCeiling || 3
    const stringsHeldOver = bal.dat?.stringsHeldOver || []

    // Step 6: Render Dossier & Atomic POSIX Write
    const dossierMarkdown = renderCharacterDossierMarkdown({
        id: charId,
        name: charName,
        locomotionBaseline: locoProfile.baseline,
        bannedVerbs,
        conditions: traumaProfile.id !== 'NONE' ? [traumaProfile.id] : [],
        availableArmsBps,
        heldItems,
        escalationCeiling,
        stringsHeldOver,
    })

    const destPath = path.join(
        rootDir,
        'series',
        seriesSlug,
        'characters',
        `${charId}.md`,
    )

    try {
        writeCharacterDossierAtomic(destPath, dossierMarkdown)
        await ste.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: `>> [SEALED] Character '${charId}' written to disk at Byte 0 [OK]`,
        })

        const res: CharacterScaffoldResult = {
            success: true,
            filePath: destPath,
            charId,
            availableArmsBps,
            bannedVerbs,
        }
        if (bal.slv) bal.slv(res)
    } catch (err: any) {
        await ste.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: `:: [ERROR] Write failure: ${err.message}`,
        })
        if (bal.slv) bal.slv({ success: false, error: err.message })
    }

    return cpy
}
