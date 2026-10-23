import {
    PreWriteFactCandidate,
    PreWriteFactCandidateSchema,
    PreWriteErrorCode,
} from '../val/interceptor.val.js'
import {
    PreWriteValidationResult,
    ExistingFactState,
} from '../fce/interceptor.bit.js'
import { validateEntityPrefixAlignment } from '../../38.types.unit/buz/scope.buzz.js'
import {
    canOverwriteAuthority,
    assertAuthorityLevel,
} from '../../38.types.unit/buz/authority.buzz.js'
import { evaluateVersionProgression } from '../../28.sequence.unit/buz/sequence.buzz.js'
import { computeFactContentHash } from '../../41.canon.unit/buz/canonHash.buzz.js'

/**
 * Pre-write interceptor pipeline for local SQLite writes.
 * Validates candidate against all legislative constraints in memory at Stage T0 ($0.00).
 */
export function interceptPreWriteFact(
    candidate: unknown,
    existingState?: ExistingFactState | null,
): PreWriteValidationResult {
    // Step 1: Structural schema validation
    const parseResult = PreWriteFactCandidateSchema.safeParse(candidate)
    if (!parseResult.success) {
        const errorDetails = parseResult.error.errors
            .map((e) => e.message)
            .join('; ')
        return {
            valid: false,
            errorCode: 'PRE_WRITE_MALFORMED_PAYLOAD',
            factId:
                typeof candidate === 'object' &&
                candidate !== null &&
                'id' in candidate
                    ? String((candidate as any).id)
                    : 'UNKNOWN',
            message: `Candidate payload failed structural schema validation: ${errorDetails}`,
        }
    }

    const fact = parseResult.data

    // Step 2: Scope and Entity ID prefix alignment check
    const prefixCheck = validateEntityPrefixAlignment(fact.scope, fact.id)
    if (!prefixCheck.valid) {
        const prefixError =
            prefixCheck as import('../../38.types.unit/buz/scope.buzz.js').ScopeValidationFailure
        return {
            valid: false,
            errorCode: 'PRE_WRITE_PREFIX_MISMATCH',
            factId: fact.id,
            message: prefixError.message,
        }
    }

    // Step 3: Cryptographic content hash parity assertion
    const recomputedHash = computeFactContentHash(fact.scope, fact.claim_text)
    if (recomputedHash !== fact.content_hash) {
        return {
            valid: false,
            errorCode: 'PRE_WRITE_HASH_MISMATCH',
            factId: fact.id,
            message: `Cryptographic hash mismatch. Declared: '${fact.content_hash}', Recomputed: '${recomputedHash}'.`,
        }
    }

    // If this is an INSERT (no existing record), validation passes
    if (!existingState) {
        return {
            valid: true,
            sanitizedCandidate: fact,
            operationType: 'INSERT',
            telemetryMessage: `Pre-write INSERT certified for fact '${fact.id}' (v${fact.version}).`,
        }
    }

    // Step 4: Authority level precedence check on UPDATE
    const existingAuthority = assertAuthorityLevel(
        existingState.authority_level,
    )
    if (!canOverwriteAuthority(fact.authority_level, existingAuthority)) {
        return {
            valid: false,
            errorCode: 'PRE_WRITE_AUTHORITY_DEMOTION',
            factId: fact.id,
            message: `Authority demotion prohibited. Incoming '${fact.authority_level}' cannot overwrite existing '${existingState.authority_level}'.`,
        }
    }

    // Step 5: Monotonic sequence increment check on UPDATE
    const claimMutated = fact.claim_text !== existingState.claim_text
    const hashMutated = fact.content_hash !== existingState.content_hash

    const sequenceCheck = evaluateVersionProgression({
        currentVersion: existingState.version,
        proposedVersion: fact.version,
        claimMutated,
        hashMutated,
    })

    if (!sequenceCheck.valid) {
        let mappedError: PreWriteErrorCode = 'PRE_WRITE_VERSION_REGRESSION'
        if (sequenceCheck.errorCode === 'MONOTONIC_SEQUENCE_GAP_BREACH') {
            mappedError = 'PRE_WRITE_SEQUENCE_GAP'
        } else if (
            sequenceCheck.errorCode === 'MUTATION_WITHOUT_VERSION_BUMP_BREACH'
        ) {
            mappedError = 'PRE_WRITE_SILENT_MUTATION'
        }

        return {
            valid: false,
            errorCode: mappedError,
            factId: fact.id,
            message: sequenceCheck.message || 'Version progression failure',
        }
    }

    return {
        valid: true,
        sanitizedCandidate: fact,
        operationType: 'UPDATE',
        telemetryMessage: `Pre-write UPDATE certified for fact '${fact.id}' (v${existingState.version} -> v${fact.version}).`,
    }
}

/**
 * Hard fail-closed assertion for pre-write interception.
 * Throws an Error immediately at Stage T0 ($0.00) if any validation invariant fails.
 */
export function assertPreWriteFact(
    candidate: unknown,
    existingState?: ExistingFactState | null,
): PreWriteFactCandidate {
    const result = interceptPreWriteFact(candidate, existingState)
    if (!result.valid) {
        throw new Error(
            `[PRE_WRITE_INTERCEPTOR_BREACH] ${result.errorCode}: ${result.message}`,
        )
    }
    return result.sanitizedCandidate
}
