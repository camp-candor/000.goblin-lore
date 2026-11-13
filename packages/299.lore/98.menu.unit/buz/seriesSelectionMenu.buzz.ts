import type State from '../../99.core/state.js'
import type { MenuModel } from '../menu.model.js'
import type MenuBit from '../fce/menu.bit.js'
import { scanVoidState } from '../../29.series.unit/buz/series.discovery.buzz.js'
import { resolveLibraryBus } from './blessedModal.buzz.js'

const UPDATE_GRID = '[Grid action] Update Grid'
const OPEN_CHOICE = '[Open action] Open Choice'
const UPDATE_CONSOLE = '[Console action] Update Console'

function emitConsole(ste: State | undefined, line: string): void {
    const cleanLine = String(line || '')
        .replace(/[^\x20-\x7E]/g, '')
        .trim()
    const lib = resolveLibraryBus()
    if (lib && typeof lib.hunt === 'function') {
        lib.hunt(UPDATE_CONSOLE, { idx: 'cns00', src: cleanLine })
        return
    }
    if (ste && typeof ste.hunt === 'function') {
        ste.hunt(UPDATE_CONSOLE, { idx: 'cns00', src: cleanLine })
    }
}

export const promptSeriesSelectionModal = async (
    cpy: MenuModel,
    bal: MenuBit,
    ste?: State,
): Promise<MenuModel> => {
    const lib = resolveLibraryBus()
    const scanResult = scanVoidState()

    if (scanResult.isVoidState) {
        emitConsole(
            ste,
            '>> [SERIES:DISCOVERY] [WARN] Void state detected: No series found in series/.',
        )
        emitConsole(
            ste,
            '>> [SERIES:DISCOVERY] Please initialize your first series using the Genesis Wizard.',
        )
        if (bal?.slv) {
            bal.slv({
                mnuBit: {
                    idx: 'series-discovery-void',
                    val: 0,
                    dat: scanResult,
                },
            })
        }
        return cpy
    }

    const choices = (scanResult.discoveredSlugs as string[]).map(
        (slug, idx) => `[${idx + 1}] ${slug}`,
    )
    emitConsole(
        ste,
        `>> [SERIES:DISCOVERY] Discovered ${scanResult.discoveredSlugs.length} series namespace(s) on disk.`,
    )

    let selectedChoice = choices[0]
    if (lib && typeof lib.hunt === 'function') {
        const gridBit: any = await lib.hunt(UPDATE_GRID, {
            x: 0,
            y: 4,
            xSpan: 4,
            ySpan: 10,
        })
        const choiceBit: any = await lib.hunt(OPEN_CHOICE, {
            dat: {
                clr0: 0,
                clr1: 3,
                cb: async (choice: string) => {
                    emitConsole(ste, `:: [SERIES_CHOICE] ${choice}`)
                },
            },
            src: 'VERTICAL',
            lst: [...choices, '[<] RETURN TO LORE MENU'],
            net: gridBit?.grdBit?.dat,
        })
        selectedChoice = choiceBit?.chcBit?.src || choices[0]
    }

    if (selectedChoice === '[<] RETURN TO LORE MENU' || !selectedChoice) {
        emitConsole(
            ste,
            '>> [SERIES:DISCOVERY] Series selection cancelled by operator.',
        )
        if (bal?.slv) {
            bal.slv({ mnuBit: { idx: 'series-discovery-cancel', val: 0 } })
        }
        return cpy
    }

    const cleanSlug = selectedChoice.replace(/^\[\d+\]\s*/, '').trim()
    emitConsole(
        ste,
        `>> [SERIES:ACTIVE] Bound active series namespace to: ${cleanSlug} [OK]`,
    )

    cpy.activeSelection = 'PROMPT_SERIES_SELECTION'
    cpy.activeSeries = cleanSlug
    cpy.statusMessage = `Active Series: ${cleanSlug}`

    if (bal?.slv) {
        bal.slv({
            mnuBit: {
                idx: 'series-discovery-success',
                val: 1,
                src: cleanSlug,
                dat: { scanResult, activeSlug: cleanSlug },
            },
        })
    }

    return cpy
}
