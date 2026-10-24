import * as ActMnu from '../act/tupleWizard.action.js'
import * as ActSer from '../../29.series.unit/series.action.js'
import { emitBusConsoleLog } from '../../99.bus.unit/buz/bus.buzz.js'
import {
    DEFAULT_THEMATIC_CATEGORIES,
    DEFAULT_PERMITTED_ACTIONS,
} from '../../29.series.unit/val/seriesConfig.val.js'
import type { SeriesConfigPayload } from '../../29.series.unit/fce/seriesConfig.bit.js'
import type { MenuModel } from '../menu.model.js'
import type MenuBit from '../fce/menu.bit.js'
import type State from '../../99.core/state.js'

export const openTupleWizard = async (
    cpy: MenuModel,
    bal: MenuBit,
    ste: State,
): Promise<MenuModel> => {
    const seriesSlug = bal.src || bal.dat?.seriesSlug || 'wiregrass-basin'
    const displayName =
        bal.dat?.displayName || seriesSlug.replace(/-/g, ' ').toUpperCase()

    await emitBusConsoleLog(
        'cns00',
        `>> [TUPLE_WIZARD] Commencing 4-Tuple configuration for '${seriesSlug}'...`,
    )

    // Step 1: Genre Modality
    const genreBit: any = await ste.hunt(ActMnu.PROMPT_GENRE_MODALITY, {})
    if (genreBit?.mnuBit?.dat?.cancelled) {
        if (bal.slv)
            bal.slv({
                mnuBit: { idx: bal.idx, val: 0, dat: { cancelled: true } },
            })
        return cpy
    }
    const genreData = genreBit.mnuBit.dat

    // Step 2: Scarcity & Paranoia State Space
    const scarcityBit: any = await ste.hunt(ActMnu.PROMPT_SCARCITY_PRESET, {})
    if (scarcityBit?.mnuBit?.dat?.cancelled) {
        if (bal.slv)
            bal.slv({
                mnuBit: { idx: bal.idx, val: 0, dat: { cancelled: true } },
            })
        return cpy
    }
    const scarcityData = scarcityBit.mnuBit.dat

    // Step 3: Acoustic & Invariant Sensory
    const acousticBit: any = await ste.hunt(ActMnu.PROMPT_ACOUSTIC_FLOOR, {})
    if (acousticBit?.mnuBit?.dat?.cancelled) {
        if (bal.slv)
            bal.slv({
                mnuBit: { idx: bal.idx, val: 0, dat: { cancelled: true } },
            })
        return cpy
    }
    const acousticData = acousticBit.mnuBit.dat

    // Assemble Complete Narrative 4-Tuple Payload
    const configPayload: SeriesConfigPayload = {
        series_slug: seriesSlug,
        display_name: displayName,
        genre_tag: genreData.genreTag,
        central_irony: genreData.defaultCentralIrony,
        state_space: {
            scarcity_index_bps: scarcityData.scarcityIndexBps,
            paranoia_baseline_bps: scarcityData.paranoiaBaselineBps,
            scrap_max_grams: scarcityData.scrapMaxGrams,
            weight_max_grams: scarcityData.weightMaxGrams,
        },
        action_vocabulary: [...DEFAULT_PERMITTED_ACTIONS],
        invariants: {
            max_farce_ratio_bps: genreData.maxFarceRatioBps,
            global_acoustic_floor_cdb: acousticData.globalAcousticFloorCdb,
            vo_ducking_db: acousticData.voDuckingDb,
            min_grievances_per_dyad: 1,
            min_normalized_category_entropy_bps: 7000,
            thematic_categories: [...DEFAULT_THEMATIC_CATEGORIES],
        },
        medium_projections: {
            tts_port: 8000,
            comfy_port: 8188,
            lora_trigger_tokens: [seriesSlug.replace(/-/g, '_')],
        },
    }

    // Dispatch Serialization to 29.series.unit
    const writeBit: any = await ste.hunt(ActSer.UPDATE_SERIES, {
        dat: {
            config: configPayload,
            ...(bal.dat?.repoRoot ? { repoRoot: bal.dat.repoRoot } : {}),
        },
    })

    if (writeBit?.seriesBit?.val === 1) {
        await emitBusConsoleLog(
            'cns00',
            `>> [TUPLE_WIZARD] [OK] Successfully written series.config.json for '${seriesSlug}'.`,
        )
        if (bal.slv)
            bal.slv({
                mnuBit: {
                    idx: bal.idx,
                    val: 1,
                    dat: { config: configPayload },
                },
            })
    } else {
        const errorMsg = writeBit?.seriesBit?.dat?.error || 'SERIALIZE_FAILED'
        await emitBusConsoleLog(
            'cns00',
            `>> [TUPLE_WIZARD] [FAIL] Could not serialize series config: ${errorMsg}`,
        )
        if (bal.slv)
            bal.slv({
                mnuBit: { idx: bal.idx, val: 0, dat: { error: errorMsg } },
            })
    }

    return cpy
}
