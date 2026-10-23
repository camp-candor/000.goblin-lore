import { createHash } from 'node:crypto'
import {
    FactScope,
    validateFactScope,
} from '../../38.types.unit/val/scope.val.js'
import { Sha256HashSchema } from '../val/canonHash.val.js'
import { FactContentHashBit, HashParityResult } from '../fce/canonHash.bit.js'

/**
 * RFC 8785 JSON Canonicalization Scheme (JCS).
 * Recursively sorts object dictionary keys by UTF-16 code units.
 * Normalizes all strings to Unicode Form C (NFC).
 * Throws TypeError on non-finite IEEE 754 numbers.
 */
export function canonicalizeJson(obj: unknown): string {
    if (obj === null || typeof obj !== 'object') {
        if (typeof obj === 'string') {
            return JSON.stringify(obj.normalize('NFC'))
        }
        if (typeof obj === 'number') {
            if (!Number.isFinite(obj)) {
                throw new TypeError(
                    '[CANONICAL_JSON] Non-finite IEEE-754 numbers are strictly forbidden.',
                )
            }
        }
        return JSON.stringify(obj)
    }

    if (Array.isArray(obj)) {
        return `[${obj.map((item) => canonicalizeJson(item)).join(',')}]`
    }

    const sortedKeys = Object.keys(obj as Record<string, unknown>).sort(
        (a, b) => (a < b ? -1 : a > b ? 1 : 0),
    )

    const parts = sortedKeys
        .map((key) => {
            const val = (obj as Record<string, unknown>)[key]
            if (val === undefined || typeof val === 'symbol') {
                return ''
            }
            const cleanKey = JSON.stringify(key.normalize('NFC'))
            return `${cleanKey}:${canonicalizeJson(val)}`
        })
        .filter(Boolean)

    return `{${parts.join(',')}}`
}

/**
 * Computes a 64-character lowercase hexadecimal SHA-256 hash using node:crypto.
 */
export function sha256Hex(content: string): string {
    return createHash('sha256').update(content, 'utf8').digest('hex')
}

/**
 * Computes deterministic SHA-256 content hash for a fact claim.
 * Normalizes claim text to Unicode NFC and applies RFC 8785 key sorting.
 */
export function computeFactContentHash(
    scope: string,
    claimText: string,
): string {
    const validatedScope = validateFactScope(scope)
    const normalizedText = claimText.normalize('NFC').trim()

    const payload = {
        claim: normalizedText,
        scope: validatedScope,
    }

    const canonicalJson = canonicalizeJson(payload)
    return sha256Hex(canonicalJson)
}

/**
 * Assembles the full FactContentHashBit metadata container.
 */
export function createFactContentHashBit(
    scope: FactScope,
    claimText: string,
): FactContentHashBit {
    const validatedScope = validateFactScope(scope)
    const normalizedClaim = claimText.normalize('NFC').trim()

    const payload = {
        claim: normalizedClaim,
        scope: validatedScope,
    }

    const canonicalJson = canonicalizeJson(payload)
    const contentHash = sha256Hex(canonicalJson)

    return {
        scope: validatedScope,
        normalizedClaim,
        contentHash,
        canonicalJson,
    }
}

/**
 * Evaluates hash parity between an expected hash and recomputed payload.
 */
export function verifyFactContentHashParity(
    expectedHash: string,
    scope: string,
    claimText: string,
): HashParityResult {
    let validatedScope: FactScope
    try {
        validatedScope = validateFactScope(scope)
    } catch (_err) {
        return {
            valid: false,
            errorCode: 'INVALID_HASH_INPUT',
            scope: 'LAW',
            expectedHash,
            actualHash: '',
            message: `Invalid scope: ${String(scope)}`,
        }
    }

    const hashValidation = Sha256HashSchema.safeParse(expectedHash)
    if (!hashValidation.success) {
        return {
            valid: false,
            errorCode: 'INVALID_HASH_INPUT',
            scope: validatedScope,
            expectedHash,
            actualHash: '',
            message: `Malformed expected SHA-256 hash: ${expectedHash}`,
        }
    }

    const actualHash = computeFactContentHash(validatedScope, claimText)

    if (actualHash !== expectedHash) {
        return {
            valid: false,
            errorCode: 'CONTENT_HASH_PARITY_MISMATCH',
            scope: validatedScope,
            expectedHash,
            actualHash,
            message: `Cryptographic content hash mismatch for scope '${validatedScope}'. Expected: ${expectedHash}, Actual: ${actualHash}`,
        }
    }

    return {
        valid: true,
        scope: validatedScope,
        contentHash: actualHash,
        matchesExpected: true,
    }
}

/**
 * Hard fail-closed assertion for hash parity.
 * Throws Error immediately at Stage T0 ($0.00) if actual hash diverges from expected.
 */
export function assertFactContentHashParity(
    expectedHash: string,
    scope: string,
    claimText: string,
): void {
    const result = verifyFactContentHashParity(expectedHash, scope, claimText)
    if (!result.valid) {
        throw new Error(
            `[CONTENT_HASH_PARITY_BREACH] ${result.errorCode}: ${result.message}`,
        )
    }
}
