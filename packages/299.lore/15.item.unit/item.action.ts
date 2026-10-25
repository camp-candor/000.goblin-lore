import type {
    ItemScaffoldInput,
    ItemScaffoldResult,
} from './fce/itemScaffold.bit.js'
import { Action } from '../99.core/interface/action.interface'
import ItemBit from './fce/item.bit'

// Item actions

export const INIT_ITEM = '[Item action] Init Item'
export class InitItem implements Action {
    readonly type = INIT_ITEM
    constructor(public bale: ItemBit) {}
}

export const UPDATE_ITEM = '[Item action] Update Item'
export class UpdateItem implements Action {
    readonly type = UPDATE_ITEM
    constructor(public bale: ItemBit) {}
}

export const SCAFFOLD_POSSESSION_WIZARD =
    '[Item action] Scaffold Possession Wizard'
export class ScaffoldPossessionWizard implements Action {
    readonly type = SCAFFOLD_POSSESSION_WIZARD
    constructor(
        public bale: {
            idx: string
            dat: ItemScaffoldInput
            slv?: (
                res:
                    | ItemScaffoldResult
                    | { mnuBit: { idx: string; src: string } },
            ) => void
        },
    ) {}
}

export type Actions = InitItem | UpdateItem | ScaffoldPossessionWizard
