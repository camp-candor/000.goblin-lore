/**
 * packages/299.lore/98.menu.unit/buz/17.four.tuple.audit.buzz.ts
 *
 * Universal Narrative Four-Tuple contract audit buzzer. Validates the live
 * 29.series.unit Zod hierarchy (<S, A, I, R_m>) with a canonical in-memory
 * SeriesConfig plus fail-closed negative probes, then streams pure 7-bit
 * ASCII telemetry into the cns00 Blessed console pane.
 */

import {
    SeriesConfigSchema,
    StateSpaceSchema,
    ActionVocabularySchema,
    InvariantRulesSchema,
    MediumProjectionsSchema,
    type SeriesConfig,
} from '../../29.series.unit/fce/series.schema.js'

export const FOUR_TUPLE_MENU_LABEL =
    '[ 5. UNIVERSAL NARRATIVE FOUR-TUPLE SCHEMA ]'

export const FOUR_TUPLE_AUDIT_HEADER =
    '--- [299.LORE :: 29.SERIES.UNIT :: UNIVERSAL FOUR-TUPLE CONTRACT AUDIT] ---'

export const FOUR_TUPLE_STATE_SPACE_LINE =
    '>> [TUPLE:STATE_SPACE] Scarcity Index: Integer bp [0..10000] | Floats Prohibited'

export const FOUR_TUPLE_ACTION_VOCAB_LINE =
    '>> [TUPLE:ACTION_VOCAB] Kinetic Verbs: Strict Uppercase Regex (/^[A-Z_]+$/)'

export const FOUR_TUPLE_INVARIANTS_LINE =
    '>> [TUPLE:INVARIANTS] Farce Ratio Cap: <= 1500 bp (15.0%) | Categories: 7'

export const FOUR_TUPLE_PROJECTIONS_LINE =
    '>> [TUPLE:PROJECTIONS] Master Clock: 24 fps literal | Sample Rate: 48000 Hz literal'

export const FOUR_TUPLE_SEALED_FOOTER =
    '--- [AUDIT COMPLETE: UNIVERSAL NARRATIVE FOUR-TUPLE SEALED AT T0 = $0.00] ---'

export const FOUR_TUPLE_BREACHED_FOOTER =
    '--- [AUDIT HALTED: UNIVERSAL NARRATIVE FOUR-TUPLE BREACHED AT T0 = $0.00] ---'

const CANONICAL_TUPLE_CONFIG: SeriesConfig = {
    schema_version: '1.0.0',
    series_slug: 'under-the-floorboards',
    display_name: 'Under the Floorboards',
    genre_tag: 'LOW_FANTASY_FARCE',
    central_irony:
        'Goblins hoard worthless broken scrap while starving beneath abundance.',
    state_space: {
        scarcity_index_bp: 9200,
        paranoia_baseline_bp: 7500,
        somatic_fatigue_enabled: true,
        epistemic_ignorance_enabled: true,
        gram_mass_tiers: {
            scrap_max_grams: 50,
            weight_max_grams: 5000,
            bulk_min_grams: 5001,
        },
    },
    action_vocabulary: {
        permitted_kinetic_verbs: [
            'LIMP',
            'CONCEAL',
            'EXPEND_LEVERAGE',
            'SIPHON',
            'DEFLECT',
        ],
        forbidden_verbs_global: ['fly', 'teleport'],
        locomotion_taxonomies: [
            'BIPEDAL_NIMBLE',
            'BIPEDAL_HUNCHED',
            'LIMPING',
            'IMMOBILE',
        ],
    },
    invariant_rules: {
        max_farce_ratio_bp: 1500,
        min_grievance_depth_delta: 1,
        global_acoustic_floor_cdb: 1500,
        voiceover_ducking_db: -14,
        min_normalized_category_entropy_bp: 7000,
        thematic_categories: [
            'RESOURCE_HOARDING',
            'STATUS_ENCROACHMENT',
            'TERRITORIAL_TRESPASS',
            'SPOON_DISPUTE',
            'LABOR_AVOIDANCE',
            'DEBT_EVASION',
            'LINEAGE_INSULT',
        ],
    },
    medium_projections: {
        target_fps: 24,
        audio_sample_rate_hz: 48000,
        tts_service_port: 8000,
        video_service_port: 8188,
        aspect_ratio: '16:9',
    },
}

export interface FourTupleContractAudit {
    canonicalSealed: boolean
    probesTrapped: number
    probeTotal: number
    valid: boolean
    errors: string[]
}

interface TupleProbe {
    id: string
    token: string
    run: () => {
        success: boolean
        error?: { issues: Array<{ message: string }> }
    }
}

/**
 * Runs the REAL Phase 4 four-tuple contract gates against the live
 * 29.series.unit schemas: one canonical seal plus fail-closed negative
 * probes across <S, A, I, R_m>. Never throws; reports breaches via errors.
 */
export function auditFourTupleContract(): FourTupleContractAudit {
    const errors: string[] = []

    const canonical = SeriesConfigSchema.safeParse(CANONICAL_TUPLE_CONFIG)
    const canonicalSealed = canonical.success
    if (!canonicalSealed) {
        errors.push(
            '[TUPLE:BREACH] canonical SeriesConfig rejected by live schema.',
        )
    }

    const probes: TupleProbe[] = [
        {
            id: 'STATE_SPACE_FLOAT',
            token: '[FLOAT_PROHIBITED]',
            run: () =>
                StateSpaceSchema.safeParse({
                    scarcity_index_bp: 9200.5,
                    paranoia_baseline_bp: 7500,
                    somatic_fatigue_enabled: true,
                    epistemic_ignorance_enabled: true,
                    gram_mass_tiers: {
                        scrap_max_grams: 50,
                        weight_max_grams: 5000,
                        bulk_min_grams: 5001,
                    },
                }),
        },
        {
            id: 'ACTION_VOCAB_CASE',
            token: '[INVALID_VERB_FORMAT]',
            run: () =>
                ActionVocabularySchema.safeParse({
                    permitted_kinetic_verbs: ['LIMP', 'siphon', 'CONCEAL'],
                    forbidden_verbs_global: [],
                    locomotion_taxonomies: ['BIPEDAL'],
                }),
        },
        {
            id: 'INVARIANT_FARCE_CEILING',
            token: '[OUT_OF_BOUNDS]',
            run: () =>
                InvariantRulesSchema.safeParse({
                    max_farce_ratio_bp: 1501,
                    min_grievance_depth_delta: 1,
                    global_acoustic_floor_cdb: 1500,
                    voiceover_ducking_db: -14,
                    min_normalized_category_entropy_bp: 7000,
                    thematic_categories: [
                        'CAT_1',
                        'CAT_2',
                        'CAT_3',
                        'CAT_4',
                        'CAT_5',
                        'CAT_6',
                        'CAT_7',
                    ],
                }),
        },
        {
            id: 'INVARIANT_CATEGORY_COUNT',
            token: '[THEMATIC_CATEGORY_COUNT_MISMATCH]',
            run: () =>
                InvariantRulesSchema.safeParse({
                    max_farce_ratio_bp: 1200,
                    min_grievance_depth_delta: 1,
                    global_acoustic_floor_cdb: 1500,
                    voiceover_ducking_db: -14,
                    min_normalized_category_entropy_bp: 7000,
                    thematic_categories: ['CAT_1', 'CAT_2', 'CAT_3'],
                }),
        },
        {
            id: 'PROJECTION_FPS_LITERAL',
            token: '[FPS_MISMATCH]',
            run: () =>
                MediumProjectionsSchema.safeParse({
                    target_fps: 30,
                    audio_sample_rate_hz: 48000,
                    tts_service_port: 8000,
                    video_service_port: 8188,
                    aspect_ratio: '16:9',
                }),
        },
        {
            id: 'PROJECTION_SAMPLE_RATE_LITERAL',
            token: '[SAMPLE_RATE_MISMATCH]',
            run: () =>
                MediumProjectionsSchema.safeParse({
                    target_fps: 24,
                    audio_sample_rate_hz: 44100,
                    tts_service_port: 8000,
                    video_service_port: 8188,
                    aspect_ratio: '16:9',
                }),
        },
    ]

    let probesTrapped = 0
    for (const probe of probes) {
        const res = probe.run()
        const trapped =
            res.success === false &&
            Array.isArray(res.error?.issues) &&
            (res.error?.issues ?? []).some((i: { message: string }) =>
                i.message.includes(probe.token),
            )
        if (trapped) {
            probesTrapped += 1
        } else {
            errors.push(
                `[TUPLE:BREACH] probe ${probe.id} escaped without ${probe.token}.`,
            )
        }
    }

    // Zero-hallucination strict-mode fence: rogue keys must fail at root.
    const strictProbe = SeriesConfigSchema.safeParse({
        ...CANONICAL_TUPLE_CONFIG,
        generative_hallucination_field: 'untracked',
    })
    const probeTotal = probes.length + 1
    if (strictProbe.success) {
        errors.push(
            '[TUPLE:BREACH] SeriesConfigSchema accepted an un-schemaed property: .strict() fence open.',
        )
    } else {
        probesTrapped += 1
    }

    return {
        canonicalSealed,
        probesTrapped,
        probeTotal,
        valid: errors.length === 0,
        errors,
    }
}

/**
 * Streams the exact 7-bit ASCII four-tuple contract telemetry block on
 * success; throws a [TUPLE:FAILED] error on any breach.
 */
export const runFourTupleContractAudit = async (): Promise<string[]> => {
    const audit = auditFourTupleContract()
    if (!audit.valid) {
        throw new Error(`[TUPLE:FAILED] ${audit.errors.join(' ')}`)
    }

    return [
        FOUR_TUPLE_AUDIT_HEADER,
        FOUR_TUPLE_STATE_SPACE_LINE,
        FOUR_TUPLE_ACTION_VOCAB_LINE,
        FOUR_TUPLE_INVARIANTS_LINE,
        FOUR_TUPLE_PROJECTIONS_LINE,
        FOUR_TUPLE_SEALED_FOOTER,
    ]
}
