import { z } from 'zod';

export const BannedCadenceEnum = z.enum([
    'RAPID_STACCATO',
    'SLOW_DRAWL',
    'MONOTONE',
    'WHISPER',
    'SHOUT',
]);

export const VocalDspModifierProfileSchema = z.object({
  entityId: z.string(),
  pitchShiftCentitones: z.number().int(),
  formantWarpingBps: z.number().int(),
  speedMultiplierBps: z.number().int(),
  breathinessPauseMultiplierBps: z.number().int(),
  vocalFryDensityBps: z.number().int(),
  hasLaryngealTrauma: z.boolean(),
  hasPulmonaryTrauma: z.boolean(),
  bannedCadences: z.array(z.string()),
  matchedAcousticConditions: z.array(z.string()),
});

export type VocalDspModifierProfile = z.infer<typeof VocalDspModifierProfileSchema>;
