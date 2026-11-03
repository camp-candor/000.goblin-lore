import {
  assertIntegerMetric,
  clamp,
  divRoundHalfEven,
} from '../val/algebraicDsp.val.js';

export interface PitchFormantVelocityResult {
  effectivePitchCentitones: number;
  effectiveFormantWarpingBps: number;
  effectiveTonePacingBps: number;
}

export function composePitchFormantVelocity(
  basePitchCentitones: number,
  deltaPitchCentitones: number,
  baseFormantBps: number,
  deltaFormantBps: number,
  baseSpeedMultiplierBps: number,
  somaticFatigueBps: number,
): PitchFormantVelocityResult {
  assertIntegerMetric(basePitchCentitones, 'basePitchCentitones');
  assertIntegerMetric(deltaPitchCentitones, 'deltaPitchCentitones');
  assertIntegerMetric(baseFormantBps, 'baseFormantBps');
  assertIntegerMetric(deltaFormantBps, 'deltaFormantBps');
  assertIntegerMetric(baseSpeedMultiplierBps, 'baseSpeedMultiplierBps');
  assertIntegerMetric(somaticFatigueBps, 'somaticFatigueBps');

  // 1. Additive fundamental pitch shift in integer centitones
  const rawPitch = basePitchCentitones + deltaPitchCentitones;
  const effectivePitchCentitones = clamp(rawPitch, -1200, 1200);

  // 2. Multiplicative formant warping in integer basis points
  const rawFormant = divRoundHalfEven(baseFormantBps * deltaFormantBps, 10000);
  const effectiveFormantWarpingBps = clamp(rawFormant, 5000, 20000);

  // 3. Effective velocity: P_eff = speedScalar * (1.0 - 0.30 * (FATIGUE / 10,000))
  // In pure integer basis points:
  // fatigueReduction = divRoundHalfEven(3000 * somaticFatigueBps, 10000)
  // velocityFactor = 10000 - fatigueReduction
  // P_eff = divRoundHalfEven(baseSpeedMultiplierBps * velocityFactor, 10000)
  const fatigueReduction = divRoundHalfEven(3000 * somaticFatigueBps, 10000);
  const velocityFactor = 10000 - fatigueReduction;
  const effectiveTonePacingBps = clamp(
    divRoundHalfEven(baseSpeedMultiplierBps * velocityFactor, 10000),
    1000,
    30000,
  );

  return {
    effectivePitchCentitones,
    effectiveFormantWarpingBps,
    effectiveTonePacingBps,
  };
}
