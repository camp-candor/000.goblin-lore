import { emitBusConsoleLog } from '../../99.bus.unit/buz/bus.buzz.js'
import type { MenuModel } from '../menu.model.js'
import type MenuBit from '../fce/menu.bit.js'
import type State from '../../99.core/state.js'

export interface ScarcityPresetChoiceResult {
    readonly presetName: string
    readonly scarcityIndexBps: number
    readonly paranoiaBaselineBps: number
    readonly scrapMaxGrams: number
    readonly weightMaxGrams: number
    readonly cancelled: boolean
}

export const promptScarcityPreset = async (
    cpy: MenuModel,
    bal: MenuBit,
    _ste: State,
): Promise<MenuModel> => {
    const lib = (globalThis as any).LIBRARY
    await emitBusConsoleLog(
        'cns00',
        '>> [GENESIS] Selecting Scarcity & Paranoia State Space preset...',
    )

    const lst = [
        'SUBSISTENCE_CRISIS (Scarcity: 9200 bp | Paranoia: 7500 bp)',
        'CONTESTED_SALVAGE (Scarcity: 7500 bp | Paranoia: 6000 bp)',
        'RATIONED_ENCLAVE (Scarcity: 5000 bp | Paranoia: 4000 bp)',
        '[<] CANCEL',
    ]

    let gridData: any = { left: '0%', top: '33%', width: '33%', height: '66%' }
    if (lib && typeof lib.hunt === 'function') {
        const gridBit = await lib.hunt('[Grid action] Update Grid', {
            x: 0,
            y: 4,
            xSpan: 4,
            ySpan: 8,
        })
        if (gridBit?.grdBit?.dat) {
            gridData = gridBit.grdBit.dat
        }
    }

    let selected = lst[0]
    if (lib && typeof lib.hunt === 'function') {
        const choiceBit = await lib.hunt('[Open action] Open Choice', {
            dat: { clr0: 'black', clr1: 'yellow' },
            src: 'vertical',
            lst,
            net: gridData,
        })
        selected = choiceBit?.chcBit?.src || '[<] CANCEL'
    }

    if (selected === '[<] CANCEL') {
        await emitBusConsoleLog(
            'cns00',
            '>> [GENESIS] Scarcity selection cancelled.',
        )
        if (bal.slv)
            bal.slv({
                mnuBit: { idx: bal.idx, val: 0, dat: { cancelled: true } },
            })
        return cpy
    }

    let result: ScarcityPresetChoiceResult
    if (selected.startsWith('SUBSISTENCE_CRISIS')) {
        result = {
            presetName: 'SUBSISTENCE_CRISIS',
            scarcityIndexBps: 9200,
            paranoiaBaselineBps: 7500,
            scrapMaxGrams: 50,
            weightMaxGrams: 5000,
            cancelled: false,
        }
    } else if (selected.startsWith('CONTESTED_SALVAGE')) {
        result = {
            presetName: 'CONTESTED_SALVAGE',
            scarcityIndexBps: 7500,
            paranoiaBaselineBps: 6000,
            scrapMaxGrams: 100,
            weightMaxGrams: 8000,
            cancelled: false,
        }
    } else {
        result = {
            presetName: 'RATIONED_ENCLAVE',
            scarcityIndexBps: 5000,
            paranoiaBaselineBps: 4000,
            scrapMaxGrams: 200,
            weightMaxGrams: 12000,
            cancelled: false,
        }
    }

    await emitBusConsoleLog(
        'cns00',
        `>> [GENESIS] Scarcity set: ${result.scarcityIndexBps} bp, Paranoia: ${result.paranoiaBaselineBps} bp`,
    )
    if (bal.slv) bal.slv({ mnuBit: { idx: bal.idx, val: 1, dat: result } })
    return cpy
}
