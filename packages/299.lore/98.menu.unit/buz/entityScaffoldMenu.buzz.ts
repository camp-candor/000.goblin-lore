import fs from 'node:fs'
import path from 'node:path'
import type State from '../../99.core/state.js'
import type { MenuModel } from '../menu.model.js'
import type MenuBit from '../fce/menu.bit.js'
import * as ActEnt from '../../09.entity.unit/entity.action.js'
import { resolveRepoRoot } from '../../29.series.unit/buz/scaffoldSeriesTree.buzz.js'
import { sanitizeAscii } from './genesisMenu.buzz.js'

const UPDATE_CONSOLE = '[Console action] Update Console'

function emitConsole(ste: State | undefined, line: string): void {
    const clean = sanitizeAscii(line)
    const lib = (globalThis as any).LIBRARY || (global as any).LIBRARY
    if (lib && typeof lib.hunt === 'function') {
        lib.hunt(UPDATE_CONSOLE, { idx: 'cns00', src: clean }).catch(() => {})
    } else if (ste && typeof ste.hunt === 'function') {
        ste.hunt(UPDATE_CONSOLE, { idx: 'cns00', src: clean }).catch(() => {})
    }
}

export function discoverDomainForeignKeys(
    seriesSlug: string,
    domain: 'characters' | 'locations' | 'possessions' | 'grievances',
    repoRoot: string = resolveRepoRoot(),
): string[] {
    const dir = path.join(repoRoot, 'series', seriesSlug, domain)
    if (!fs.existsSync(dir)) return []
    return fs
        .readdirSync(dir)
        .filter((f) => f.endsWith('.md'))
        .map((f) => path.basename(f, '.md'))
        .sort()
}

export const runEntityScaffoldMenu = (
    cpy: MenuModel,
    bal: MenuBit,
    ste?: State,
): MenuModel => {
    const dat = bal?.dat || {}
    const seriesSlug =
        dat.seriesSlug || cpy.activeSeries || 'under-the-floorboards'
    const domain = dat.domain || 'characters'
    const entityId = dat.entityId || 'char_knuckle'

    const existingLocations = discoverDomainForeignKeys(
        seriesSlug,
        'locations',
        dat.repoRoot,
    )
    emitConsole(
        ste,
        `>> [SCAFFOLD:INIT] Domain=${domain} ID=${entityId} ActiveLocations=${existingLocations.length}`,
    )

    let entityBit: any = null
    if (ste && typeof ste.hunt === 'function') {
        ste.hunt(ActEnt.UPDATE_ENTITY, {
            idx: 'menu-scaffold-entity',
            src: entityId,
            dat: {
                seriesSlug,
                domain,
                entityId,
                frontmatter: dat.frontmatter || {
                    id: entityId,
                    type: 'character',
                },
                proseBody:
                    dat.proseBody || '## Wants (surface)\nSurvive the shift.\n',
                repoRoot: dat.repoRoot,
            },
            slv: (res: any) => {
                entityBit = res?.entBit || res
            },
        })
    }

    const ok = !entityBit || entityBit.val !== -1
    const receiptLine = ok
        ? `>> [SCAFFOLD:OK] Byte-0 dossier validated for ${entityId} in ${seriesSlug}/${domain}`
        : `:: [SCAFFOLD:FAIL] Pre-flight check rejected ${entityId}`

    emitConsole(ste, receiptLine)
    cpy.activeSelection = '[S] ATOMIC ENTITY SCAFFOLDER'
    cpy.lastLifecycleReceipt = ok ? '[SCAFFOLD:OK]' : '[SCAFFOLD:FAIL]'
    cpy.statusMessage = receiptLine
    if (!Array.isArray(cpy.lastTelemetryReport)) {
        cpy.lastTelemetryReport = []
    }
    cpy.lastTelemetryReport.push(receiptLine)

    if (bal?.slv) {
        bal.slv({
            mnuBit: {
                idx: 'open-scaffold-menu',
                val: ok ? 1 : 0,
                src: entityId,
                dat: { receipt: receiptLine, existingLocations, entityBit },
            },
        })
    }
    return cpy
}
