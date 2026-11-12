import { z } from 'zod'

export const EpistemologicalStandingEnum = z.enum([
    'ACTIVE_ENDORSED',
    'FLAGGED_FOR_REVIEW',
    'DEPRECATED_ARCHIVED',
])
export type EpistemologicalStanding = z.infer<
    typeof EpistemologicalStandingEnum
>

export const VALID_EPISTEMOLOGICAL_STANDINGS: readonly EpistemologicalStanding[] =
    Object.freeze([
        'ACTIVE_ENDORSED',
        'FLAGGED_FOR_REVIEW',
        'DEPRECATED_ARCHIVED',
    ] as const)

export function isEpistemologicalStanding(
    value: unknown,
): value is EpistemologicalStanding {
    return (
        typeof value === 'string' &&
        VALID_EPISTEMOLOGICAL_STANDINGS.includes(
            value as EpistemologicalStanding,
        )
    )
}

export interface StandingMetadata {
    standing: EpistemologicalStanding
    badge: 'GREEN' | 'YELLOW' | 'RED'
    cascadeOnEnter: boolean
    compileEnforced: boolean
}

export const STANDING_METADATA_REGISTRY: Readonly<
    Record<EpistemologicalStanding, StandingMetadata>
> = Object.freeze({
    ACTIVE_ENDORSED: Object.freeze({
        standing: 'ACTIVE_ENDORSED',
        badge: 'GREEN',
        cascadeOnEnter: false,
        compileEnforced: true,
    }),
    FLAGGED_FOR_REVIEW: Object.freeze({
        standing: 'FLAGGED_FOR_REVIEW',
        badge: 'YELLOW',
        cascadeOnEnter: false,
        compileEnforced: true,
    }),
    DEPRECATED_ARCHIVED: Object.freeze({
        standing: 'DEPRECATED_ARCHIVED',
        badge: 'RED',
        cascadeOnEnter: true,
        compileEnforced: false,
    }),
})

export function getStandingMetadata(
    standing: EpistemologicalStanding,
): StandingMetadata {
    return STANDING_METADATA_REGISTRY[standing]
}

export const CanonFactStandingSchema = z
    .object({
        fact_id: z.string().regex(/^fact_[a-z0-9_]+$/, {
            message:
                '[STANDING_SCHEMA_BREACH] fact_id must match pattern ^fact_[a-z0-9_]+$',
        }),
        entity_id: z.string().regex(/^[a-z]+_[a-z0-9_]+$/, {
            message:
                '[STANDING_SCHEMA_BREACH] entity_id must match standard entity identifier',
        }),
        standing: EpistemologicalStandingEnum,
        in_degree_count: z
            .number()
            .int({
                message:
                    '[FLOAT_PROHIBITED] in_degree_count must be an integer',
            })
            .min(0, {
                message: '[OUT_OF_BOUNDS] in_degree_count cannot be negative',
            }),
        days_since_reconsideration: z
            .number()
            .int({
                message:
                    '[FLOAT_PROHIBITED] days_since_reconsideration must be an integer',
            })
            .min(0, {
                message:
                    '[OUT_OF_BOUNDS] days_since_reconsideration cannot be negative',
            }),
        last_reviewed_epoch: z
            .number()
            .int({
                message:
                    '[FLOAT_PROHIBITED] last_reviewed_epoch must be an integer',
            })
            .nonnegative({
                message:
                    '[OUT_OF_BOUNDS] last_reviewed_epoch cannot be negative',
            })
            .default(0),
        review_note: z.string().min(5).optional(),
    })
    .strict()

export type CanonFactStanding = z.infer<typeof CanonFactStandingSchema>
