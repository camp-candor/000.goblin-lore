import type SeriesBit from './series.bit.js'
import type { SeriesConfig } from './series.schema.js'

export default interface Series {
    idx: string
    seriesBitList: SeriesBit[]
    seriesBits: Record<string, SeriesBit>
    activeConfigs: Record<string, SeriesConfig>
}
