import { z } from 'zod';
import { SHA256_HEX_REGEX } from './ttsPayload.val.js';

export const PayloadHashSchema = z
  .string()
  .length(64, 'SHA-256 digest must be exactly 64 hexadecimal characters')
  .regex(SHA256_HEX_REGEX, 'SHA-256 digest must be lowercase hexadecimal characters only');

export const PayloadHashReceiptSchema = z
  .object({
    lineId: z.string().min(1),
    characterId: z.string().min(1),
    canonicalJson: z.string().min(1),
    payloadSha256: PayloadHashSchema,
    byteLength: z.number().int().positive(),
    isBitIdentical: z.boolean(),
    hashedAtEpoch: z.number().int().nonnegative().default(0),
  })
  .strict();

export const PayloadParityVerificationInputSchema = z
  .object({
    expectedHash: PayloadHashSchema,
    payload: z.unknown(),
    epoch: z.number().int().nonnegative().default(0),
  })
  .strict();

export const PayloadParityResultSchema = z
  .object({
    isValid: z.boolean(),
    lineId: z.string(),
    expectedHash: z.string(),
    actualHash: z.string(),
    errorCode: z.string().optional(),
    message: z.string().optional(),
    verifiedAtEpoch: z.number().int().nonnegative().default(0),
  })
  .strict();

export type PayloadHashReceipt = z.infer<typeof PayloadHashReceiptSchema>;
export type PayloadParityVerificationInput = z.infer<typeof PayloadParityVerificationInputSchema>;
export type PayloadParityResult = z.infer<typeof PayloadParityResultSchema>;
