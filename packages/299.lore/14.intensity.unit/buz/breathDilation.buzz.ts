import {
  assertIntegerMetric,
  divRoundHalfEven,
} from '../val/algebraicDsp.val.js';

export interface BreathDilationResult {
  effectiveBreathinessPauseBps: number;
  pauseFrequencyMultiplierBps: number;
  estimatedDurationExpansionBps: number;
  isExhaustionStrained: boolean;
}

export function calculateBreathPauseDilation(
  baseBreathinessPauseBps: number,
  somaticFatigueBps: number,
): BreathDilationResult {
  assertIntegerMetric(baseBreathinessPauseBps, 'baseBreathinessPauseBps');
  assertIntegerMetric(somaticFatigueBps, 'somaticFatigueBps');

  // Quadratic respiratory pause dilation:
  // Pi_eff = baseBreathiness * (1.0 + 1.40 * (SOMATIC_FATIGUE / 10,000)^2)
  // Let S = somaticFatigueBps (0 to 10000)
  // S^2 evaluates from 0 to 100,000,000
  // Quadratic dilation term = divRoundHalfEven(14000 * (S^2), 100,000,000)
  const sSquared = somaticFatigueBps * somaticFatigueBps;
  const dilationTermBps = divRoundHalfEven(14000 * sSquared, 100000000);
  const breathFactorBps = 10000 + dilationTermBps;

  const rawPiEff = divRoundHalfEven(baseBreathinessPauseBps * breathFactorBps, 10000);
  const effectiveBreathinessPauseBps = Math.max(10000, rawPiEff);

  let pauseFrequencyMultiplierBps = 10000;
  let estimatedDurationExpansionBps = 0;
  const isExhaustionStrained = somaticFatigueBps > 8000;

  if (isExhaustionStrained) {
    // Somatic threshold breach (> 8000 bps):
    // Sets pause_frequency_multiplier = 2.8x (28,000 bps)
    // Expands continuous stem duration by up to +40% (4,000 bps duration expansion)
    pauseFrequencyMultiplierBps = 28000;
    estimatedDurationExpansionBps = 4000;
  }

  return {
    effectiveBreathinessPauseBps,
    pauseFrequencyMultiplierBps,
    estimatedDurationExpansionBps,
    isExhaustionStrained,
  };
}
