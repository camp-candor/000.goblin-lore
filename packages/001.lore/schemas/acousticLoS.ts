import { z } from 'zod'

// ---------------------------------------------------------------------------
// 1. Acoustic Occlusion & Propagation Schemas
// ---------------------------------------------------------------------------
export const EdgeOccluderSchema = z
    .object({
        portalId: z.string().min(1),
        cellA: z.string().min(1),
        cellB: z.string().min(1),
        opacityBasisPoints: z.number().int().min(0).max(10000).default(0), // 10,000 = opaque
        dampingCdB: z.number().int().min(0).default(0), // Attenuation in centi-decibels (100 cdB = 1 dB)
        isClosed: z.boolean().default(false),
    })
    .strict()

export const AcousticEmissionSchema = z
    .object({
        eventId: z.string().min(1),
        originRoomId: z.string().min(1),
        sourcePowerCdB: z.number().int().min(0), // e.g., 8,000 cdB = 80 dB
        tick: z.number().int().min(0),
    })
    .strict()

export const AuditoryWitnessCategoryEnum = z.enum([
    'DIRECT_AUDITORY_WITNESS',
    'MUFFLED_EAVESDROPPING',
    'ACOUSTIC_CUTOFF',
])

export const AuditoryPerceptReceiptSchema = z
    .object({
        observerId: z.string().min(1),
        sourceEventId: z.string().min(1),
        observerRoomId: z.string().min(1),
        arrivalIntensityCdB: z.number().int(),
        receivedSnrCdB: z.number().int(),
        witnessCategory: AuditoryWitnessCategoryEnum,
        arrivalBearingHex: z.number().int().min(0).max(5).optional(), // 0 to 5 relative to facing
        isAudible: z.boolean(),
    })
    .strict()

export type EdgeOccluder = z.infer<typeof EdgeOccluderSchema>
export type AcousticEmission = z.infer<typeof AcousticEmissionSchema>
export type AuditoryWitnessCategory = z.infer<
    typeof AuditoryWitnessCategoryEnum
>
export type AuditoryPerceptReceipt = z.infer<
    typeof AuditoryPerceptReceiptSchema
>

// ---------------------------------------------------------------------------
// 2. Optical Line-of-Sight & Spatial Schemas
// ---------------------------------------------------------------------------
export const AxialCoordSchema = z
    .object({
        q: z.number().int(),
        r: z.number().int(),
    })
    .strict()

export const VisualClarityTierEnum = z.enum([
    'FULLY_RESOLVED',
    'UNRESOLVED_AMBIGUOUS',
    'OCCLUDED_BLIND',
])

export const RaycastTraceResultSchema = z
    .object({
        clear: z.boolean(),
        visualClarityScore: z.number().int().min(0).max(1000), // Q_visual in [0, 1000]
        clarityTier: VisualClarityTierEnum,
        traversedCoords: z.array(AxialCoordSchema),
        blockedAt: AxialCoordSchema.nullable(),
        blockReason: z.string().optional(),
    })
    .strict()

export type AxialCoord = z.infer<typeof AxialCoordSchema>
export type VisualClarityTier = z.infer<typeof VisualClarityTierEnum>
export type RaycastTraceResult = z.infer<typeof RaycastTraceResultSchema>
