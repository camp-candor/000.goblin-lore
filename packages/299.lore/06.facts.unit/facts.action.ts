import { Action } from '../99.core/interface/action.interface.js'
import FactsBit from './fce/facts.bit.js'
import { AsciiGuardBuzz } from './buz/asciiGuard.buzz.js'
import type {
    AsciiValidationResult,
    SanitizationReceiptBit,
} from './fce/asciiGuard.bit.js'

// Facts actions

export const INIT_FACTS = '[Facts action] Init Facts'
export class InitFacts implements Action {
    readonly type = INIT_FACTS
    constructor(public bale: FactsBit) {}
}

export const UPDATE_FACTS = '[Facts action] Update Facts'
export class UpdateFacts implements Action {
    readonly type = UPDATE_FACTS
    constructor(public bale: FactsBit) {}
}

export type Actions = InitFacts | UpdateFacts

export interface ValidateAsciiClaimPayload {
    readonly claimText: string
}

export interface SanitizeAsciiClaimPayload {
    readonly rawText: string
}

/**
 * Action dispatchers for 06.facts.unit text sanitization and validation.
 */
export class FactsAction {
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
