import type State from '../../99.core/state.js'
import type { MenuModel } from '../menu.model.js'
import type MenuBit from '../fce/menu.bit.js'
import * as ActSer from '../../29.series.unit/series.action.js'
import * as ActSed from '../../27.seed.unit/seed.action.js'

const UPDATE_CONSOLE = '[Console action] Update Console'
const OPEN_INPUT = '[Open action] Open Input'

export function sanitizeAscii(input: string): string {
    // eslint-disable-next-line no-control-regex
    return input.replace(/[^\x00-\x7F]/g, '')
}

async function emitConsole(
    ste: State | undefined,
    line: string,
): Promise<void> {
    const clean = sanitizeAscii(line)
    const lib = (globalThis as any).LIBRARY || (global as any).LIBRARY
    if (lib && typeof lib.hunt === 'function') {
        await lib
            .hunt(UPDATE_CONSOLE, { idx: 'cns00', src: clean })
            .catch(() => {})
    } else if (ste && typeof ste.hunt === 'function') {
        await ste
            .hunt(UPDATE_CONSOLE, { idx: 'cns00', src: clean })
            .catch(() => {})
    }
}

async function promptInput(
    promptLabel: string,
    fallback: string,
): Promise<string> {
    const lib = (globalThis as any).LIBRARY || (global as any).LIBRARY
    if (!lib || typeof lib.hunt !== 'function') {
        return fallback
    }
    const bit = await lib
        .hunt(OPEN_INPUT, { src: promptLabel })
        .catch(() => null)
    return bit?.putBit?.src || fallback
}

export const runSeriesGenesisMenu = async (
    cpy: MenuModel,
    bal: MenuBit,
    ste?: State,
): Promise<MenuModel> => {
    const dat = bal?.dat || {}
    const seriesSlug =
        dat.seriesSlug || (await promptInput('Series Slug', 'ashfall-basin'))
    const displayName =
        dat.displayName || (await promptInput('Display Name', 'Ashfall Basin'))
    const centralIrony =
        dat.centralIrony ||
        (await promptInput(
            'Central Irony (>=10 chars)',
            'Scavengers hoard broken brass valves while starving above clean water.',
        ))

    await emitConsole(
        ste,
        `>> [GENESIS:INIT] Provisioning series '${seriesSlug}'...`,
    )

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
    if (ste && typeof ste.hunt === 'function') {
        await new Promise<void>((resolve) => {
            ste.hunt(ActSer.SCAFFOLD_SERIES_TREE, {
                idx: 'menu-genesis-scaffold',
                src: seriesSlug,
                dat: {
                    seriesSlug,
                    config: dat.config || defaultConfig,
                    repoRoot: dat.repoRoot,
                },
                slv: (res: any) => {
                    scaffoldBit = res?.seriesBit || res
                    resolve()
                },
            })
        })

        if (scaffoldBit?.val === 1) {
            await new Promise<void>((resolve) => {
                ste.hunt(ActSed.POPULATE_GENESIS_SEEDS, {
                    idx: 'menu-genesis-seed',
                    src: seriesSlug,
                    dat: {
                        seriesSlug,
                        repoRoot: dat.repoRoot,
                    },
                    slv: () => resolve(),
                })
            })
        }
    }

    const ok = !scaffoldBit || scaffoldBit.val === 1
    const receiptLine = ok
        ? `>> [GENESIS:OK] Series created: ${seriesSlug}`
        : `:: [GENESIS:FAIL] ${scaffoldBit?.dat?.error || 'Scaffolding rejected'}`

    await emitConsole(ste, receiptLine)
    cpy.activeSelection = '[G] UNIVERSAL SERIES GENESIS WIZARD'
    cpy.lastLifecycleReceipt = ok ? '[GENESIS:OK]' : '[GENESIS:FAIL]'
    cpy.statusMessage = receiptLine
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
