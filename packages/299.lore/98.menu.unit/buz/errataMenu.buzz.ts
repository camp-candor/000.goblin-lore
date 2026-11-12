import type State from '../../99.core/state.js'
import type { MenuModel } from '../menu.model.js'
import type MenuBit from '../fce/menu.bit.js'
import { verifyErrataLineage } from '../../03.laws.unit/buz/errata.buzz.js'

const UPDATE_CONSOLE = '[Console action] Update Console'

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

export const runErrataMenu = async (
    cpy: MenuModel,
    bal: MenuBit,
    ste?: State,
): Promise<MenuModel> => {
    const seriesSlug =
        bal?.dat?.seriesSlug || cpy.activeSeries || 'under-the-floorboards'
    await emitConsole(
        ste,
        `>> [ERRATA:LINEAGE] Inspecting errata hash-chain for '${seriesSlug}'...`,
    )

    const report = verifyErrataLineage(seriesSlug)

    if (report.valid) {
        const headShort = report.headHash.slice(0, 8)
        await emitConsole(
            ste,
            `>> [ERRATA:CHAIN_OK] Verified ${report.totalRecords} historical retcon(s) | Head: ${headShort}... Status: 0`,
        )
        cpy.statusMessage = 'ERRATA_CHAIN_VALID'
    } else {
        for (const err of report.errors) {
            await emitConsole(ste, `:: [ERRATA:DISCONTINUITY] ${err}`)
        }
        cpy.statusMessage = 'ERRATA_DISCONTINUITY'
    }

    if (bal?.slv) {
        bal.slv({
            mnuBit: {
                idx: 'run-errata-menu',
                val: report.valid ? 0 : -1,
                dat: report,
            },
        })
    }
    return cpy
}
