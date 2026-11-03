import { z } from 'zod';

export const PressureCategoryEnum = z.enum([
  'SOMATIC_FATIGUE',
  'PHYSICAL_PAIN',
  'REFUSAL_STRAIN',
  'PARANOIA_CLOCK',
]);
export type PressureCategory = z.infer<typeof PressureCategoryEnum>;

export function assertIntegerMetric(value: unknown, fieldName: string): asserts value is number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value)) {
    throw new Error(`[FLOAT_PROHIBITED] ${fieldName} must be a safe integer primitive. Received: ${value}`);
  }
}

export function clampBps(value: number): number {
  assertIntegerMetric(value, 'clampBps input');
  if (value < 0) return 0;
  if (value > 10000) return 10000;
  return value;
}

export const PostBreakMutationSchema = z.object({
  targetRefusalVectorId: z.string().min(1),
  newBehaviorDirective: z.string().min(1),
  bannedTokensRemoved: z.array(z.string().min(1)).default([]),
  permanentAcousticDeltas: z.object({
    basePitchShiftCentitones: z.number().int().min(-1200).max(1200).optional(),
    formantWarpingBps: z.number().int().min(5000).max(20000).optional(),
    vocalFryDensityBps: z.number().int().min(0).max(10000).optional(),
    breathinessPauseMultiplierBps: z.number().int().min(10000).max(35000).optional(),
  }).default({}),
}).strict();

export const PressureMeterSchema = z.object({
  meterId: z.string().regex(/^mtr_[a-z0-9_]+$/),
  entityId: z.string().regex(/^char_[a-z0-9_]+$/),
  category: PressureCategoryEnum,
  currentValueBp: z.number().int().min(0).max(10000),
  baselineBp: z.number().int().min(0).max(10000),
  decayRatePerCycleBp: z.number().int().min(0).max(10000),
  thresholdLimitBp: z.number().int().min(0).max(10000).default(8000),
  postBreakStateMutation: PostBreakMutationSchema.nullable().default(null),
}).strict().superRefine((val, ctx) => {
  if (val.baselineBp > val.thresholdLimitBp) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: '[PRESSURE_METER_SCHEMA_BREACH] baselineBp cannot exceed thresholdLimitBp',
      path: ['baselineBp'],
    });
  }
  if (val.currentValueBp < val.baselineBp) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: '[PRESSURE_METER_SCHEMA_BREACH] currentValueBp cannot fall below baselineBp',
      path: ['currentValueBp'],
    });
  }
});

export const FrictionDebitEventSchema = z.object({
  eventId: z.string().min(1),
  debitBp: z.number().int().min(0).max(10000),
  sourceTag: z.string().min(1),
}).strict();

export type PostBreakMutation = z.infer<typeof PostBreakMutationSchema>;
export type PressureMeter = z.infer<typeof PressureMeterSchema>;
export type FrictionDebitEvent = z.infer<typeof FrictionDebitEventSchema>;
