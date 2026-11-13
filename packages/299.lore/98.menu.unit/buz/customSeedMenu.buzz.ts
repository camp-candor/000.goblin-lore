import type State from '../../99.core/state.js'
import type { MenuModel } from '../menu.model.js'
import type MenuBit from '../fce/menu.bit.js'
import { resolveLibraryBus } from '../../98.menu.unit/buz/blessedModal.buzz.js'

const UPDATE_CONSOLE = '[Console action] Update Console'
const OPEN_INPUT = '[Open action] Open Input'
const UPDATE_GRID = '[Grid action] Update Grid'

export const promptCustomSeedMenu = async (
    cpy: MenuModel,
    bal: MenuBit,
    ste?: State,
): Promise<MenuModel> => {
    const lib = resolveLibraryBus()
    emitConsole(
        ste,
        '>> [CUSTOM_SEED] Launching custom seed identifier injection...',
    )

    function emitConsole(s: State | undefined, line: string) {
        const clean = String(line)
            .replace(/[^\x20-\x7E]/g, '')
            .trim()
        if (lib && typeof lib.hunt === 'function') {
            lib.hunt(UPDATE_CONSOLE, { idx: 'cns00', src: clean })
            return
        }
        if (s && typeof s.hunt === 'function') {
            s.hunt(UPDATE_CONSOLE, { idx: 'cns00', src: clean })
        }
    }

    if (bal?.slv) {
        bal.slv({ mnuBit: { idx: 'prompt-custom-seed', val: 1 } })
    }
    return cpy
}
