import {
    GenreClassificationEnum,
    type GenreClassification,
} from '../../38.types.unit/val/genre.val.js'
import { SeriesConfigSchema, type SeriesConfig } from './series.schema.js'

export { GenreClassificationEnum, SeriesConfigSchema }
export type { GenreClassification, SeriesConfig }

export default interface Series {
    idx: string
}
