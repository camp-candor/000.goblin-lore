import { SeriesModel } from '../series.model.js'
import type SeriesBit from '../fce/series.bit.js'
import type State from '../../99.core/state.js'

export const initSeries = (
    cpy: SeriesModel,
    bal: SeriesBit,
    ste?: State,
): SeriesModel => {
    cpy.idx = bal.idx || '29.series'
    if (bal.slv) {
        bal.slv({ srsBit: { idx: 'init-series', val: 0 } })
    }
    return cpy
}

export const updateSeries = (
    cpy: SeriesModel,
    bal: SeriesBit,
    ste?: State,
): SeriesModel => {
    if (bal.slv) {
        bal.slv({ srsBit: { idx: 'update-series', val: 0 } })
    }
    return cpy
}
