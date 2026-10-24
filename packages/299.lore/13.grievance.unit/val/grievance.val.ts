import { z } from 'zod'
import { ScaleStepSchema } from '../../35.threshold.unit/val/threshold.val.js'

export const GrievanceIdentifierSchema = z
    .string()
    .regex(/^grv_[a-z0-9_]+$/, 'Grievance ID must match regex ^grv_[a-z0-9_]+$')

export const ThematicCategorySchema = z.enum([
    'resource_scarcity',
    'status_humiliation',
    'territory_breach',
    'broken_obligation',
    'somatic_injury',
    'paranoia_suspicion',
    'contraband_theft',
])

export const SpawnEscalationTargetSchema = z
    .string()
    .regex(
        /^(grievance|secret):[a-z0-9_]+$/,
        'Spawn target must match ^(grievance|secret):[a-z0-9_]+$',
    )

export const GrievanceFrontmatterSchema = z
    .object({
        id: GrievanceIdentifierSchema,
        type: z.literal('grievance'),
        title: z.string().min(1, 'Grievance title is required'),
        category: ThematicCategorySchema,
        participants_primary: z
            .tuple([
                z
                    .string()
                    .regex(
                        /^char_[a-z0-9_]+$/,
                        'Participant A must match ^char_[a-z0-9_]+$',
                    ),
                z
                    .string()
                    .regex(
                        /^char_[a-z0-9_]+$/,
                        'Participant B must match ^char_[a-z0-9_]+$',
                    ),
            ])
            .refine(([a, b]) => a !== b, {
                message:
                    'Participants in a dyadic grievance must be distinct entities',
            }),
        physical_anchor_prop: z
            .string()
            .regex(
                /^item_[a-z0-9_]+$/,
                'Physical anchor must match ^item_[a-z0-9_]+$',
            ),
        intensity_min: ScaleStepSchema,
        intensity_max: ScaleStepSchema,
        cooldown_ticks: z
            .number()
            .int()
            .min(1, 'Cooldown ticks must be a positive integer'),
        spawns_on_max_escalation: SpawnEscalationTargetSchema.optional(),
        created_epoch: z.number().int().min(0).default(0),
        last_updated_epoch: z.number().int().min(0).default(0),
    })
    .strict()
    .refine((data) => data.intensity_max >= data.intensity_min, {
        message: 'intensity_max must be greater than or equal to intensity_min',
        path: ['intensity_max'],
    })

export type GrievanceFrontmatter = z.infer<typeof GrievanceFrontmatterSchema>
