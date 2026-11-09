import * as fs from 'node:fs'
import * as path from 'node:path'
import type State from '../../99.core/state.js'
import type { MenuModel } from '../menu.model.js'
import type MenuBit from '../fce/menu.bit.js'
import * as ActSer from '../../29.series.unit/series.action.js'
import * as ActSed from '../../27.seed.unit/seed.action.js'
import { resolveRepoRoot } from '../../29.series.unit/buz/scaffoldSeriesTree.buzz.js'
import { seedDirectoryExamples } from '../../27.seed.unit/buz/seedDirectoryExamples.buzz.js'

const UPDATE_CONSOLE = '[Console action] Update Console'

export function sanitizeAscii(input: string): string {
    // eslint-disable-next-line no-control-regex
    return input.replace(/[^\x00-\x7F]/g, '')
}

function emitConsole(ste: State | undefined, line: string): void {
    const clean = sanitizeAscii(line)
    const lib = (globalThis as any).LIBRARY || (global as any).LIBRARY
    if (lib && typeof lib.hunt === 'function') {
        lib.hunt(UPDATE_CONSOLE, { idx: 'cns00', src: clean }).catch(() => {})
    } else if (ste && typeof ste.hunt === 'function') {
        ste.hunt(UPDATE_CONSOLE, { idx: 'cns00', src: clean }).catch(() => {})
    }
}

export const runSeriesGenesisMenu = async (
    cpy: MenuModel,
    bal: MenuBit,
    ste?: State,
): Promise<MenuModel> => {
    const dat = bal?.dat || {}
    const seriesSlug = dat.seriesSlug || 'ashfall-basin'
    const displayName = dat.displayName || 'Ashfall Basin'
    const centralIrony =
        dat.centralIrony ||
        'Scavengers hoard broken brass valves while starving above clean water.'

    emitConsole(ste, `>> [GENESIS:INIT] Provisioning series '${seriesSlug}'...`)

    const defaultConfig = {
        schema_version: '1.0.0' as const,
        series_slug: seriesSlug,
        display_name: displayName,
        genre_tag: 'LOW_FANTASY_FARCE' as const,
        central_irony: centralIrony,
        state_space: {
            scarcity_index_bp: 8500,
            paranoia_baseline_bp: 6500,
            somatic_fatigue_enabled: true,
            epistemic_ignorance_enabled: true,
            gram_mass_tiers: {
                scrap_max_grams: 50,
                weight_max_grams: 5000,
                bulk_min_grams: 5001,
            },
        },
        action_vocabulary: {
            permitted_kinetic_verbs: ['LIMP', 'SIPHON', 'CONCEAL'],
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
            target_fps: 24 as const,
            audio_sample_rate_hz: 48000 as const,
            tts_service_port: 8000,
            video_service_port: 8188,
            aspect_ratio: '16:9' as const,
        },
    }

    let scaffoldBit: any = null
    const repoRoot = dat.repoRoot || resolveRepoRoot()
    const seriesDir = path.join(repoRoot, 'series', seriesSlug)

    if (ste && typeof ste.hunt === 'function') {
        const scaffoldRes = await ste.hunt(ActSer.SCAFFOLD_SERIES_TREE, {
            idx: 'menu-genesis-scaffold',
            src: seriesSlug,
            dat: {
                seriesSlug,
                config: dat.config || defaultConfig,
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
                // Seed population fallback handled by seedDirectoryExamples
            }

            seedDirectoryExamples(seriesDir, seriesSlug)
        }
    } else {
        if (fs.existsSync(seriesDir)) {
            seedDirectoryExamples(seriesDir, seriesSlug)
        }
    }

    const ok = !scaffoldBit || scaffoldBit.val === 1
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
                dat: { receipt: receiptLine, scaffoldBit },
            },
        })
    }
    return cpy
}
