import * as fs from 'node:fs'
import * as path from 'node:path'
import * as ActTar from '../../34.target.unit/target.action.js'
import { resolveRepoRoot } from '../../00.lore.unit/buz/lore.buzz.js'
import { emitBusConsoleLog } from '../../99.bus.unit/buz/bus.buzz.js'
import type { MenuModel } from '../menu.model.js'
import type MenuBit from '../fce/menu.bit.js'
import type State from '../../99.core/state.js'

export const promptSwitchSeries = async (
    cpy: MenuModel,
    bal: MenuBit,
    ste: State,
): Promise<MenuModel> => {
    const lib = (globalThis as any).LIBRARY
    const repoRoot = resolveRepoRoot()
    const seriesBaseDir = path.join(repoRoot, 'series')

    await emitBusConsoleLog(
        'cns00',
        '>> [SWITCH_SERIES] Scanning available series on disk...',
    )

    if (!fs.existsSync(seriesBaseDir)) {
        await emitBusConsoleLog(
            'cns00',
            '>> [WARN] series/ directory does not exist.',
        )
        if (bal.slv)
            bal.slv({
                mnuBit: {
                    idx: bal.idx,
                    val: 0,
                    dat: { error: 'NO_SERIES_DIR' },
                },
            })
        return cpy
    }

    const entries = fs.readdirSync(seriesBaseDir, { withFileTypes: true })
    const discoveredSlugs = entries
        .filter(
            (e) =>
                e.isDirectory() &&
                fs.existsSync(
                    path.join(seriesBaseDir, e.name, 'series.config.json'),
                ),
        )
        .map((e) => e.name)

    if (discoveredSlugs.length === 0) {
        await emitBusConsoleLog(
            'cns00',
            '>> [WARN] Zero configured series discovered in series/.',
        )
        if (bal.slv)
            bal.slv({
                mnuBit: {
                    idx: bal.idx,
                    val: 0,
                    dat: { error: 'NO_CONFIGURED_SERIES' },
                },
            })
        return cpy
    }

    const lst = [...discoveredSlugs, '[<] CANCEL']

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

    let selected = discoveredSlugs[0]
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
            '>> [SWITCH_SERIES] Series switch cancelled.',
        )
        if (bal.slv)
            bal.slv({
                mnuBit: { idx: bal.idx, val: 0, dat: { cancelled: true } },
            })
        return cpy
    }

    await emitBusConsoleLog(
        'cns00',
        `>> [SWITCH_SERIES] Selected target series: '${selected}'`,
    )

    // Dispatch SELECT_TARGET_SERIES to 34.target.unit
    const targetBit: any = await ste.hunt(ActTar.SELECT_TARGET_SERIES, {
        src: selected,
    })

    if (targetBit?.targetBit?.val === 1) {
        if (bal.slv)
            bal.slv({
                mnuBit: { idx: bal.idx, val: 1, dat: targetBit.targetBit.dat },
            })
    } else {
        const errorMsg = targetBit?.targetBit?.dat?.error || 'BIND_FAILED'
        if (bal.slv)
            bal.slv({
                mnuBit: { idx: bal.idx, val: 0, dat: { error: errorMsg } },
            })
    }

    return cpy
}
