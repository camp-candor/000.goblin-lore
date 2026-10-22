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

export type Actions = InitItem | UpdateItem
