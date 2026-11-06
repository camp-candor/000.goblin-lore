import { createHash } from 'node:crypto';
import {
  TTSGenerationRequestSchema,
  type TTSGenerationRequest,
} from '../val/ttsPayload.val.js';
import {
  PayloadHashReceiptSchema,
  PayloadParityResultSchema,
  PayloadHashSchema,
  type PayloadHashReceipt,
  type PayloadParityResult,
} from '../val/payloadHash.val.js';

/**
 * Pure RFC 8785 JSON Canonicalization Scheme (JCS).
 * Recursively sorts dictionary keys in lexicographical UTF-16 code-unit order.
 * Normalizes all string values to Unicode Normalization Form C (NFC).
 * Throws TypeError on non-finite IEEE 754 numbers (NaN, Infinity).
 */
export function canonicalizeJson(obj: unknown): string {
  if (obj === null || typeof obj !== 'object') {
    if (typeof obj === 'string') {
      return JSON.stringify(obj.normalize('NFC'));
    }
    if (typeof obj === 'number') {
      if (!Number.isFinite(obj)) {
        throw new TypeError('[CANONICAL_JSON] Non-finite IEEE-754 numbers are strictly forbidden.');
      }
    }
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    return `[${obj.map((item) => canonicalizeJson(item)).join(',')}]`;
  }

  const sortedKeys = Object.keys(obj as Record<string, unknown>).sort((a, b) =>
    a < b ? -1 : a > b ? 1 : 0,
  );

  const parts = sortedKeys
    .map((key) => {
      const val = (obj as Record<string, unknown>)[key];
      if (val === undefined || typeof val === 'symbol') {
        return '';
      }
      const cleanKey = JSON.stringify(key.normalize('NFC'));
      return `${cleanKey}:${canonicalizeJson(val)}`;
    })
    .filter(Boolean);

  return `{${parts.join(',')}}`;
}

/**
 * Computes a 64-character lowercase hexadecimal SHA-256 digest.
 */
export function sha256Hex(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

/**
 * Serializes and hashes a validated TTSGenerationRequest using RFC 8785 JCS.
 */
export function hashTtsGenerationRequest(
  requestInput: unknown,
  epoch: number = 0,
): PayloadHashReceipt {
  const parsed: TTSGenerationRequest = TTSGenerationRequestSchema.parse(requestInput);
  const canonicalJson = canonicalizeJson(parsed);
  const payloadSha256 = sha256Hex(canonicalJson);
  const byteLength = Buffer.byteLength(canonicalJson, 'utf8');

  const receipt: PayloadHashReceipt = {
    lineId: parsed.lineId,
    characterId: parsed.characterId,
    canonicalJson,
    payloadSha256,
    byteLength,
    isBitIdentical: true,
    hashedAtEpoch: epoch,
  };

  return Object.freeze(PayloadHashReceiptSchema.parse(receipt));
}

/**
 * Evaluates hash parity between an expected hash and recomputed payload.
 */
export function verifyPayloadHashParity(
  expectedHash: string,
  payloadInput: unknown,
  epoch: number = 0,
): PayloadParityResult {
  const hashCheck = PayloadHashSchema.safeParse(expectedHash);
  if (!hashCheck.success) {
    return Object.freeze({
      isValid: false,
      lineId: 'unknown',
      expectedHash,
      actualHash: '',
      errorCode: 'INVALID_HASH_FORMAT',
      message: `Expected hash '${expectedHash}' is not a valid 64-character lowercase hexadecimal SHA-256 digest`,
      verifiedAtEpoch: epoch,
    });
  }

  let actualReceipt: PayloadHashReceipt;
  try {
    actualReceipt = hashTtsGenerationRequest(payloadInput, epoch);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return Object.freeze({
      isValid: false,
      lineId: 'unknown',
      expectedHash,
      actualHash: '',
      errorCode: 'PAYLOAD_SCHEMA_BREACH',
      message: `Payload failed canonical schema validation: ${message}`,
      verifiedAtEpoch: epoch,
    });
  }

  const isMatch = actualReceipt.payloadSha256 === expectedHash.toLowerCase();

  const result: PayloadParityResult = {
    isValid: isMatch,
    lineId: actualReceipt.lineId,
    expectedHash,
    actualHash: actualReceipt.payloadSha256,
    errorCode: isMatch ? undefined : 'PAYLOAD_HASH_PARITY_MISMATCH',
    message: isMatch
      ? undefined
      : `Cryptographic payload digest mismatch. Expected: ${expectedHash}, Actual: ${actualReceipt.payloadSha256}`,
    verifiedAtEpoch: epoch,
  };

  return Object.freeze(PayloadParityResultSchema.parse(result));
}

/**
 * Hard fail-closed assertion for hash parity.
 * Throws an Error immediately at Stage T0 ($0.00) if actual hash diverges from expected.
 */
export function assertPayloadHashParity(
  expectedHash: string,
  payloadInput: unknown,
  epoch: number = 0,
): void {
  const parity = verifyPayloadHashParity(expectedHash, payloadInput, epoch);
  if (!parity.isValid) {
    throw new Error(`[PAYLOAD_HASH_PARITY_BREACH] ${parity.errorCode}: ${parity.message}`);
  }
}
