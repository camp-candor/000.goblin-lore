/**
 * packages/299.lore/98.menu.unit/buz/18.series.tree.audit.buzz.ts
 *
 * Series tree directory scaffolding audit buzzer. Exercises the REAL
 * 29.series.unit scaffoldSeriesTree gauntlet inside a hermetic temporary
 * repository: namespace vacancy check, 8-subdirectory provisioning, empty
 * ontology/unresolved.json init, atomic series.config.json commit, plus a
 * fail-closed collision re-probe. Streams pure 7-bit ASCII telemetry into
 * the cns00 Blessed console pane. Never touches the live repo tree.
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { scaffoldSeriesTree } from '../../29.series.unit/buz/scaffoldSeriesTree.buzz.js'
import {
    SeriesConfigSchema,
    type SeriesConfig,
} from '../../29.series.unit/fce/series.schema.js'
import { SeriesModel } from '../../29.series.unit/series.model.js'

export const SERIES_TREE_MENU_LABEL = '[ 6. SERIES TREE SCAFFOLDING ]'

export const SERIES_TREE_AUDIT_HEADER =
    '--- [299.LORE :: 29.SERIES.UNIT :: SERIES TREE DIRECTORY SCAFFOLDING] ---'

export const SERIES_TREE_INPUT_LINE =
    '>> [TREE:INPUT] Validating Universal 4-Tuple configuration...'

export const SERIES_TREE_CHECK_LINE =
    '>> [TREE:CHECK] Inspecting series/ and compiled/ namespace vacancy...'

export const SERIES_TREE_SCAFFOLD_LINE =
    '>> [TREE:SCAFFOLD] Provisioning 8 hermetic domain subdirectories...'

export const SERIES_TREE_INIT_LINE =
    '>> [TREE:INIT] Initializing ontology/unresolved.json with empty array...'

export const SERIES_TREE_CONFIG_LINE =
    '>> [TREE:CONFIG] Atomic POSIX commit of series.config.json completed.'

export const SERIES_TREE_SEALED_FOOTER =
    '--- [AUDIT COMPLETE: SERIES WORKSPACE SEALED AT T0 = $0.00] ---'

const SCAFFOLD_SUBDIRECTORIES = [
    'characters',
    'characters/_retired',
    'locations',
    'possessions',
    'grievances',
    'grievances/_retired',
    'ontology',
    'world',
]

const PROBE_SLUG = 'audit-scaffold-probe'

const CANONICAL_SCAFFOLD_CONFIG: SeriesConfig = {
    schema_version: '1.0.0',
    series_slug: PROBE_SLUG,
    display_name: 'Audit Scaffold Probe',
    genre_tag: 'LOW_FANTASY_FARCE',
    central_irony:
        'Goblins auditing empty shelves while guarding vaults of nothing.',
    state_space: {
        scarcity_index_bp: 8000,
        paranoia_baseline_bp: 6000,
        somatic_fatigue_enabled: true,
        epistemic_ignorance_enabled: true,
        gram_mass_tiers: {
            scrap_max_grams: 50,
            weight_max_grams: 5000,
            bulk_min_grams: 5001,
        },
    },
    action_vocabulary: {
        permitted_kinetic_verbs: ['LIMP', 'SIPHON'],
        forbidden_verbs_global: ['fly'],
        locomotion_taxonomies: ['BIPEDAL_HUNCHED'],
    },
    invariant_rules: {
        max_farce_ratio_bp: 1500,
        min_grievance_depth_delta: 1,
        global_acoustic_floor_cdb: 1500,
        voiceover_ducking_db: -14,
        min_normalized_category_entropy_bp: 7000,
        thematic_categories: ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7'],
    },
    medium_projections: {
        target_fps: 24,
        audio_sample_rate_hz: 48000,
        tts_service_port: 8000,
        video_service_port: 8188,
        aspect_ratio: '16:9',
    },
}

export interface SeriesTreeScaffoldAudit {
    inputSealed: boolean
    vacancyConfirmed: boolean
    scaffoldSealed: boolean
    initSealed: boolean
    configSealed: boolean
    collisionTrapped: boolean
    valid: boolean
    errors: string[]
}

/**
 * Runs the REAL Phase 5 scaffolding gauntlet against the live
 * scaffoldSeriesTree buzzer inside a hermetic temp repo root. Verifies
 * every audited stage independently, then re-probes the same namespace
 * to prove the CONFLICT_BLOCKED collision guard holds. Never throws;
 * reports breaches via errors. Always removes the temp repo.
 */
export async function auditSeriesTreeScaffold(): Promise<SeriesTreeScaffoldAudit> {
    const errors: string[] = []
    let inputSealed = false
    let vacancyConfirmed = false
    let scaffoldSealed = false
    let initSealed = false
    let configSealed = false
    let collisionTrapped = false

    // [TREE:INPUT] Canonical 4-tuple must seal against the live schema.
    const parsed = SeriesConfigSchema.safeParse(CANONICAL_SCAFFOLD_CONFIG)
    inputSealed = parsed.success
    if (!inputSealed) {
        errors.push(
            '[TREE:BREACH] canonical scaffold config rejected by live SeriesConfigSchema.',
        )
    }

    const tempRepo = fs.mkdtempSync(
        path.join(os.tmpdir(), 'goblin-series-tree-audit-'),
    )
    try {
        const seriesDir = path.join(tempRepo, 'series', PROBE_SLUG)
        const compiledDir = path.join(tempRepo, 'compiled', PROBE_SLUG)

        // [TREE:CHECK] Fresh hermetic repo must present vacant namespaces.
        vacancyConfirmed =
            !fs.existsSync(seriesDir) && !fs.existsSync(compiledDir)
        if (!vacancyConfirmed) {
            errors.push(
                '[TREE:BREACH] probe namespace occupied before scaffold.',
            )
        }

        // [TREE:SCAFFOLD] Run the real buzzer; require val: 1 + full topology.
        const model = new SeriesModel()
        let result: any = null
        await scaffoldSeriesTree(model, {
            idx: 'series-tree-audit',
            dat: {
                seriesSlug: PROBE_SLUG,
                config: CANONICAL_SCAFFOLD_CONFIG,
                repoRoot: tempRepo,
            },
            slv: (res: any) => {
                result = res
            },
        } as any)

        const topologyOk =
            result?.seriesBit?.val === 1 &&
            SCAFFOLD_SUBDIRECTORIES.every(
                (sub) =>
                    fs.existsSync(path.join(seriesDir, sub)) &&
                    fs.statSync(path.join(seriesDir, sub)).isDirectory(),
            ) &&
            fs.existsSync(compiledDir) &&
            fs.statSync(compiledDir).isDirectory()
        scaffoldSealed = topologyOk
        if (!topologyOk) {
            errors.push(
                '[TREE:BREACH] scaffoldSeriesTree failed val: 1 or topology incomplete.',
            )
        }

        // [TREE:INIT] ontology/unresolved.json must equal exactly []\n.
        const unresolvedPath = path.join(
            seriesDir,
            'ontology',
            'unresolved.json',
        )
        initSealed =
            fs.existsSync(unresolvedPath) &&
            fs.readFileSync(unresolvedPath, 'utf8') === '[]\n'
        if (!initSealed) {
            errors.push(
                '[TREE:BREACH] ontology/unresolved.json missing or not exactly []\\n.',
            )
        }

        // [TREE:CONFIG] series.config.json committed, slug intact, no orphans.
        const configPath = path.join(seriesDir, 'series.config.json')
        let configOk = false
        if (fs.existsSync(configPath)) {
            try {
                const persisted = JSON.parse(
                    fs.readFileSync(configPath, 'utf8'),
                )
                const orphans = fs
                    .readdirSync(seriesDir)
                    .filter((f) => f.startsWith('.tmp_'))
                configOk =
                    persisted.series_slug === PROBE_SLUG && orphans.length === 0
            } catch {
                configOk = false
            }
        }
        configSealed = configOk
        if (!configOk) {
            errors.push(
                '[TREE:BREACH] series.config.json missing, corrupt, or orphaned .tmp_ staging files present.',
            )
        }

        // Collision re-probe: same namespace must fail closed with val: 0.
        let collision: any = null
        await scaffoldSeriesTree(model, {
            idx: 'series-tree-audit-collision',
            dat: {
                seriesSlug: PROBE_SLUG,
                config: CANONICAL_SCAFFOLD_CONFIG,
                repoRoot: tempRepo,
            },
            slv: (res: any) => {
                collision = res
            },
        } as any)
        collisionTrapped =
            collision?.seriesBit?.val === 0 &&
            String(collision?.seriesBit?.dat?.error || '').includes(
                'CONFLICT_BLOCKED',
            )
        if (!collisionTrapped) {
            errors.push(
                '[TREE:BREACH] collision re-probe escaped without CONFLICT_BLOCKED.',
            )
        }
    } finally {
        fs.rmSync(tempRepo, { recursive: true, force: true })
    }

    return {
        inputSealed,
        vacancyConfirmed,
        scaffoldSealed,
        initSealed,
        configSealed,
        collisionTrapped,
        valid: errors.length === 0,
        errors,
    }
}

/**
 * Streams the exact 7-bit ASCII series tree scaffolding telemetry block
 * on success; throws a [TREE:FAILED] error on any breach.
 */
export const runSeriesTreeScaffoldAudit = async (): Promise<string[]> => {
    const audit = await auditSeriesTreeScaffold()
    if (!audit.valid) {
        throw new Error(`[TREE:FAILED] ${audit.errors.join(' ')}`)
    }

    return [
        SERIES_TREE_AUDIT_HEADER,
        SERIES_TREE_INPUT_LINE,
        SERIES_TREE_CHECK_LINE,
        SERIES_TREE_SCAFFOLD_LINE,
        SERIES_TREE_INIT_LINE,
        SERIES_TREE_CONFIG_LINE,
        SERIES_TREE_SEALED_FOOTER,
    ]
}
