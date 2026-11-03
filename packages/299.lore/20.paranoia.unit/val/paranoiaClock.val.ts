import { z } from 'zod'

export function assertIntegerMetric(
    value: unknown,
    fieldName: string,
): asserts value is number {
    if (typeof value !== 'number' || !Number.isSafeInteger(value)) {
        throw new Error(
            `[FLOAT_PROHIBITED] ${fieldName} must be a safe integer primitive. Received: ${value}`,
        )
    }
}

export function clampBps(value: number): number {
    assertIntegerMetric(value, 'clampBps input')
    if (value < 0) return 0
    if (value > 10000) return 10000
    return value
}

export const ParanoiaMeterStateSchema = z
    .object({
        clockId: z.string().regex(/^clk_[a-z0-9_]+$/),
        entityId: z.string().regex(/^char_[a-z0-9_]+$/),
        clockName: z.string().min(1),
        currentBps: z.number().int().min(0).max(10000),
        baselineBps: z.number().int().min(0).max(10000),
        maxCeilingBps: z.number().int().min(0).max(10000).default(10000),
        decayRatePerTick: z.number().int().min(0).max(10000),
        acousticCouplingCoeff: z.number().int().min(0).max(10000).default(5000), // 0.50x transfer default
        thresholdLimitBps: z.number().int().min(0).max(10000).default(8000),
        ambientDarknessLock: z.boolean().default(false),
        isTriggered: z.boolean().default(false),
        updatedAtEpoch: z.number().int().nonnegative().default(0),
    })
    .strict()
    .superRefine((val, ctx) => {
        if (val.baselineBps > val.thresholdLimitBps) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message:
                    '[PARANOIA_SCHEMA_BREACH] baselineBps cannot exceed thresholdLimitBps',
                path: ['baselineBps'],
            })
        }
        if (val.currentBps < val.baselineBps) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message:
                    '[PARANOIA_SCHEMA_BREACH] currentBps cannot fall below baselineBps',
                path: ['currentBps'],
            })
        }
    })

export const AcousticTransientEventSchema = z
    .object({
        eventId: z.string().min(1),
        sourceIntensityCdB: z.number().int().min(0).max(15000), // e.g. 12000 cdB = 120.0 dB
        partitionTransmissionLossCdB: z
            .number()
            .int()
            .min(0)
            .max(10000)
            .default(0),
        ambientNoiseFloorCdB: z.number().int().min(0).max(10000).default(1500), // 15.0 dB
        auditoryDebuffCdB: z.number().int().min(0).max(10000).default(0),
        snrMinCdB: z.number().int().min(0).max(5000).default(600), // 6.0 dB SNR gate
        soundDescription: z.string().min(1),
    })
    .strict()

export const PitchFlutterResultSchema = z
    .object({
        entityId: z.string(),
        currentBps: z.number().int().min(0).max(10000),
        subharmonicFlutterHzBps: z.number().int().min(0).max(200000), // e.g. 6.5 Hz = 65000 bps
        flutterDepthCentitones: z.number().int().min(0).max(600), // 0 to 6.0 semitones
        isHypervigilant: z.boolean(),
        visionConeDegrees: z.number().int().min(30).max(120),
    })
    .strict()

export type ParanoiaMeterState = z.infer<typeof ParanoiaMeterStateSchema>
export type AcousticTransientEvent = z.infer<
    typeof AcousticTransientEventSchema
>
export type PitchFlutterResult = z.infer<typeof PitchFlutterResultSchema>
