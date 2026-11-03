import { z } from 'zod';
import { VocalDspModifierProfileSchema } from '../../37.trauma.unit/val/vocalDsp.val.js';

export function assertIntegerMetric(value: unknown, fieldName: string): asserts value is number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value)) {
    throw new Error(`[FLOAT_PROHIBITED] ${fieldName} must be a safe integer primitive. Received: ${value}`);
  }
}

export function clamp(value: number, min: number, max: number): number {
  assertIntegerMetric(value, 'clamp value');
  assertIntegerMetric(min, 'clamp min');
  assertIntegerMetric(max, 'clamp max');
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

export function divRoundHalfEven(numerator: number, denominator: number): number {
  assertIntegerMetric(numerator, 'divRoundHalfEven numerator');
  assertIntegerMetric(denominator, 'divRoundHalfEven denominator');
  if (denominator === 0) {
    throw new Error('[DIVIDE_BY_ZERO] Denominator cannot be zero in divRoundHalfEven');
  }

  const isNegative = (numerator < 0) !== (denominator < 0);
  const n = Math.abs(numerator);
  const d = Math.abs(denominator);

  const q = Math.floor(n / d);
  const r = n % d;
  const twoR = r * 2;

  let roundedQ = q;
  if (twoR > d) {
    roundedQ = q + 1;
  } else if (twoR === d) {
    roundedQ = q % 2 === 0 ? q : q + 1;
  }

  return isNegative ? -roundedQ : roundedQ;
}

export const SceneDeltasInputSchema = z.object({
  deltaPitchCentitones: z.number().int().min(-1200).max(1200).default(0),
  deltaFormantBps: z.number().int().min(5000).max(20000).default(10000),
  deltaFryBps: z.number().int().min(0).max(10000).default(0),
}).strict();

export const PressureMetersInputSchema = z.object({
  somaticFatigueBps: z.number().int().min(0).max(10000).default(0),
  physicalPainBps: z.number().int().min(0).max(10000).default(0),
  paranoiaPressureBps: z.number().int().min(0).max(10000).default(0),
}).strict();

export const AlgebraicDspCompositionInputSchema = z.object({
  entityId: z.string().regex(/^char_[a-z0-9_]+$/),
  baselineProfile: VocalDspModifierProfileSchema,
  sceneDeltas: SceneDeltasInputSchema.default({
    deltaPitchCentitones: 0,
    deltaFormantBps: 10000,
    deltaFryBps: 0,
  }),
  meters: PressureMetersInputSchema.default({
    somaticFatigueBps: 0,
    physicalPainBps: 0,
    paranoiaPressureBps: 0,
  }),
  proposedMotorActions: z.array(z.string()).default([]),
}).strict();

export const ComposedSomaticDspMatrixSchema = z.object({
  entityId: z.string(),
  effectivePitchCentitones: z.number().int().min(-1200).max(1200),
  effectiveFormantWarpingBps: z.number().int().min(5000).max(20000),
  effectiveTonePacingBps: z.number().int().min(1000).max(30000),
  effectiveBreathinessPauseBps: z.number().int().min(10000).max(100000),
  pauseFrequencyMultiplierBps: z.number().int().min(10000).max(50000),
  effectiveVocalFryDensityBps: z.number().int().min(0).max(10000),
  estimatedDurationExpansionBps: z.number().int().min(0).max(10000),
  visceralReflexHoldFrames: z.number().int().min(0).max(60),
  isExhaustionStrained: z.boolean(),
  bannedCadences: z.array(z.string()),
}).strict();

export type SceneDeltasInput = z.infer<typeof SceneDeltasInputSchema>;
export type PressureMetersInput = z.infer<typeof PressureMetersInputSchema>;
export type AlgebraicDspCompositionInput = z.infer<typeof AlgebraicDspCompositionInputSchema>;
export type ComposedSomaticDspMatrix = z.infer<typeof ComposedSomaticDspMatrixSchema>;
