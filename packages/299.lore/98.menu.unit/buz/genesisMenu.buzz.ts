import * as fs from 'node:fs'
import * as path from 'node:path'
import type State from '../../99.core/state.js'
import type { MenuModel } from '../menu.model.js'
import type MenuBit from '../fce/menu.bit.js'
import * as ActSer from '../../29.series.unit/series.action.js'
import * as ActSed from '../../27.seed.unit/seed.action.js'
import { resolveRepoRoot } from '../../29.series.unit/buz/scaffoldSeriesTree.buzz.js'
import { seedDirectoryExamples } from '../../27.seed.unit/buz/seedDirectoryExamples.buzz.js'
import {
    promptBlessedChoice,
    promptBlessedInput,
    resolveLibraryBus,
    sanitizeSeriesSlug,
} from './blessedModal.buzz.js'
import { promptCustomSeedMenu } from './customSeedMenu.buzz.js'
import type {
    AssembledFourTupleConfig,
    GenreClassification,
} from '../fce/genesisWizard.interface.js'
import {
    GENRE_TAXONOMY_PROFILES,
    VALID_GENRE_CLASSIFICATIONS,
    resolveGenreProfile,
    type GenreTaxonomyProfile,
} from '../../38.types.unit/val/genre.val.js'

export function sanitizeAscii(raw: string): string {
    return String(raw || '')
        .replace(/[^\x20-\x7E]/g, '')
        .trim()
}

function emitConsole(ste: State | undefined, line: string): void {
    const cleanLine = sanitizeAscii(line)
    const lib = resolveLibraryBus()
    if (lib && typeof lib.hunt === 'function') {
        lib.hunt('[Console action] Update Console', {
            idx: 'cns00',
            src: cleanLine,
        })
        return
    }
    if (ste && typeof ste.hunt === 'function') {
        ste.hunt('[Console action] Update Console', {
            idx: 'cns00',
            src: cleanLine,
        })
    }
}

export const GENRE_CHOICE_MAP: Readonly<Record<string, GenreClassification>> =
    Object.freeze(
        VALID_GENRE_CLASSIFICATIONS.reduce(
            (acc, genreId) => {
                const profile = GENRE_TAXONOMY_PROFILES[genreId]
                acc[profile.label] = genreId
                return acc
            },
            {
                '[1] LOW FANTASY FARCE (Default)': 'LOW_FANTASY_FARCE',
                '[2] STANDARD DRAMATIC REALISM': 'STANDARD',
                '[3] SUPERHERO URBAN VIGILANTE': 'SUPERHERO_URBAN_VIGILANTE',
                '[4] SOUTHERN GOTHIC INDUSTRIAL': 'SOUTHERN_GOTHIC_INDUSTRIAL',
                '[5] HARD SCIFI VACUUM': 'HARD_SCIFI_VACUUM',
            } as Record<string, GenreClassification>,
        ),
    )

const STATE_SPACE_PRESETS: Record<
    string,
    { scarcity_index_bp: number; paranoia_baseline_bp: number }
> = {
    '[1] HIGH SCARCITY (8500 bp / Paranoia 6500 bp)': {
        scarcity_index_bp: 8500,
        paranoia_baseline_bp: 6500,
    },
    '[2] URBAN CRISIS (6000 bp / Paranoia 8000 bp)': {
        scarcity_index_bp: 6000,
        paranoia_baseline_bp: 8000,
    },
    '[3] BALANCED BASELINE (5000 bp / Paranoia 5000 bp)': {
        scarcity_index_bp: 5000,
        paranoia_baseline_bp: 5000,
    },
}

const ACTION_VOCAB_PRESETS: Record<
    string,
    {
        permitted_kinetic_verbs: string[]
        forbidden_verbs_global: string[]
        locomotion_taxonomies: string[]
    }
> = {
    '[1] CONSTRAINED SCAVENGER (LIMP, SIPHON, CONCEAL)': {
        permitted_kinetic_verbs: ['LIMP', 'SIPHON', 'CONCEAL'],
        forbidden_verbs_global: ['fly'],
        locomotion_taxonomies: ['BIPEDAL_HUNCHED'],
    },
    '[2] HEROIC KINETIC (FLY, GRAPNEL, LASSO_BIND, GLIDE, DEFLECT, DETONATE)': {
        permitted_kinetic_verbs: [
            'FLY',
            'GRAPNEL',
            'LASSO_BIND',
            'GLIDE',
            'DEFLECT',
            'DETONATE',
        ],
        forbidden_verbs_global: [],
        locomotion_taxonomies: ['BIPEDAL_STANDARD', 'AERIAL'],
    },
    '[3] STANDARD TACTICAL (STRIKE, DEFLECT, CONCEAL, SPRINT)': {
        permitted_kinetic_verbs: ['STRIKE', 'DEFLECT', 'CONCEAL', 'SPRINT'],
        forbidden_verbs_global: ['fly'],
        locomotion_taxonomies: ['BIPEDAL_STANDARD'],
    },
}

const INVARIANT_PRESETS: Record<
    string,
    { max_farce_ratio_bp: number; global_acoustic_floor_cdb: number }
> = {
    '[1] STRICT DRAMA (Farce <= 1500 bp / Floor 1500 cdB)': {
        max_farce_ratio_bp: 1500,
        global_acoustic_floor_cdb: 1500,
    },
    '[2] NOIR ACOUSTIC (Farce <= 1000 bp / Floor 2200 cdB)': {
        max_farce_ratio_bp: 1000,
        global_acoustic_floor_cdb: 2200,
    },
    '[3] MODERATE SATIRE (Farce <= 1500 bp / Floor 1200 cdB)': {
        max_farce_ratio_bp: 1500,
        global_acoustic_floor_cdb: 1200,
    },
}

export const runSeriesGenesisMenu = async (
    cpy: MenuModel,
    bal: MenuBit,
    ste?: State,
): Promise<MenuModel> => {
    const dat = (bal?.dat || {}) as Record<string, any>
    const abortWizard = (reason: string): MenuModel => {
        const cancelLine = `>> [GENESIS:CANCELLED] ${reason}`
        emitConsole(ste, cancelLine)
        cpy.activeSelection = '[G] UNIVERSAL SERIES GENESIS WIZARD'
        cpy.lastLifecycleReceipt = '[GENESIS:CANCELLED]'
        cpy.statusMessage = cancelLine
        if (bal?.slv) {
            bal.slv({
                mnuBit: {
                    idx: 'open-genesis-menu',
                    val: 0,
                    dat: { cancelled: true, receipt: cancelLine },
                },
            })
        }
        return cpy
    }

    emitConsole(
        ste,
        '>> [GENESIS:WIZARD] Initiating Sequential 4-Tuple Parameterization...',
    )

    let seriesSlug = dat.seriesSlug ? sanitizeSeriesSlug(dat.seriesSlug) : ''
    if (!seriesSlug) {
        const slugRes = await promptBlessedInput({
            promptLabel:
                'Step 1/6: Enter POSIX Series Slug (e.g. gotham-trinity-crisis)',
            defaultValue: 'ashfall-basin',
            sanitizeSlug: true,
        })
        if (slugRes.cancelled) {
            return abortWizard('Aborted at Step 1 (Series Slug).')
        }
        seriesSlug = slugRes.value
    }

    const displayName =
        dat.displayName ||
        seriesSlug
            .split('-')
            .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
            .join(' ')

    let genreTag: GenreClassification = dat.genreTag || 'LOW_FANTASY_FARCE'
    if (!dat.genreTag && !dat.config) {
        const genreRes = await promptGenreModality(genreTag)
        if (genreRes.cancelled) {
            return abortWizard('Aborted at Step 2 (Genre Classification).')
        }
        genreTag = genreRes.value.id
        emitConsole(
            ste,
            `>> [GENESIS:GENRE] Selected ${genreRes.value.id} (Modal: ${genreRes.value.primary_modal_chamber}/${genreRes.value.secondary_modal_chamber})`,
        )
    }

    let stateSpaceSelection =
        STATE_SPACE_PRESETS['[1] HIGH SCARCITY (8500 bp / Paranoia 6500 bp)']
    if (!dat.stateSpacePreset && !dat.config) {
        const stateOptions = Object.keys(STATE_SPACE_PRESETS)
        const stateRes = await promptBlessedChoice({
            promptHeader: 'Step 3/6: Configure <S> State Space Accumulators',
            choices: stateOptions,
            defaultValue: stateOptions[0],
        })
        if (stateRes.cancelled) {
            return abortWizard('Aborted at Step 3 (State Space <S>).')
        }
        stateSpaceSelection =
            STATE_SPACE_PRESETS[stateRes.value] || stateSpaceSelection
    }

    let actionVocabSelection =
        ACTION_VOCAB_PRESETS[
            '[1] CONSTRAINED SCAVENGER (LIMP, SIPHON, CONCEAL)'
        ]
    if (!dat.actionVocabPreset && !dat.config) {
        const actionOptions = Object.keys(ACTION_VOCAB_PRESETS)
        const actionRes = await promptBlessedChoice({
            promptHeader: 'Step 4/6: Configure <A> Bounded Action Vocabulary',
            choices: actionOptions,
            defaultValue: actionOptions[0],
        })
        if (actionRes.cancelled) {
            return abortWizard('Aborted at Step 4 (Action Vocabulary <A>).')
        }
        actionVocabSelection =
            ACTION_VOCAB_PRESETS[actionRes.value] || actionVocabSelection
    }

    let invariantSelection =
        INVARIANT_PRESETS[
            '[1] STRICT DRAMA (Farce <= 1500 bp / Floor 1500 cdB)'
        ]
    if (!dat.invariantPreset && !dat.config) {
        const invOptions = Object.keys(INVARIANT_PRESETS)
        const invRes = await promptBlessedChoice({
            promptHeader: 'Step 5/6: Configure <I> Invariant Ceilings',
            choices: invOptions,
            defaultValue: invOptions[0],
        })
        if (invRes.cancelled) {
            return abortWizard('Aborted at Step 5 (Invariant Laws <I>).')
        }
        invariantSelection =
            INVARIANT_PRESETS[invRes.value] || invariantSelection
    }

    let centralIrony = dat.centralIrony || ''
    if (!centralIrony && !dat.config) {
        const ironyRes = await promptBlessedInput({
            promptLabel: 'Step 6/6: Enter Central Irony Dramatic Spine',
            defaultValue:
                'Scavengers hoard broken brass valves while starving above clean water.',
            sanitizeSlug: false,
        })
        if (ironyRes.cancelled) {
            return abortWizard('Aborted at Step 6 (Central Irony).')
        }
        centralIrony = sanitizeAscii(ironyRes.value)
    }

    const assembledConfig: AssembledFourTupleConfig = dat.config || {
        schema_version: '1.0.0',
        series_slug: seriesSlug,
        display_name: sanitizeAscii(displayName),
        genre_tag: genreTag,
        central_irony:
            centralIrony ||
            'Scavengers hoard broken brass valves while starving above clean water.',
        state_space: {
            scarcity_index_bp: stateSpaceSelection.scarcity_index_bp,
            paranoia_baseline_bp: stateSpaceSelection.paranoia_baseline_bp,
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
                ...actionVocabSelection.permitted_kinetic_verbs,
            ],
            forbidden_verbs_global: [
                ...actionVocabSelection.forbidden_verbs_global,
            ],
            locomotion_taxonomies: [
                ...actionVocabSelection.locomotion_taxonomies,
            ],
        },
        invariant_rules: {
            max_farce_ratio_bp: invariantSelection.max_farce_ratio_bp,
            min_grievance_depth_delta: 1,
            global_acoustic_floor_cdb:
                invariantSelection.global_acoustic_floor_cdb,
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

    emitConsole(
        ste,
        `>> [GENESIS:SEAL] Dispatching 4-Tuple for '${seriesSlug}' (Genre: ${assembledConfig.genre_tag})...`,
    )

    let scaffoldBit: any = null
    const repoRoot = dat.repoRoot || resolveRepoRoot()
    const seriesDir = path.join(repoRoot, 'series', seriesSlug)

    if (ste && typeof ste.hunt === 'function') {
        const scaffoldRes = await ste.hunt(ActSer.SCAFFOLD_SERIES_TREE, {
            idx: 'menu-genesis-scaffold',
            src: seriesSlug,
            dat: {
                seriesSlug,
                config: assembledConfig,
                repoRoot: dat.repoRoot,
            },
        })
        scaffoldBit = scaffoldRes?.seriesBit || scaffoldRes

        if (scaffoldBit?.val === 1 || fs.existsSync(seriesDir)) {
            try {
                await ste.hunt(ActSed.POPULATE_GENESIS_SEEDS, {
                    idx: 'menu-genesis-seed',
                    src: seriesSlug,
                    dat: {
                        seriesSlug,
                        repoRoot: dat.repoRoot,
                    },
                })
            } catch {
                // Fallback handled by seedDirectoryExamples
            }

            seedDirectoryExamples(seriesDir, seriesSlug)
        }
    } else if (fs.existsSync(seriesDir)) {
        seedDirectoryExamples(seriesDir, seriesSlug)
    }

    const ok = !scaffoldBit || scaffoldBit.val === 1
    if (ok && !dat.skipCustomSeeds) {
        await promptCustomSeedMenu(
            cpy,
            {
                idx: 'genesis-custom-seed',
                src: seriesSlug,
                dat: { seriesSlug, repoRoot: dat.repoRoot },
            },
            ste,
        )
    }
    const receiptLine = ok
        ? `>> [GENESIS:OK] Series created: ${seriesSlug}`
        : `:: [GENESIS:FAIL] ${scaffoldBit?.dat?.error || 'Scaffolding rejected'}`

    emitConsole(ste, receiptLine)
    cpy.activeSelection = '[G] UNIVERSAL SERIES GENESIS WIZARD'
    cpy.lastLifecycleReceipt = ok ? '[GENESIS:OK]' : '[GENESIS:FAIL]'
    cpy.statusMessage = receiptLine
    if (!Array.isArray(cpy.lastTelemetryReport)) {
        cpy.lastTelemetryReport = []
    }
    cpy.lastTelemetryReport.push(receiptLine)

    if (bal?.slv) {
        bal.slv({
            mnuBit: {
                idx: 'open-genesis-menu',
                val: ok ? 1 : 0,
                src: seriesSlug,
                dat: {
                    receipt: receiptLine,
                    config: assembledConfig,
                    scaffoldBit,
                },
            },
        })
    }

    return cpy
}

export async function promptGenreModality(
    defaultGenre: GenreClassification = 'LOW_FANTASY_FARCE',
): Promise<{ cancelled: boolean; value: GenreTaxonomyProfile }> {
    const defaultProfile = resolveGenreProfile(defaultGenre)
    const choices = VALID_GENRE_CLASSIFICATIONS.map(
        (id) => GENRE_TAXONOMY_PROFILES[id].label,
    )

    const choiceRes = await promptBlessedChoice({
        promptHeader: 'Step 2/6: Select Genre Classification Taxonomy',
        choices,
        defaultValue: defaultProfile.label,
    })

    if (choiceRes.cancelled) {
        return { cancelled: true, value: defaultProfile }
    }

    const resolvedId: GenreClassification =
        GENRE_CHOICE_MAP[choiceRes.value] || defaultGenre

    return { cancelled: false, value: resolveGenreProfile(resolvedId) }
}
