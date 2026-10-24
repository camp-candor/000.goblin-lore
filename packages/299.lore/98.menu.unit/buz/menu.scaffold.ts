import { MenuModel } from '../menu.model.js'
import type MenuBit from '../fce/menu.bit.js'
import type State from '../../99.core/state.js'
import * as ActChr from '../../02.character.unit/character.action.js'
import * as ActLoc from '../../01.location.unit/location.action.js'

const UPDATE_CONSOLE = '[Console action] Update Console'

export const scaffoldCharacter = async (
    cpy: MenuModel,
    bal: MenuBit,
    ste: State,
): Promise<MenuModel> => {
    await ste.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: '>> [SCAFFOLD:CHARACTER] Launching Character Vector Interview...',
    })

    // Dispatch into 02.character.unit wizard
    await ste.hunt(ActChr.SCAFFOLD_CHARACTER_WIZARD, {
        idx: 'menu-char-scaffold',
        dat: bal.dat,
    })

    if (bal.slv)
        bal.slv({ mnuBit: { idx: 'scaffold-character', src: 'completed' } })
    return cpy
}

export const scaffoldLocation = async (
    cpy: MenuModel,
    bal: MenuBit,
    ste: State,
): Promise<MenuModel> => {
    await ste.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: '>> [SCAFFOLD:LOCATION] Launching Spatial Location Interview...',
    })

    // Dispatch into 01.location.unit wizard
    await ste.hunt(ActLoc.SCAFFOLD_LOCATION_WIZARD, {
        idx: 'menu-loc-scaffold',
        dat: bal.dat,
    })

    if (bal.slv)
        bal.slv({ mnuBit: { idx: 'scaffold-location', src: 'completed' } })
    return cpy
}
