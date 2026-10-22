import { Action } from '../99.core/interface/action.interface.js'
import LoreBit from './fce/lore.bit.js'

// lore actions

export const INIT_LORE = '[Lore action] Init Lore'
export class InitLore implements Action {
    readonly type = INIT_LORE
    constructor(public bale: LoreBit) {}
}

export const UPDATE_LORE = '[Lore action] Update Lore'
export class UpdateLore implements Action {
    readonly type = UPDATE_LORE
    constructor(public bale: LoreBit) {}
}

export const TEST_LORE = '[Test action] Test Lore'
export class TestLore implements Action {
    readonly type = TEST_LORE
    constructor(public bale: LoreBit) {}
}

export const INTELLECT_LORE = '[Intellect action] Intellect Lore'
export class IntellectLore implements Action {
    readonly type = INTELLECT_LORE
    constructor(public bale: LoreBit) {}
}

export const VISION_LORE = '[Vision action] Vision Lore'
export class VisionLore implements Action {
    readonly type = VISION_LORE
    constructor(public bale: LoreBit) {}
}

export const LIST_LORE = '[List action] List Lore'
export class ListLore implements Action {
    readonly type = LIST_LORE
    constructor(public bale: LoreBit) {}
}

export type Actions =
    | InitLore
    | UpdateLore
    | TestLore
    | IntellectLore
    | VisionLore
    | ListLore
