import {
  InterMeterBridgeEvaluationInputSchema,
  type InterMeterBridgeEvaluationInput,
} from '../val/interMeterBridge.val.js';
import { assertIntegerMetric } from '../val/pressureMeter.val.js';

export interface InterMeterBridgeReceiptBit {
  readonly entityId: string;
  readonly somaticFatigueBp: number;
  readonly originalRefusalThresholdLimitBp: number;
  readonly effectiveRefusalThresholdLimitBp: number;
  readonly isReductionActive: boolean;
  readonly reductionAppliedBp: number;
}

export function evaluateSomaticRefusalBridge(
  input: InterMeterBridgeEvaluationInput,
): InterMeterBridgeReceiptBit {
  const parsed = InterMeterBridgeEvaluationInputSchema.parse(input);
  assertIntegerMetric(parsed.somaticFatigueBp, 'somaticFatigueBp');
  assertIntegerMetric(parsed.refusalStrainTargetLimitBp, 'refusalStrainTargetLimitBp');

  const FATIGUE_TRIGGER_BP = 8000;
  const REDUCTION_RATIO_BPS = 8000;

  let effectiveLimitBp = parsed.refusalStrainTargetLimitBp;
  let isReductionActive = false;
  let reductionAppliedBp = 0;

  if (parsed.somaticFatigueBp >= FATIGUE_TRIGGER_BP) {
    isReductionActive = true;
    effectiveLimitBp = Math.floor((parsed.refusalStrainTargetLimitBp * REDUCTION_RATIO_BPS) / 10000);
    reductionAppliedBp = parsed.refusalStrainTargetLimitBp - effectiveLimitBp;
  }

  const receipt: InterMeterBridgeReceiptBit = {
    entityId: parsed.entityId,
    somaticFatigueBp: parsed.somaticFatigueBp,
    originalRefusalThresholdLimitBp: parsed.refusalStrainTargetLimitBp,
    effectiveRefusalThresholdLimitBp: effectiveLimitBp,
    isReductionActive,
    reductionAppliedBp,
  };

  return Object.freeze(receipt);
}
