import { z } from 'zod';
import { PressureCategoryEnum } from './pressureMeter.val.js';

export const InterMeterBridgeRuleSchema = z.object({
  sourceCategory: PressureCategoryEnum,
  targetCategory: PressureCategoryEnum,
  triggerThresholdBp: z.number().int().min(0).max(10000),
  ceilingReductionPercentageBps: z.number().int().min(0).max(10000),
  description: z.string().min(1),
}).strict();

export const InterMeterBridgeEvaluationInputSchema = z.object({
  entityId: z.string().regex(/^char_[a-z0-9_]+$/),
  somaticFatigueBp: z.number().int().min(0).max(10000),
  refusalStrainTargetLimitBp: z.number().int().min(0).max(10000).default(8000),
}).strict();

export type InterMeterBridgeRule = z.infer<typeof InterMeterBridgeRuleSchema>;
export type InterMeterBridgeEvaluationInput = z.infer<typeof InterMeterBridgeEvaluationInputSchema>;
