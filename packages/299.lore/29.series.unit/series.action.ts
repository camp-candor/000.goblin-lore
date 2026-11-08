import type { Action } from '../99.core/interface/action.interface.js'
import type SeriesBit from './fce/series.bit.js'

export const INIT_SERIES = '[Series action] Init Series'
export class InitSeries implements Action {
    readonly type = INIT_SERIES
    constructor(public bale: SeriesBit) {}
}

export const UPDATE_SERIES = '[Series action] Update Series'
export class UpdateSeries implements Action {
    readonly type = UPDATE_SERIES
    constructor(public bale: SeriesBit) {}
}

export const SCAFFOLD_SERIES_TREE = '[Series action] Scaffold Series Tree'
export class ScaffoldSeriesTree implements Action {
    readonly type = SCAFFOLD_SERIES_TREE
    constructor(public bale: SeriesBit) {}
}

export type Actions = InitSeries | UpdateSeries | ScaffoldSeriesTree
