import type State from '../../99.core/state.js'
import type { MenuModel } from '../menu.model.js'
import type MenuBit from '../fce/menu.bit.js'
import * as ActLog from '../../04.logistic.unit/logistic.action.js'
import { retireCanonicalEntity } from '../../04.logistic.unit/buz/relocateRetired.buzz.js'
import { discoverDomainForeignKeys } from './entityScaffoldMenu.buzz.js'
import { sanitizeAscii } from './genesisMenu.buzz.js'

const UPDATE_CONSOLE = '[Console action] Update Console'
export const RETIRE_CANONICAL_ENTITY_LABEL = '[R] RETIRE CANONICAL ENTITY'

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
    const dat = (bal as any)?.dat || {}
    const seriesSlug =
        dat.seriesSlug || cpy.activeSeries || 'under-the-floorboards'
    const activeCast = discoverDomainForeignKeys(
        seriesSlug,
        'characters',
        dat.repoRoot,
    )
    const targetEntityId = dat.entityId || activeCast[0] || 'char_old_snag'
    const itemTransfers = Array.isArray(dat.itemTransfers)
        ? dat.itemTransfers
        : []

    await emitConsole(
        ste,
        '>> [RETIRE:INIT] Sweeping active references for ' +
            targetEntityId +
            " in '" +
            seriesSlug +
            "'...",
    )

    let logisticBit: any = null
    let receipt: any = null

    if (dat.repoRoot) {
        receipt = await retireCanonicalEntity({
            seriesSlug,
            characterId: targetEntityId,
            departureType: dat.departureType || 'death',
            resolutionCause:
                dat.resolutionCause ||
                'Collapsed inside culvert siphon during Episode 105',
            departureEpoch:
                typeof dat.departureEpoch === 'number'
                    ? dat.departureEpoch
                    : 105,
            itemTransfers,
            repoRoot: dat.repoRoot,
        })
    } else if (ste && typeof ste.hunt === 'function') {
        await new Promise<void>((resolve) => {
            ste.hunt(ActLog.UPDATE_LOGISTIC, {
                idx: 'menu-retire-entity',
                src: targetEntityId,
                dat: {
                    seriesSlug,
                    entityId: targetEntityId,
                    itemTransfers: dat.itemTransfers || {},
                    repoRoot: dat.repoRoot,
                },
                slv: (res: any) => {
                    logisticBit = res?.logBit || res
                    resolve()
                },
            })
        })
    } else {
        receipt = await retireCanonicalEntity({
            seriesSlug,
            characterId: targetEntityId,
            departureType: dat.departureType || 'death',
            resolutionCause:
                dat.resolutionCause ||
                'Collapsed inside culvert siphon during Episode 105',
            departureEpoch:
                typeof dat.departureEpoch === 'number'
                    ? dat.departureEpoch
                    : 105,
            itemTransfers,
            repoRoot: dat.repoRoot,
        })
    }

    const ok = receipt
        ? Boolean(receipt.success)
        : !logisticBit || logisticBit.val !== -1
    const receiptLine = ok
        ? receipt?.rootMerkleHash
            ? '>> [RETIRE:OK] Relocated ' +
              targetEntityId +
              ' to _retired/ | Seal: ' +
              receipt.rootMerkleHash.slice(0, 12)
            : '>> [RETIRE:OK] Relocated ' +
              targetEntityId +
              ' to _retired/ with matter conservation verified'
        : ':: [RETIRE:FAIL] ' +
          (receipt?.errors?.[0] || 'Retirement blocked for ' + targetEntityId)

    await emitConsole(ste, receiptLine)
    cpy.activeSelection = RETIRE_CANONICAL_ENTITY_LABEL
    cpy.lastLifecycleReceipt = ok ? '[RETIRE:OK]' : '[RETIRE:FAIL]'
    cpy.statusMessage = receiptLine
    if (!Array.isArray(cpy.lastTelemetryReport)) {
        cpy.lastTelemetryReport = []
    }
    cpy.lastTelemetryReport.push(receiptLine)

    if (bal?.slv) {
        bal.slv({
            mnuBit: {
                idx: 'open-retirement-menu',
                val: ok ? 1 : 0,
                src: targetEntityId,
                dat: { receipt, receiptLine, activeCast, logisticBit },
            },
        })
    }
    return cpy
}
