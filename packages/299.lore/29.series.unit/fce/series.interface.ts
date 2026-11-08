import type SeriesBit from './series.bit.js'

export default interface Series {
  idx: string
  seriesBitList: SeriesBit[]
  seriesBits: Record<string, SeriesBit>
}
