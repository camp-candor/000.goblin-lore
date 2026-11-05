import { z } from 'zod';
import { ComposedSomaticDspMatrixSchema } from '../../14.intensity.unit/val/algebraicDsp.val.js';

export const PURE_ASCII_REGEX = /^[\x20-\x7E\r\n\t]+$/;
export const SHA256_HEX_REGEX = /^[0-9a-f]{64}$/;
export const FACT_SLUG_REGEX = /^fact_[a-z0-9_]+$/;

export function assertIntegerMetric(value: unknown, fieldName: string): asserts value is number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value)) {
    throw new Error(`[FLOAT_PROHIBITED] ${fieldName} must be a safe integer primitive. Received: ${value}`);
  }
}

export const ConditioningStrategyEnum = z.enum([
  'ZERO_SHOT_WAV',
  'SPEAKER_EMBEDDING_TENSOR',
  'DESCRIPTION_PROMPT',
  'SYNTHETIC_STYLE_TENSOR',
]);
export type ConditioningStrategy = z.infer<typeof ConditioningStrategyEnum>;

export const SilenceToSpeechRatioDirectiveSchema = z
  .object({
    maxConsecutiveDialogueLines: z.number().int().min(1).max(3).default(2),
    enforceBeatAfterDialogueCount: z.number().int().min(1).max(3).default(2),
    allowExtendedMonologue: z.boolean().default(false),
    clampedBeatDurationFrames: z.number().int().min(12).max(48).default(18),
  })
  .strict();

export const CharacterSomaticMaskSchema = z
  .object({
    armsAvailableBps: z.number().int().min(0).max(20000),
    locomotionBaseline: z.string().min(1),
    activeConditions: z.array(z.string()).default([]),
    bannedKineticVerbs: z.array(z.string()).default([]),
    opticalState: z.enum(['NORMAL', 'MONOCULAR', 'BLIND']).default('NORMAL'),
    blindConeDegrees: z.number().int().min(0).max(360).default(0),
    canSpeak: z.boolean().default(true),
  })
  .strict();

export const TTSGenerationRequestSchema = z
  .object({
    seriesSlug: z.string().min(1).regex(/^[a-z0-9_-]+$/, 'INVALID_SERIES_SLUG'),
    sceneId: z.string().min(1).regex(/^sc_[a-z0-9_]+$/, 'INVALID_SCENE_ID'),
    lineId: z.string().min(1).regex(/^line_[a-z0-9_]+$/, 'INVALID_LINE_ID'),
    characterId: z.string().min(1).regex(/^char_[a-z0-9_]+$/, 'INVALID_CHARACTER_ID'),
    verbatimText: z.string().min(1).regex(PURE_ASCII_REGEX, 'NON_ASCII_DIALOGUE_DETECTED'),
    conditioningStrategy: ConditioningStrategyEnum,
    composedDspMatrix: ComposedSomaticDspMatrixSchema,
    somaticMask: CharacterSomaticMaskSchema,
    silenceDirective: SilenceToSpeechRatioDirectiveSchema.default({
      maxConsecutiveDialogueLines: 2,
      enforceBeatAfterDialogueCount: 2,
      allowExtendedMonologue: false,
      clampedBeatDurationFrames: 18,
    }),
    pinnedFactVersions: z.record(
      z.string().regex(FACT_SLUG_REGEX, 'INVALID_FACT_SLUG'),
      z.number().int().nonnegative('FACT_VERSION_MUST_BE_NONNEGATIVE'),
    ),
  })
  .strict()
  .superRefine((val, ctx) => {
    if (!val.somaticMask.canSpeak && val.verbatimText.trim().length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'VOCAL_DELIVERY_BREACH: Aphonic character cannot phonate verbal dialogue',
        path: ['verbatimText'],
      });
    }
  });

export type SilenceToSpeechRatioDirective = z.infer<typeof SilenceToSpeechRatioDirectiveSchema>;
export type CharacterSomaticMask = z.infer<typeof CharacterSomaticMaskSchema>;
export type TTSGenerationRequest = z.infer<typeof TTSGenerationRequestSchema>;
