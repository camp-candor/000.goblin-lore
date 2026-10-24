import { emitBusConsoleLog } from '../../99.bus.unit/buz/bus.buzz.js'
import type { MenuModel } from '../menu.model.js'
import type MenuBit from '../fce/menu.bit.js'
import type State from '../../99.core/state.js'

export interface GenreModalityChoiceResult {
    readonly genreTag:
        'LOW_FANTASY_FARCE' | 'SOUTHERN_GOTHIC_INDUSTRIAL' | 'HARD_SCIFI_VACUUM'
    readonly borderTheme: 'green' | 'yellow' | 'cyan'
    readonly maxFarceRatioBps: number
    readonly defaultCentralIrony: string
    readonly cancelled: boolean
}

export const promptGenreModality = async (
    cpy: MenuModel,
    bal: MenuBit,
    _ste: State,
): Promise<MenuModel> => {
    const lib = (globalThis as any).LIBRARY
    await emitBusConsoleLog(
        'cns00',
        '>> [GENESIS] Selecting Genre Modality preset...',
    )

    const lst = [
        'LOW_FANTASY_FARCE',
        'SOUTHERN_GOTHIC_INDUSTRIAL',
        'HARD_SCIFI_VACUUM',
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

    let selected = 'SOUTHERN_GOTHIC_INDUSTRIAL'
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
            '>> [GENESIS] Genre selection cancelled.',
        )
        if (bal.slv)
            bal.slv({
                mnuBit: { idx: bal.idx, val: 0, dat: { cancelled: true } },
            })
        return cpy
    }

    let result: GenreModalityChoiceResult
    switch (selected) {
        case 'LOW_FANTASY_FARCE':
            result = {
                genreTag: 'LOW_FANTASY_FARCE',
                borderTheme: 'green',
                maxFarceRatioBps: 1500,
                defaultCentralIrony:
                    'Desperate goblins bicker over worthless copper pins while ignoring ceiling cave-ins.',
                cancelled: false,
            }
            break
        case 'HARD_SCIFI_VACUUM':
            result = {
                genreTag: 'HARD_SCIFI_VACUUM',
                borderTheme: 'cyan',
                maxFarceRatioBps: 500,
                defaultCentralIrony:
                    'Crew members ration milliliters of air while plotting vengeance over stolen filters.',
                cancelled: false,
            }
            break
        case 'SOUTHERN_GOTHIC_INDUSTRIAL':
        default:
            result = {
                genreTag: 'SOUTHERN_GOTHIC_INDUSTRIAL',
                borderTheme: 'yellow',
                maxFarceRatioBps: 1000,
                defaultCentralIrony:
                    'A clan so terrified of outside judgment that they systematically conceal industrial leaks.',
                cancelled: false,
            }
            break
    }

    await emitBusConsoleLog(
        'cns00',
        `>> [GENESIS] Genre chosen: ${result.genreTag} (Farce Cap: ${result.maxFarceRatioBps} bp)`,
    )
    if (bal.slv) bal.slv({ mnuBit: { idx: bal.idx, val: 1, dat: result } })
    return cpy
}
