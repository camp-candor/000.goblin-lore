import type SeriesBit from './series.bit.js'
import type { SomaticArchetype } from '../val/archetype.val.js'

export default interface Series {
    idx?: string
    seriesBitList?: SeriesBit[]
    seriesBits?: Record<string, any>
    archetypeRegistry?: Record<string, SomaticArchetype>
}
