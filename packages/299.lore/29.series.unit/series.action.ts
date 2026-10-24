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

export const RESOLVE_ARCHETYPE = '[Series action] Resolve Archetype'
export class ResolveArchetype implements Action {
    readonly type = RESOLVE_ARCHETYPE
    constructor(public bale: SeriesBit) {}
}

export const CHECK_SERIES_SLUG_AVAILABILITY =
    '[Series action] Check Series Slug Availability'
export class CheckSeriesSlugAvailability implements Action {
    readonly type = CHECK_SERIES_SLUG_AVAILABILITY
    constructor(public bale: SeriesBit) {}
}

export const SET_ACTIVE_SERIES = 'series/SET_ACTIVE_SERIES'
export const RESOLVE_SERIES_PATH = 'series/RESOLVE_SERIES_PATH'

export interface SetActiveSeriesPayload {
    readonly seriesSlug: string
    readonly customRepoRoot?: string
}

export interface SetActiveSeriesAction {
    readonly type: typeof SET_ACTIVE_SERIES
    readonly payload: SetActiveSeriesPayload
}

export type Actions =
    InitSeries | UpdateSeries | ResolveArchetype | CheckSeriesSlugAvailability
