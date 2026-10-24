import * as ActCan from '../../41.canon.unit/act/compileGenesis.action.js'
import { emitBusConsoleLog } from '../../99.bus.unit/buz/bus.buzz.js'
import type { MenuModel } from '../menu.model.js'
import type MenuBit from '../fce/menu.bit.js'
import type State from '../../99.core/state.js'

export const triggerCompileGenesisMenu = async (
    cpy: MenuModel,
    bal: MenuBit,
    ste: State,
): Promise<MenuModel> => {
    const seriesSlug = bal.src || bal.dat?.seriesSlug || 'wiregrass-basin'
    await emitBusConsoleLog(
        'cns00',
        `>> [MENU] Requesting 3-Pass Compilation for series: '${seriesSlug}'...`,
    )

    const compileBit: any = await ste.hunt(ActCan.COMPILE_GENESIS_SEAL, {
        src: seriesSlug,
    })

    if (compileBit?.canonBit?.val === 1) {
        const res = compileBit.canonBit.dat.result
        await emitBusConsoleLog(
            'cns00',
            `>> [MENU] [OK] Genesis Seal Verified! H_root: ${res.merkleRoot}`,
        )
        if (bal.slv) bal.slv({ mnuBit: { idx: bal.idx, val: 1, dat: res } })
    } else {
        const errorMsg =
            compileBit?.canonBit?.dat?.error || 'COMPILATION_FAILED'
        await emitBusConsoleLog(
            'cns00',
            `>> [MENU] [FAIL] Genesis Compilation Failed: ${errorMsg}`,
        )
        if (bal.slv)
            bal.slv({
                mnuBit: { idx: bal.idx, val: 0, dat: { error: errorMsg } },
            })
    }

    return cpy
}
