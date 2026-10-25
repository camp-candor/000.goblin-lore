/**
 * packages/299.lore/03.laws.unit/buz/lawsScaffold.buzz.ts
 * Interactive World Axiom Scaffolding Interview State Machine.
 * Sequences Blessed TUI modals, validates Clue-Lemma Disjointness,
 * and serializes Byte-0 Dual-Rail Markdown world axiom dossiers.
 * Strictly 7-bit ASCII. Zero emojis.
 */
import * as fs from 'node:fs'
import * as path from 'node:path'
import { LawsModel } from '../laws.model'
import type LawsScaffoldBit from '../fce/lawsScaffold.bit'
import type {
    WorldAxiomScaffoldResult,
    EpistemicHorizonEnum,
} from '../fce/lawsScaffold.bit'
import type State from '../../99.core/state'

const UPDATE_CONSOLE = '[Console action] Update Console'
const UPDATE_GRID = '[Grid action] Update Grid'
const OPEN_CHOICE = '[Open action] Open Choice'
const OPEN_INPUT = '[Open action] Open Input'

export const TEMPORAL_EPOCH_PRESETS = [
    'post_famine_consolidation',
    'the_great_chill',
    'culvert_excavation_era',
    'pre_floorboard_antiquity',
] as const

export const DOMAIN_CLASSIFICATION_PRESETS = [
    'PHYSICAL_METAPHYSICAL',
    'SOCIOLOGICAL_TABOO',
    'ECONOMIC_SCARCITY',
    'EPISTEMIC_MYSTERY',
] as const

export const EPISTEMIC_HORIZON_PRESETS: EpistemicHorizonEnum[] = [
    'TOTAL_IGNORANCE',
    'RUMOR_ONLY',
    'FALSE_BELIEF',
    'PARTIAL_FACT',
    'WITHHELD',
    'FACTUAL_WITNESS',
]

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
 * Validates Clue-Lemma Disjointness Theorem:
 * P_clues intersect (Union of forbidden conclusion trigger lemmas) == empty set
 */
export function validateClueLemmaDisjointness(
    clueTokens: string[],
    forbiddenLemmas: string[],
): { valid: boolean; intersectingTokens?: string[]; error?: string } {
    const normalizedLemmas = new Set(
        forbiddenLemmas.map((l) => l.trim().toLowerCase()).filter(Boolean),
    )

    const intersecting: string[] = []
    for (const token of clueTokens) {
        const cleanToken = token.trim().toLowerCase()

        let found = false
        for (const lemma of normalizedLemmas) {
            if (cleanToken.includes(lemma)) {
                found = true
                break
            }
        }
        if (found) {
            intersecting.push(token.trim())
        }
    }

    if (intersecting.length > 0) {
        return {
            valid: false,
            intersectingTokens: intersecting,
            error: `[CLUE_LEMMA_CONTAMINATION]: Permitted clue tokens intersect with forbidden conclusion lemmas: [${intersecting.join(', ')}]`,
        }
    }

    return { valid: true }
}

/**
 * Formats world axiom dossier Markdown strictly adhering to Byte-0 YAML delimiter law.
 */
export function renderWorldAxiomDossierMarkdown(data: {
    id: string
    name: string
    domain: string
    epoch: string
    dominantFactions: string[]
    axioms: string[]
    epistemicDefault: EpistemicHorizonEnum
    clueTokens: string[]
    forbiddenConclusionLemmas: string[]
}): string {
    const yamlLines = [
        '---',
        `id: ${data.id}`,
        `name: "${data.name}"`,
        'type: world',
        'status: active',
        `domain: ${data.domain}`,
        `epoch: ${data.epoch}`,
        'dominant_factions:',
        ...(data.dominantFactions.length > 0
            ? data.dominantFactions.map((f) => `  - ${f}`)
            : ['  - crawlspace_runners', '  - pipe_dwellers']),
        'axioms:',
        ...(data.axioms.length > 0
            ? data.axioms.map((a) => `  - "${a}"`)
            : [
                  '  - "Combustion open flame is strictly banned beneath floorboards."',
              ]),
        'epistemic_governance:',
        `  default_horizon: ${data.epistemicDefault}`,
        '  permitted_clue_tokens:',
        ...(data.clueTokens.length > 0
            ? data.clueTokens.map((c) => `    - "${c}"`)
            : [
                  '    - "smell of scorched zinc"',
                  '    - "missing tallow scraper"',
              ]),
        '  forbidden_conclusion_lemmas:',
        ...(data.forbiddenConclusionLemmas.length > 0
            ? data.forbiddenConclusionLemmas.map((l) => `    - "${l}"`)
            : ['    - "sabotage"', '    - "arson"']),
        '---',
        '',
        '## Metaphysical Laws',
        'Naturalistic crawlspace physics apply without exception. Magic systems do not exist.',
        'Scarcity of calories, heat, and clean water is absolute and irrecoverable.',
        '',
        '## Social Axioms',
        '- Upstairs humans are never spoken to, negotiated with, or acknowledged directly.',
        '- Possession of unrecorded iron scrap is punishable by forced shift rotation.',
        '- Silence during furnace cycling takes precedence over personal grievances.',
        '',
        '## Unresolved Mysteries',
        'The exact cause of the furnace valve seal blowout remains unratified.',
        'Characters under TOTAL_IGNORANCE may never reference tallow accumulation.',
        '',
    ]

    return yamlLines.join('\n')
}

/**
 * Writes dossier string atomically via .tmp scratch file and verifies Byte-0 offset.
 */
export function writeWorldAxiomDossierAtomic(
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
 * Master World Axiom Scaffolding Interview Wizard Buzzer.
 */
export const scaffoldWorldWizard = async (
    cpy: LawsModel,
    bal: LawsScaffoldBit,
    ste: State,
): Promise<LawsModel> => {
    const isHeadless = !(globalThis as any).LIBRARY && !ste?.hunt
    const rootDir = resolveRepoRoot()
    const seriesSlug = bal.dat?.seriesSlug || 'under-the-floorboards'
    const worldDir = path.join(rootDir, 'series', seriesSlug, 'world')

    await ste.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: '>> [SCAFFOLD:AXIOM] Initializing World Axiom Interview...',
    })

    // Step 1: Axiom Module Slug & Name Input
    let axiomId = bal.dat?.axiomId
    let axiomName = bal.dat?.name

    if (!axiomId && !isHeadless) {
        await ste.hunt(UPDATE_GRID, { x: 0, y: 4, xSpan: 4, ySpan: 6 })
        const idBit: any = await ste.hunt(OPEN_INPUT, {
            src: 'Enter Axiom Module ID (e.g. world_floorboard_physics):',
            dat: { val: 'world_' },
        })
        axiomId = idBit?.putBit?.src?.trim()
    }

    if (!axiomId || !/^world_[a-z0-9_]+$/.test(axiomId)) {
        axiomId = axiomId || 'world_macro_axioms'
        if (!/^world_[a-z0-9_]+$/.test(axiomId)) {
            axiomId = `world_${axiomId.replace(/[^a-z0-9_]/g, '_')}`
        }
    }

    if (!axiomName && !isHeadless) {
        const nameBit: any = await ste.hunt(OPEN_INPUT, {
            src: 'Enter Module Name (e.g. Floorboard Physical Invariants):',
            dat: { val: 'Physical Invariants' },
        })
        axiomName = nameBit?.putBit?.src?.trim() || 'Physical Invariants'
    } else {
        axiomName = axiomName || 'Physical Invariants'
    }

    await ste.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: `>> [IDENTITY] Bound: ${axiomId} ("${axiomName}")`,
    })

    // Step 2: Domain Classification
    let domain = bal.dat?.domain
    if (!domain && !isHeadless) {
        await ste.hunt(UPDATE_GRID, { x: 0, y: 4, xSpan: 4, ySpan: 8 })
        const domainBit: any = await ste.hunt(OPEN_CHOICE, {
            dat: { clr0: 'black', clr1: 'cyan' },
            src: 'vertical',
            lst: [...DOMAIN_CLASSIFICATION_PRESETS],
        })
        domain = (domainBit?.chcBit?.src as any) || 'PHYSICAL_METAPHYSICAL'
    } else {
        domain = domain || 'PHYSICAL_METAPHYSICAL'
    }

    await ste.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: `>> [DOMAIN] Classification: ${domain}`,
    })

    // Step 3: Temporal Epoch Selection
    let epoch = bal.dat?.epoch
    if (!epoch && !isHeadless) {
        const epochBit: any = await ste.hunt(OPEN_CHOICE, {
            dat: { clr0: 'black', clr1: 'yellow' },
            src: 'vertical',
            lst: [...TEMPORAL_EPOCH_PRESETS],
        })
        epoch = epochBit?.chcBit?.src || 'post_famine_consolidation'
    } else {
        epoch = epoch || 'post_famine_consolidation'
    }

    await ste.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: `>> [EPOCH] Temporal Period: ${epoch}`,
    })

    // Step 4: Factions & Core Invariant Axioms
    let dominantFactions = bal.dat?.dominantFactions || [
        'crawlspace_runners',
        'pipe_dwellers',
    ]
    let axioms = bal.dat?.axioms || [
        'Combustion open flame is strictly banned beneath floorboards.',
        'Upstairs humans are never addressed or approached directly.',
    ]

    if (!bal.dat?.axioms && !isHeadless) {
        const axiomBit: any = await ste.hunt(OPEN_INPUT, {
            src: 'Enter Primary Invariant Axiom (Negative Rule):',
            dat: {
                val: 'Combustion open flame is strictly banned beneath floorboards.',
            },
        })
        const val = axiomBit?.putBit?.src?.trim()
        if (val) axioms = [val]
    }

    // Step 5: Epistemic Horizon & Clue-Lemma Disjointness Gate
    let epistemicDefault = bal.dat?.epistemicDefault || 'TOTAL_IGNORANCE'
    let clueTokens = bal.dat?.clueTokens || [
        'smell of scorched zinc',
        'missing tallow scraper',
    ]
    let forbiddenLemmas = bal.dat?.forbiddenConclusionLemmas || [
        'sabotage',
        'arson',
    ]

    // Check Clue-Lemma Disjointness
    const disjointCheck = validateClueLemmaDisjointness(
        clueTokens,
        forbiddenLemmas,
    )
    if (!disjointCheck.valid) {
        await ste.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: `>> [FAIL] ${disjointCheck.error}`,
        })

        // Auto-remediate by scrubbing contaminated clue tokens
        const contaminatedSet = new Set(
            disjointCheck.intersectingTokens?.map((t) => t.toLowerCase()) || [],
        )
        clueTokens = clueTokens.filter(
            (t) => !contaminatedSet.has(t.toLowerCase()),
        )

        await ste.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: `>> [REPAIR] Scrubbed contaminated clue tokens to preserve Clue-Lemma Disjointness [OK]`,
        })
    } else {
        await ste.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: '>> [EPISTEMIC] Clue-Lemma Disjointness Verified: P_clues n T_lemmas == 0 [OK]',
        })
    }

    // Step 6: Render Dossier & Atomic POSIX Write
    const destPath = path.join(worldDir, `${axiomId}.md`)
    const dossierMarkdown = renderWorldAxiomDossierMarkdown({
        id: axiomId,
        name: axiomName,
        domain,
        epoch,
        dominantFactions,
        axioms,
        epistemicDefault,
        clueTokens,
        forbiddenConclusionLemmas: forbiddenLemmas,
    })

    try {
        writeWorldAxiomDossierAtomic(destPath, dossierMarkdown)
        await ste.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: `>> [SEALED] World axiom '${axiomId}' written to disk at Byte 0 [OK]`,
        })

        const res: WorldAxiomScaffoldResult = {
            success: true,
            filePath: destPath,
            axiomId,
            epoch,
            axiomsCount: axioms.length,
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
