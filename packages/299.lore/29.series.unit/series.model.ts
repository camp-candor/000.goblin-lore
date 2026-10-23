import type Series from './fce/series.interface.js'
import type SeriesBit from './fce/series.bit.js'
import {
    type SomaticArchetype,
    DEFAULT_ARCHETYPES,
} from './val/archetype.val.js'

export class SeriesModel implements Series {
    idx: string = '29.series.unit'
    seriesBitList: SeriesBit[] = []
    seriesBits: Record<string, any> = {}
    archetypeRegistry: Record<string, SomaticArchetype> = {
        ...DEFAULT_ARCHETYPES,
    }
}
