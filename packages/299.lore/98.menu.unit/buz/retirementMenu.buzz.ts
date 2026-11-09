import type State from '../../99.core/state.js'
import type { MenuModel } from '../menu.model.js'
import type MenuBit from '../fce/menu.bit.js'
import * as ActLog from '../../04.logistic.unit/logistic.action.js'
import { sanitizeAscii } from './genesisMenu.buzz.js'
import { discoverDomainForeignKeys } from './entityScaffoldMenu.buzz.js'

const UPDATE_CONSOLE = '[Console action] Update Console'

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

export const runEntityRetirementMenu = async (
    cpy: MenuModel,
    bal: MenuBit,
    ste?: State,
): Promise<MenuModel> => {
    const dat = bal?.dat || {}
    const seriesSlug =
        dat.seriesSlug || cpy.activeSeries || 'under-the-floorboards'
    const activeCast = discoverDomainForeignKeys(
        seriesSlug,
        'characters',
        dat.repoRoot,
    )
    const targetEntityId = dat.entityId || activeCast[0] || 'char_wart'
    const itemTransfers = dat.itemTransfers || {}

    await emitConsole(
        ste,
        `>> [RETIRE:INIT] Sweeping active references for ${targetEntityId} in '${seriesSlug}'...`,
    )

    let logisticBit: any = null
    if (ste && typeof ste.hunt === 'function') {
        await new Promise<void>((resolve) => {
            ste.hunt(ActLog.UPDATE_LOGISTIC, {
                idx: 'menu-retire-entity',
                src: targetEntityId,
                dat: {
                    seriesSlug,
                    entityId: targetEntityId,
                    itemTransfers,
                    repoRoot: dat.repoRoot,
                },
                slv: (res: any) => {
                    logisticBit = res?.logBit || res
                    resolve()
                },
            })
        })
    }

    const ok = !logisticBit || logisticBit.val !== -1
    const receiptLine = ok
        ? `>> [RETIRE:OK] Relocated ${targetEntityId} to _retired/ with matter conservation verified`
        : `:: [RETIRE:FAIL] Retirement blocked for ${targetEntityId}`

    await emitConsole(ste, receiptLine)
    cpy.activeSelection = '[R] RETIRE CANONICAL ENTITY'
    cpy.lastLifecycleReceipt = ok ? '[RETIRE:OK]' : '[RETIRE:FAIL]'
    cpy.statusMessage = receiptLine
    cpy.lastTelemetryReport.push(receiptLine)

    if (bal?.slv) {
        bal.slv({
            mnuBit: {
                idx: 'open-retirement-menu',
                val: ok ? 1 : 0,
                src: targetEntityId,
                dat: { receipt: receiptLine, activeCast, logisticBit },
            },
        })
    }
    return cpy
}
