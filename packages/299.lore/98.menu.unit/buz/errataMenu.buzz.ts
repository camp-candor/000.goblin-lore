import path from 'node:path'
import type State from '../../99.core/state.js'
import type { MenuModel } from '../menu.model.js'
import type MenuBit from '../fce/menu.bit.js'
import * as ActLaw from '../../03.laws.unit/laws.action.js'
import { sanitizeAscii } from './genesisMenu.buzz.js'

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

export const runErrataMenu = async (
    cpy: MenuModel,
    bal: MenuBit,
    ste?: State,
): Promise<MenuModel> => {
    const dat = bal?.dat || {}
    const seriesSlug =
        dat.seriesSlug || cpy.activeSeries || 'under-the-floorboards'
    const repoRoot = dat.repoRoot || process.cwd()
    const seriesDir = path.join(repoRoot, 'series', seriesSlug)

    const recordCandidate = dat.record || {
        errata_id: 'err_siphon_aperture_01',
        sequence_number: 1,
        classification: 'FACTUAL_CONTRADICTION',
        superseded_merkle_hash: '0'.repeat(64),
        active_merkle_hash: '1'.repeat(64),
        superseded_commit_sha: 'a'.repeat(40),
        active_commit_sha: 'b'.repeat(40),
        affected_entity_ids: ['loc_culvert_siphon'],
        historical_episodes: ['ep001'],
        rationale:
            'Canonicalized culvert siphon aperture to 8 inches across all blueprints.',
        recorded_at_epoch: 100,
    }

    await emitConsole(
        ste,
        `>> [ERRATA:INIT] Recording canonical errata entry ${recordCandidate.errata_id} for '${seriesSlug}'...`,
    )

    let lawsBit: any = null
    if (ste && typeof ste.hunt === 'function') {
        await new Promise<void>((resolve) => {
            ste.hunt(ActLaw.UPDATE_LAWS, {
                idx: 'menu-append-errata',
                src: seriesDir,
                dat: { seriesDir, record: recordCandidate },
                slv: (res: any) => {
                    lawsBit = res?.lawBit || res
                    resolve()
                },
            })
        })
    }

    const ok = !lawsBit || lawsBit.val !== -1
    const receiptLine = ok
        ? `>> [ERRATA:SEALED] Appended ${recordCandidate.errata_id} | Head=${recordCandidate.active_merkle_hash.slice(0, 12)}`
        : `:: [ERRATA:FAIL] Errata append rejected`

    await emitConsole(ste, receiptLine)
    cpy.activeSelection = '[X] RECORD CANONICAL ERRATA ENTRY'
    cpy.lastLifecycleReceipt = ok ? '[ERRATA:SEALED]' : '[ERRATA:FAIL]'
    cpy.statusMessage = receiptLine
    cpy.lastTelemetryReport.push(receiptLine)

    if (bal?.slv) {
        bal.slv({
            mnuBit: {
                idx: 'open-errata-menu',
                val: ok ? 1 : 0,
                src: recordCandidate.errata_id,
                dat: { receipt: receiptLine, recordCandidate, lawsBit },
            },
        })
    }
    return cpy
}
