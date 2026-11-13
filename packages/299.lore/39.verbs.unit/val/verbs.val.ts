import { z } from 'zod'
import { VERB_FAMILIES } from '../fce/verbs.schema.js'

export const KineticVerbLemmaSchema = z.string().regex(/^[A-Z0-9_]+$/, {
    message: '[VERB_LEMMA_BREACH] kinetic verb lemma must match ^[A-Z0-9_]+$',
})

export { VERB_FAMILIES }

export const DEFAULT_FORBIDDEN_VERBS_BY_GENRE: Record<string, string[]> = {
    LOW_FANTASY_FARCE: ['fly'],
    STANDARD: ['fly'],
    SUPERHERO_URBAN_VIGILANTE: [],
    SOUTHERN_GOTHIC_INDUSTRIAL: ['fly'],
    HARD_SCIFI_VACUUM: ['fly'],
}
