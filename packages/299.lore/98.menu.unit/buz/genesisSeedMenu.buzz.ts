import * as ActSed from '../../27.seed.unit/seed.action.js'
import { emitBusConsoleLog } from '../../99.bus.unit/buz/bus.buzz.js'
import type { MenuModel } from '../menu.model.js'
import type MenuBit from '../fce/menu.bit.js'
import type State from '../../99.core/state.js'

export const triggerSeedGenesisCorpusMenu = async (
    cpy: MenuModel,
    bal: MenuBit,
    ste: State,
): Promise<MenuModel> => {
    const seriesSlug = bal.src || bal.dat?.seriesSlug || 'wiregrass-basin'
    await emitBusConsoleLog(
        'cns00',
        `>> [MENU] Triggering starter seed corpus generation for '${seriesSlug}'...`,
    )

    const seedBit: any = await ste.hunt(ActSed.SEED_GENESIS_CORPUS, {
        src: seriesSlug,
    })

    if (seedBit?.seedBit?.val === 1) {
        await emitBusConsoleLog(
            'cns00',
            `>> [MENU] [OK] Successfully populated seed dossiers for '${seriesSlug}'.`,
        )
        if (bal.slv)
            bal.slv({
                mnuBit: { idx: bal.idx, val: 1, dat: seedBit.seedBit.dat },
            })
    } else {
        const errorMsg = seedBit?.seedBit?.dat?.error || 'SEEDING_FAILED'
        await emitBusConsoleLog(
            'cns00',
            `>> [MENU] [FAIL] Could not seed dossiers: ${errorMsg}`,
        )
        if (bal.slv)
            bal.slv({
                mnuBit: { idx: bal.idx, val: 0, dat: { error: errorMsg } },
            })
    }

    return cpy
}
