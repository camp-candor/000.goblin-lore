/**
 * packages/299.lore/26.schema.unit/buz/validate.buzz.ts
 *
 * Ontological Schema Router & Entity Validation Engine for 26.schema.unit.
 * Routes incoming untrusted frontmatter to authoritative domain schemas at T_0 = $0.00.
 */

import { z } from 'zod'
import type { SchemaModel } from '../schema.model'
import type SchemaBit from '../fce/schema.bit'
import type State from '../../99.core/state'
import { deepFreeze } from './freeze.buzz'

// ----------------------------------------------------------------------------
// :: Primitive & Domain Schema Definitions (Offline Standalone Contracts)
// ----------------------------------------------------------------------------

export const BasisPointsSchema = z.number().int().min(0).max(10000)

export const CharacterSchema = z
    .object({
        id: z.string().regex(/^char_[a-z0-9_]+$/),
        title: z.string().min(1),
        somatic: z
            .object({
                arms_available: z.number().int().min(0).max(4),
                legs_available: z.number().int().min(0).max(4),
                locomotion_tier: z.enum([
                    'BIPEDAL_NIMBLE',
                    'BIPEDAL_HUNCHED',
                    'BIPEDAL_LIMPING',
                    'IMMOBILE',
                ]),
                somatic_strain_bp: BasisPointsSchema.default(0),
                banned_verbs: z.array(z.string()).default([]),
                conditions: z.array(z.string()).default([]),
            })
            .strict(),
        logistical: z
            .object({
                held_primary: z.string().nullable().default(null),
                held_secondary: z.string().nullable().default(null),
                worn_gear: z.record(z.string(), z.string()).default({}),
                carried: z.array(z.string()).default([]),
                cached: z.array(z.string()).default([]),
                weight_capacity_bp: BasisPointsSchema.default(5000),
            })
            .strict(),
        epistemic: z
            .object({
                paranoia_bp: BasisPointsSchema.default(0),
                paranoia_baseline_bp: BasisPointsSchema.default(0),
                escalation_ceiling: z.number().int().min(1).max(5).default(3),
                strings: z.record(z.string(), z.number().int()).default({}),
                ignorance_firewalls: z.array(z.string()).default([]),
                refusal_vectors: z
                    .array(
                        z.object({
                            trigger: z.string().min(1),
                            mandatory_refusal: z.string().min(1),
                            unavoidable_cost: z.number().int(),
                        }),
                    )
                    .default([]),
            })
            .strict(),
    })
    .strict()

export const LocationSchema = z
    .object({
        location_id: z.string().regex(/^loc_[a-z0-9_]+$/),
        title: z.string().min(1),
        occupancy_limit: z.number().int().positive(),
        temperature_bp: BasisPointsSchema.default(5000),
        ambient_noise_cdb: z.number().int().default(0),
        portals: z
            .array(
                z.object({
                    target_loc: z.string().regex(/^loc_[a-z0-9_]+$/),
                    traversal_cost_bp: BasisPointsSchema.default(100),
                    edge_type: z.enum(['OPEN', 'OCCLUDED', 'LOCKED']),
                }),
            )
            .default([]),
    })
    .strict()

export const PossessionSchema = z
    .object({
        item_id: z.string().regex(/^item_[a-z0-9_]+$/),
        title: z.string().min(1),
        weight_class: z.enum(['SCRAP', 'SHINE', 'WEIGHT']),
        occupies_hands: z.number().int().min(0).max(2).default(1),
        bulk_units: z.number().int().min(1).default(1),
        status_anchor: z.string().nullable().default(null),
    })
    .strict()

export const GrievanceOutcomeDescriptorSchema = z
    .object({
        mechanics: z.string().min(1),
        somatic_cost_bp: BasisPointsSchema.default(0),
        strings_transferred: z.number().int().default(0),
    })
    .strict()

export const GrievanceSchema = z
    .object({
        id: z.string().regex(/^grv_[a-z0-9_]+$/),
        title: z.string().min(1),
        category: z.enum([
            'RESOURCE_HOARDING',
            'STATUS_ANXIETY',
            'SECRET_KEEPING',
            'TERRITORIAL_INTRUSION',
            'GENERATIONAL_SACRIFICE',
        ]),
        participants_primary: z
            .array(z.string().regex(/^char_[a-z0-9_]+$/))
            .length(2),
        intensity_bp: BasisPointsSchema.default(2000),
        escalation_ceiling_bp: BasisPointsSchema.default(8000),
        cooldown_ticks: z.number().int().min(0).default(3),
        spawns_on_max_escalation: z
            .array(
                z.object({
                    type: z.literal('grievance'),
                    target_id: z.string().regex(/^grv_[a-z0-9_]+$/),
                }),
            )
            .default([]),
        outcomes: z
            .object({
                clean_win: GrievanceOutcomeDescriptorSchema,
                costly_win: GrievanceOutcomeDescriptorSchema,
                mutual_wound: GrievanceOutcomeDescriptorSchema,
                backfire: GrievanceOutcomeDescriptorSchema,
            })
            .strict(),
    })
    .strict()

export const UnresolvedMysterySchema = z
    .object({
        topic_id: z.string().regex(/^mystery_[a-z0-9_]+$/),
        description: z.string().min(10),
        forbidden_propositions: z.array(z.string().min(5)).min(1),
        trigger_lemma_sets: z.array(z.array(z.string().min(2)).min(2)).min(1),
        permitted_clue_tokens: z.array(z.string().min(2)).default([]),
        epistemic_horizons: z
            .record(
                z.string().regex(/^char_[a-z0-9_]+$/),
                z.enum([
                    'TOTAL_IGNORANCE',
                    'FALSE_BELIEF',
                    'RUMOR_ONLY',
                    'PARTIAL_OBSERVATION',
                ]),
            )
            .default({}),
        distorted_beliefs: z
            .record(z.string().regex(/^char_[a-z0-9_]+$/), z.string().min(5))
            .default({}),
        human_promotion_condition: z.string().min(10),
    })
    .strict()
    .superRefine((data, ctx) => {
        // Clue-Lemma Disjointness Theorem: permitted clues must not intersect trigger lemmas
        const triggerWords = new Set<string>()
        for (const lemmaSet of data.trigger_lemma_sets) {
            for (const word of lemmaSet) {
                triggerWords.add(word.toLowerCase().trim())
            }
        }

        for (const clue of data.permitted_clue_tokens) {
            const clueLower = clue.toLowerCase().trim()
            const tokens = clueLower.split(/\s+/)
            const collides =
                triggerWords.has(clueLower) ||
                tokens.some((token) => triggerWords.has(token))

            if (collides) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `CLUE_LEMMA_DISJOINTNESS_VIOLATION: Clue token '${clue}' collides with forbidden trigger lemma set.`,
                    path: ['permitted_clue_tokens'],
                })
            }
        }
    })

// ----------------------------------------------------------------------------
// :: Schema Router Lookup Matrix
// ----------------------------------------------------------------------------

export const SCHEMA_ROUTER: Record<string, z.ZodTypeAny> = {
    character: CharacterSchema,
    location: LocationSchema,
    possession: PossessionSchema,
    grievance: GrievanceSchema,
    mystery: UnresolvedMysterySchema,
}

// ----------------------------------------------------------------------------
// :: Entity Validation Buzzer Routine
// ----------------------------------------------------------------------------

export const validateEntity = (
    cpy: SchemaModel,
    bal: SchemaBit,
    ste?: State,
): SchemaModel => {
    const entityType = bal?.src?.toLowerCase().trim() || ''
    const schema = SCHEMA_ROUTER[entityType]

    if (!schema) {
        const errorMsg = `UNKNOWN_ENTITY_SCHEMA: No authoritative schema registered for entity family '${entityType}'. Valid families: ${Object.keys(SCHEMA_ROUTER).join(', ')}`
        bal.val = -1
        bal.lst = [errorMsg]

        cpy.lastValidationReport = {
            status: -1,
            errors: [errorMsg],
            validatedCount: Object.keys(cpy.validatedEntities).length,
        }

        if (bal?.slv) {
            bal.slv({ schBit: bal })
        }
        return cpy
    }

    const parseResult = schema.safeParse(bal.dat)

    if (!parseResult.success) {
        const formattedErrors: string[] = parseResult.error.issues.map(
            (issue) => {
                const issuePath =
                    issue.path.length > 0 ? issue.path.join('.') : 'root'
                const codeTag =
                    issue.code === 'unrecognized_keys'
                        ? ' [unrecognized_keys]'
                        : ''
                return `[${issuePath}]: ${issue.message}${codeTag}`
            },
        )

        bal.val = -1
        bal.lst = formattedErrors

        cpy.lastValidationReport = {
            status: -1,
            errors: formattedErrors,
            validatedCount: Object.keys(cpy.validatedEntities).length,
        }

        if (bal?.slv) {
            bal.slv({ schBit: bal })
        }
        return cpy
    }

    // Parse succeeded: apply deepFreeze to guarantee in-memory V8 immutability
    const validatedPayload = deepFreeze(parseResult.data)
    const entityId =
        (validatedPayload as any).id ||
        (validatedPayload as any).location_id ||
        (validatedPayload as any).item_id ||
        (validatedPayload as any).topic_id ||
        bal.idx

    cpy.validatedEntities[entityId] = validatedPayload
    bal.val = 0
    bal.lst = []

    cpy.lastValidationReport = {
        status: 0,
        errors: [],
        validatedCount: Object.keys(cpy.validatedEntities).length,
    }

    if (bal?.slv) {
        bal.slv({ schBit: bal })
    }

    return cpy
}

export const initSchema = (
    cpy: SchemaModel,
    bal: SchemaBit,
    ste?: State,
): SchemaModel => {
    bal.val = 0
    bal.lst = []
    if (bal?.slv) {
        bal.slv({ schBit: bal })
    }
    return cpy
}

export const updateSchema = (
    cpy: SchemaModel,
    bal: SchemaBit,
    ste?: State,
): SchemaModel => {
    bal.val = 0
    bal.lst = []
    if (bal?.slv) {
        bal.slv({ schBit: bal })
    }
    return cpy
}

export default validateEntity
