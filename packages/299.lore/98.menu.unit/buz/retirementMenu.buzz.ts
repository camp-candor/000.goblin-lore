import type State from '../../99.core/state.js'
import type { MenuModel } from '../menu.model.js'
import type MenuBit from '../fce/menu.bit.js'
import { retireCanonicalEntity } from '../../04.logistic.unit/buz/relocateRetired.buzz.js'

const UPDATE_CONSOLE = '[Console action] Update Console'
export const RETIRE_CANONICAL_ENTITY_LABEL = '[R] RETIRE CANONICAL ENTITY'

async function emitConsole(
    ste: State | undefined,
    line: string,
): Promise<void> {
    const lib = (globalThis as any).LIBRARY || (global as any).LIBRARY
    if (lib && typeof lib.hunt === 'function') {
        await lib
            .hunt(UPDATE_CONSOLE, { idx: 'cns00', src: line })
            .catch(() => {})
    } else if (ste && typeof ste.hunt === 'function') {
        await ste
            .hunt(UPDATE_CONSOLE, { idx: 'cns00', src: line })
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
    const targetEntityId = dat.entityId || 'char_old_snag'
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

    const receipt = await retireCanonicalEntity({
        seriesSlug,
        characterId: targetEntityId,
        departureType: dat.departureType || 'death',
        resolutionCause:
            dat.resolutionCause ||
            'Collapsed inside culvert siphon during Episode 105',
        departureEpoch:
            typeof dat.departureEpoch === 'number' ? dat.departureEpoch : 105,
        itemTransfers,
        repoRoot: dat.repoRoot,
    })

    const receiptLine = receipt.success
        ? '>> [RETIRE:OK] Relocated ' +
          targetEntityId +
          ' to _retired/ | Seal: ' +
          receipt.rootMerkleHash.slice(0, 12)
        : ':: [RETIRE:FAIL] ' +
          (receipt.errors[0] || 'Retirement blocked for ' + targetEntityId)

    await emitConsole(ste, receiptLine)
    cpy.activeSelection = RETIRE_CANONICAL_ENTITY_LABEL
    cpy.statusMessage = receiptLine

    if (bal.slv) {
        bal.slv({
            mnuBit: {
                idx: 'open-retirement-menu',
                val: receipt.success ? 1 : 0,
                src: targetEntityId,
                dat: { receipt, receiptLine },
            },
        })
    }
    return cpy
}
