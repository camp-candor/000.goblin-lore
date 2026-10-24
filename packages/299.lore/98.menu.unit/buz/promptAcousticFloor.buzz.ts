import { emitBusConsoleLog } from '../../99.bus.unit/buz/bus.buzz.js'
import type { MenuModel } from '../menu.model.js'
import type MenuBit from '../fce/menu.bit.js'
import type State from '../../99.core/state.js'

export interface AcousticFloorChoiceResult {
    readonly presetName: string
    readonly globalAcousticFloorCdb: number
    readonly voDuckingDb: number
    readonly cancelled: boolean
}

export const promptAcousticFloor = async (
    cpy: MenuModel,
    bal: MenuBit,
    _ste: State,
): Promise<MenuModel> => {
    const lib = (globalThis as any).LIBRARY
    await emitBusConsoleLog(
        'cns00',
        '>> [GENESIS] Selecting Acoustic & Invariant Sensory preset...',
    )

    const lst = [
        'CORRUGATED_TIN_CULVERT (1500 cdB partition loss)',
        'HOLLOW_TIMBER_CRAWLSPACE (1200 cdB partition loss)',
        'SEALED_STEEL_BULKHEAD (3500 cdB partition loss)',
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
            '>> [GENESIS] Acoustic selection cancelled.',
        )
        if (bal.slv)
            bal.slv({
                mnuBit: { idx: bal.idx, val: 0, dat: { cancelled: true } },
            })
        return cpy
    }

    let result: AcousticFloorChoiceResult
    if (selected.startsWith('HOLLOW_TIMBER_CRAWLSPACE')) {
        result = {
            presetName: 'HOLLOW_TIMBER_CRAWLSPACE',
            globalAcousticFloorCdb: 1200,
            voDuckingDb: -14,
            cancelled: false,
        }
    } else if (selected.startsWith('SEALED_STEEL_BULKHEAD')) {
        result = {
            presetName: 'SEALED_STEEL_BULKHEAD',
            globalAcousticFloorCdb: 3500,
            voDuckingDb: -14,
            cancelled: false,
        }
    } else {
        result = {
            presetName: 'CORRUGATED_TIN_CULVERT',
            globalAcousticFloorCdb: 1500,
            voDuckingDb: -14,
            cancelled: false,
        }
    }

    await emitBusConsoleLog(
        'cns00',
        `>> [GENESIS] Acoustic floor set: ${result.globalAcousticFloorCdb} cdB (VO Ducking: ${result.voDuckingDb} dB)`,
    )
    if (bal.slv) bal.slv({ mnuBit: { idx: bal.idx, val: 1, dat: result } })
    return cpy
}
