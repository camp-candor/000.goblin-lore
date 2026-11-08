import type Series from './fce/series.interface.js'
import type SeriesBit from './fce/series.bit.js'
import type { SeriesConfig } from './fce/series.schema.js'

export class SeriesModel implements Series {
    idx: string = '29.series'
    seriesBitList: SeriesBit[] = []
    seriesBits: Record<string, SeriesBit> = {}
    activeConfigs: Record<string, SeriesConfig> = {}
}
