import type { Action } from '../../99.core/interface/action.interface.js'
import type MenuBit from '../fce/menu.bit.js'

export const OPEN_SERIES_GENESIS_WIZARD =
    '[Menu action] Open Series Genesis Wizard'
export class OpenSeriesGenesisWizard implements Action {
    readonly type = OPEN_SERIES_GENESIS_WIZARD
    constructor(public bale: MenuBit) {}
}

export const CLOSE_SERIES_GENESIS_WIZARD =
    '[Menu action] Close Series Genesis Wizard'
export class CloseSeriesGenesisWizard implements Action {
    readonly type = CLOSE_SERIES_GENESIS_WIZARD
    constructor(public bale: MenuBit) {}
}

export type GenesisMenuActions =
    OpenSeriesGenesisWizard | CloseSeriesGenesisWizard
