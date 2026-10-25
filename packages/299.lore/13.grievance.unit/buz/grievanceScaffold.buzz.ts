/**
 * packages/299.lore/13.grievance.unit/buz/grievanceScaffold.buzz.ts
 * Interactive Grievance Scaffolding Interview State Machine.
 * Sequences Blessed TUI modals, validates Anti-Reflexivity and Farce Contracts,
 * and serializes Byte-0 Dual-Rail Markdown grievance spring dossiers.
 * Strictly 7-bit ASCII. Zero emojis.
 */
import * as fs from 'node:fs'
import * as path from 'node:path'
import { GrievanceModel } from '../grievance.model'
import type GrievanceScaffoldBit from '../fce/grievanceScaffold.bit'
import type {
    GrievanceScaffoldResult,
    TypedSpawnTarget,
} from '../fce/grievanceScaffold.bit'
import type State from '../../99.core/state'

const UPDATE_CONSOLE = '[Console action] Update Console'
const UPDATE_GRID = '[Grid action] Update Grid'
const OPEN_CHOICE = '[Open action] Open Choice'
const OPEN_INPUT = '[Open action] Open Input'

export const CANONICAL_GRIEVANCE_CATEGORIES = [
    'resource_hoarding',
    'status_anxiety',
    'secret_keeping',
    'generational_rift',
    'territorial_boundary',
    'loyalty_tests',
    'domestic_sabotage',
] as const

export const DECAY_RATE_PRESETS = ['slow', 'medium', 'fast', 'none'] as const

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
 * Validates participant dyad anti-reflexivity law (Actor A != Actor B).
 */
export function validateParticipantDyad(actors: string[]): {
    valid: boolean
    sortedTuple?: [string, string]
    error?: string
} {
    const filtered = actors.map((a) => a.trim()).filter(Boolean)
    if (filtered.length !== 2) {
        return {
            valid: false,
            error: `Grievance dyad requires exactly 2 primary participants. Received: ${filtered.length}`,
        }
    }

    if (filtered[0] === filtered[1]) {
        return {
            valid: false,
            error: `[SELF_GRIEVANCE_BREACH]: Participant cannot hold a grievance against themselves (${filtered[0]})`,
        }
    }

    // Deterministic lexicographical sort
    const sorted: [string, string] =
        filtered[0].localeCompare(filtered[1]) < 0
            ? [filtered[0], filtered[1]]
            : [filtered[1], filtered[0]]

    return { valid: true, sortedTuple: sorted }
}

/**
 * Formats grievance spring dossier Markdown strictly adhering to Byte-0 YAML delimiter law.
 */
export function renderGrievanceDossierMarkdown(data: {
    id: string
    title: string
    category: string
    participantsPrimary: [string, string]
    participantsCanInvolve: string[]
    participantsCannotInvolve: string[]
    intensityFloor: number
    intensityCeiling: number
    cooldownCycles: number
    decayRate: string
    tonalOverrideEligible: boolean
    physicalAnchorProp?: string
    spawnsOnMaxEscalation?: TypedSpawnTarget | null
}): string {
    const yamlLines = [
        '---',
        `id: ${data.id}`,
        `title: "${data.title}"`,
        'type: grievance',
        'status: active',
        `category: ${data.category}`,
        'participants_primary:',
        `  - ${data.participantsPrimary[0]}`,
        `  - ${data.participantsPrimary[1]}`,
        'participants_can_involve:',
        ...(data.participantsCanInvolve.length > 0
            ? data.participantsCanInvolve.map((p) => `  - ${p}`)
            : []),
        'participants_cannot_involve:',
        ...(data.participantsCannotInvolve.length > 0
            ? data.participantsCannotInvolve.map((p) => `  - ${p}`)
            : []),
        `intensity_floor: ${data.intensityFloor}`,
        `intensity_ceiling: ${data.intensityCeiling}`,
        `cooldown_cycles: ${data.cooldownCycles}`,
        `decay_rate: ${data.decayRate}`,
        `tonal_override_eligible: ${data.tonalOverrideEligible}`,
        data.physicalAnchorProp
            ? `physical_anchor_prop: ${data.physicalAnchorProp}`
            : 'physical_anchor_prop: null',
        'spawns_on_max_escalation:',
        data.spawnsOnMaxEscalation
            ? [
                  `  type: ${data.spawnsOnMaxEscalation.type}`,
                  `  target_id: ${data.spawnsOnMaxEscalation.target_id}`,
              ].join('\n')
            : '  null',
        'outcomes:',
        '  clean_win: "Dominant victory: opponent yields immediate possession and takes humiliation."',
        '  costly_win: "Victor secures immediate demand but expends social leverage or takes physical strain."',
        '  mutual_wound: "Symmetrical escalation: both parties suffer condition debuffs and intensity rises."',
        '  backfire: "Catastrophic collapse: initiator loses claim and surrenders active Strings."',
        '---',
        '',
        '## Surface Complaint',
        data.tonalOverrideEligible
            ? 'A completely trivial squabble over scrap placement or minor debris custom.'
            : 'Who left uncleaned tallow and grease across the joint fittings before the shift rotation.',
        '',
        '## The Underneath',
        data.tonalOverrideEligible
            ? "There genuinely isn't one. This is the point."
            : 'Terror that failing physical stamina will expose unworthiness and prompt banishment.',
        '',
        '## Escalation Path',
        '1. Passive-aggressive commentary during routine maintenance.',
        '2. Direct verbal confrontation challenging scrap accounting.',
        '3. Personal ultimatum threatening physical eviction or withholding rations.',
        '4. Violent confrontation risking upstairs auditory detection.',
        '',
        '## Callback Phrases',
        '- "credit where it belongs"',
        '- "who pulled it through"',
        '- "earned territory"',
        '',
    ]

    return yamlLines.join('\n')
}

/**
 * Writes dossier string atomically via .tmp scratch file and verifies Byte-0 offset.
 */
export function writeGrievanceDossierAtomic(
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
 * Master Grievance Scaffolding Interview Wizard Buzzer.
 */
export const scaffoldGrievanceWizard = async (
    cpy: GrievanceModel,
    bal: GrievanceScaffoldBit,
    ste: State,
): Promise<GrievanceModel> => {
    const isHeadless = !(globalThis as any).LIBRARY && !ste?.hunt
    const rootDir = resolveRepoRoot()
    const seriesSlug = bal.dat?.seriesSlug || 'under-the-floorboards'
    const grievancesDir = path.join(rootDir, 'series', seriesSlug, 'grievances')

    await ste.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: '>> [SCAFFOLD:GRV] Initializing Interpersonal Grievance Interview...',
    })

    // Step 1: Grievance Slug & Title
    let grvId = bal.dat?.grvId
    let title = bal.dat?.title

    if (!grvId && !isHeadless) {
        await ste.hunt(UPDATE_GRID, { x: 0, y: 4, w: 4, h: 6 })
        const idBit: any = await ste.hunt(OPEN_INPUT, {
            src: 'Enter Grievance ID (e.g. grv_silver_spoon_grease):',
            dat: { val: 'grv_' },
        })
        grvId = idBit?.putBit?.src?.trim()
    }

    if (!grvId || !/^grv_[a-z0-9_]+$/.test(grvId)) {
        grvId = grvId || 'grv_new_dispute'
        if (!/^grv_[a-z0-9_]+$/.test(grvId)) {
            grvId = `grv_${grvId.replace(/[^a-z0-9_]/g, '_')}`
        }
    }

    if (!title && !isHeadless) {
        const titleBit: any = await ste.hunt(OPEN_INPUT, {
            src: 'Enter Display Title (e.g. The Good Silver Spoon):',
            dat: { val: 'Dispute' },
        })
        title = titleBit?.putBit?.src?.trim() || 'Dispute'
    } else {
        title = title || 'Dispute'
    }

    await ste.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: `>> [IDENTITY] Bound: ${grvId} ("${title}")`,
    })

    // Step 2: Thematic Category Selection
    let category = bal.dat?.category
    if (!category && !isHeadless) {
        await ste.hunt(UPDATE_GRID, { x: 0, y: 4, w: 4, h: 8 })
        const catBit: any = await ste.hunt(OPEN_CHOICE, {
            dat: { clr0: 'black', clr1: 'yellow' },
            src: 'vertical',
            lst: [...CANONICAL_GRIEVANCE_CATEGORIES],
        })
        category = catBit?.chcBit?.src || 'resource_hoarding'
    } else {
        category = category || 'resource_hoarding'
    }

    await ste.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: `>> [CATEGORY] Theme: ${category}`,
    })

    // Step 3: Participant Dyad Allocation & Anti-Reflexivity Gate
    let participantsPrimary = bal.dat?.participantsPrimary
    if (!participantsPrimary && !isHeadless) {
        const partBit: any = await ste.hunt(OPEN_INPUT, {
            src: 'Enter 2 Primary Characters (comma-separated):',
            dat: { val: 'char_bog, char_spleen' },
        })
        const rawParts = partBit?.putBit?.src?.split(',') || []
        const validation = validateParticipantDyad(rawParts)
        if (!validation.valid) {
            await ste.hunt(UPDATE_CONSOLE, {
                idx: 'cns00',
                src: `>> [FAIL] ${validation.error}`,
            })
            participantsPrimary = ['char_bog', 'char_spleen']
        } else {
            participantsPrimary = validation.sortedTuple!
        }
    } else if (!participantsPrimary) {
        participantsPrimary = ['char_bog', 'char_spleen']
    }

    const dyadCheck = validateParticipantDyad(participantsPrimary)
    if (!dyadCheck.valid) {
        const fallback: [string, string] = ['char_actor_a', 'char_actor_b']
        participantsPrimary = fallback
        await ste.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: `>> [REPAIR] Self-grievance rejected; reset to ${participantsPrimary.join(' vs ')}`,
        })
    } else {
        participantsPrimary = dyadCheck.sortedTuple!
    }

    await ste.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: `>> [DYAD] Disputants: ${participantsPrimary[0]} <-> ${participantsPrimary[1]} [OK]`,
    })

    // Step 4: Tonal Farce Governor & Intensity Envelope
    let tonalOverride = bal.dat?.tonalOverrideEligible === true
    let intensityFloor = bal.dat?.intensityFloor || 1
    let intensityCeiling = bal.dat?.intensityCeiling || (tonalOverride ? 2 : 4)
    const cooldownCycles = bal.dat?.cooldownCycles || 3
    const decayRate = bal.dat?.decayRate || 'slow'

    if (tonalOverride) {
        intensityFloor = 1
        intensityCeiling = Math.min(2, intensityCeiling)
        await ste.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: '>> [FARCE] Tonal override active: ceiling clamped to 2, spawn cleared.',
        })
    } else {
        intensityFloor = Math.max(1, Math.min(intensityFloor, 5))
        intensityCeiling = Math.max(
            intensityFloor,
            Math.min(intensityCeiling, 5),
        )
    }

    // Step 5: Downstream Escalation Spawn & Physical Anchor Prop
    let spawnsOnMaxEscalation = tonalOverride
        ? null
        : bal.dat?.spawnsOnMaxEscalation || null
    const physicalAnchorProp = bal.dat?.physicalAnchorProp

    if (spawnsOnMaxEscalation) {
        await ste.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: `>> [SPAWN] Max Escalation Target: ${spawnsOnMaxEscalation.type}:${spawnsOnMaxEscalation.target_id}`,
        })
    }

    // Step 6: Render Dossier & Atomic POSIX Write
    const destPath = path.join(grievancesDir, `${grvId}.md`)
    const dossierMarkdown = renderGrievanceDossierMarkdown({
        id: grvId,
        title,
        category,
        participantsPrimary,
        participantsCanInvolve: bal.dat?.participantsCanInvolve || [],
        participantsCannotInvolve: bal.dat?.participantsCannotInvolve || [],
        intensityFloor,
        intensityCeiling,
        cooldownCycles,
        decayRate,
        tonalOverrideEligible: tonalOverride,
        physicalAnchorProp,
        spawnsOnMaxEscalation,
    })

    try {
        writeGrievanceDossierAtomic(destPath, dossierMarkdown)
        await ste.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: `>> [SEALED] Grievance '${grvId}' written to disk at Byte 0 [OK]`,
        })

        const res: GrievanceScaffoldResult = {
            success: true,
            filePath: destPath,
            grvId,
            category,
            participants: participantsPrimary,
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
