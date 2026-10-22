import { AsciiGuardBuzz } from '../buz/asciiGuard.buzz.js'
import type {
    AsciiValidationResult,
    SanitizationReceiptBit,
} from '../fce/asciiGuard.bit.js'

export interface ValidateAsciiClaimPayload {
    readonly claimText: string
}

export interface SanitizeAsciiClaimPayload {
    readonly rawText: string
}

/**
 * Action dispatchers for 26.schema.unit text sanitization and validation.
 */
export class SchemaAction {
    /**
     * Action: Validates that candidate claim text strictly obeys 7-bit ASCII boundaries.
     */
    public static validateFactClaimAscii(
        payload: ValidateAsciiClaimPayload,
    ): AsciiValidationResult {
        return AsciiGuardBuzz.validateClaimText(payload.claimText)
    }

    /**
     * Action: Sanitizes raw text down to compliant 7-bit ASCII.
     */
    public static sanitizeFactClaimAscii(
        payload: SanitizeAsciiClaimPayload,
    ): SanitizationReceiptBit {
        return AsciiGuardBuzz.sanitizeToSevenBitAscii(payload.rawText)
    }
}
