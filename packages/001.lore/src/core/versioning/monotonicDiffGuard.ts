import * as crypto from 'node:crypto'
import {
    FactNode,
    FactNodeSchema,
    Scope,
    AuthorityPrecedence,
} from '../../schemas/factNode.schema.js'

export interface ClaimDiffRecord {
    fact_id: string
    scope: Scope
    old_version: number
    new_version: number
    is_claim_mutated: boolean
    is_standing_mutated: boolean
    old_claim_text: string
    new_claim_text: string
    old_hash: string
    new_hash: string
    human_readable_diff: string
}

export interface MonotonicVerificationResult {
    valid: boolean
    reason?: string
    errorCode?:
        | 'MONOTONIC_VERSION_REGRESSION_BREACH'
        | 'AUTHORITY_DEMOTION_BREACH'
        | 'HASH_INTEGRITY_BREACH'
        | 'IDENTICAL_VERSION_BUMP_NOOP'
    diff?: ClaimDiffRecord
}

/**
 * Computes deterministic 64-character lowercase SHA-256 hash over normalized claim and scope
 */
export function computeFactContentHash(
    claimText: string,
    scope: Scope,
): string {
    const normalized = claimText.normalize('NFC').trim()
    const payload = `${scope.toUpperCase()}:${normalized}`
    return crypto.createHash('sha256').update(payload, 'utf8').digest('hex')
}

/**
 * Generates granular claim delta report between two versions of a fact
 */
export function generateClaimDiff(
    oldFact: FactNode,
    newFact: FactNode,
): ClaimDiffRecord {
    const isClaimMutated =
        oldFact.claim_text !== newFact.claim_text ||
        oldFact.content_hash !== newFact.content_hash
    const isStandingMutated = oldFact.standing !== newFact.standing

    let humanDiff = `Fact [${newFact.id}] `
    if (isClaimMutated) {
        humanDiff += `mutated v${oldFact.version} -> v${newFact.version} | Old: "${oldFact.claim_text}" -> New: "${newFact.claim_text}"`
    } else if (isStandingMutated) {
        humanDiff += `standing changed ${oldFact.standing} -> ${newFact.standing} at v${newFact.version}`
    } else {
        humanDiff += `reaffirmed unchanged at v${newFact.version}`
    }

    return {
        fact_id: newFact.id,
        scope: newFact.scope,
        old_version: oldFact.version,
        new_version: newFact.version,
        is_claim_mutated: isClaimMutated,
        is_standing_mutated: isStandingMutated,
        old_claim_text: oldFact.claim_text,
        new_claim_text: newFact.claim_text,
        old_hash: oldFact.content_hash,
        new_hash: newFact.content_hash,
        human_readable_diff: humanDiff,
    }
}

/**
 * Enforces the Monotonic Version Invariant at Stage T0 = $0.00:
 * 1. If claim_text or content_hash changes, NEW.version MUST be strictly greater than OLD.version.
 * 2. Lower authority tiers cannot overwrite higher authority tiers.
 * 3. Content hash must match computed hash of new claim_text.
 * 4. Zero-Cascade Liminal Guarantee: Standing updates to FLAGGED_FOR_REVIEW without claim changes
 *    are valid without version bumps.
 */
export function verifyMonotonicClaimUpdate(
    oldFact: FactNode,
    newFact: FactNode,
): MonotonicVerificationResult {
    // Validate schema shapes
    FactNodeSchema.parse(oldFact)
    FactNodeSchema.parse(newFact)

    if (oldFact.id !== newFact.id) {
        throw new Error(
            `FACT_ID_MISMATCH: Cannot compare '${oldFact.id}' against '${newFact.id}'`,
        )
    }

    // 1. Content Hash Verification
    const computedHash = computeFactContentHash(
        newFact.claim_text,
        newFact.scope,
    )
    if (newFact.content_hash.toLowerCase() !== computedHash.toLowerCase()) {
        return {
            valid: false,
            errorCode: 'HASH_INTEGRITY_BREACH',
            reason: `HASH_MISMATCH: Declared content_hash '${newFact.content_hash}' does not match computed '${computedHash}'`,
        }
    }

    // 2. Authority Level Check (Authority cannot demote established truth)
    if (
        AuthorityPrecedence[newFact.authority_level] <
        AuthorityPrecedence[oldFact.authority_level]
    ) {
        return {
            valid: false,
            errorCode: 'AUTHORITY_DEMOTION_BREACH',
            reason: `AUTHORITY_DEMOTION: Cannot overwrite authority '${oldFact.authority_level}' with lower tier '${newFact.authority_level}'`,
        }
    }

    const diff = generateClaimDiff(oldFact, newFact)

    // 3. Monotonic Versioning Rule: Mutated claims MUST increment version integer
    if (diff.is_claim_mutated) {
        if (newFact.version <= oldFact.version) {
            return {
                valid: false,
                errorCode: 'MONOTONIC_VERSION_REGRESSION_BREACH',
                reason: `MONOTONIC_REGRESSION: Claim text mutated from "${oldFact.claim_text}" to "${newFact.claim_text}" but version was not incremented (OLD: v${oldFact.version}, NEW: v${newFact.version})`,
                diff,
            }
        }
    } else {
        // Claim is identical: check if this is an invalid version bump without changes
        if (newFact.version > oldFact.version && !diff.is_standing_mutated) {
            return {
                valid: false,
                errorCode: 'IDENTICAL_VERSION_BUMP_NOOP',
                reason: `UNNECESSARY_VERSION_BUMP: Fact version bumped from v${oldFact.version} to v${newFact.version} with zero changes to claim_text or standing`,
                diff,
            }
        }
    }

    return {
        valid: true,
        diff,
    }
}
