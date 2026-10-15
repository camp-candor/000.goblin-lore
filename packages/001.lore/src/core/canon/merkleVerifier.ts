import * as crypto from 'node:crypto'

/**
 * Implements a strict RFC 8785 JSON Canonicalization Scheme.
 * - Recursively sorts dictionary keys lexicographically by UTF-16 code units.
 * - Applies Unicode Normalization Form C (NFC) to strings.
 * - Rejects non-finite numbers (NaN, Infinity).
 * - Formats whitespace and numbers deterministically.
 */
export function canonicalizeJson(obj: unknown): string {
    if (obj === null || typeof obj === 'boolean') {
        return String(obj)
    }
    if (typeof obj === 'number') {
        if (!Number.isFinite(obj)) {
            throw new TypeError(`canonicalizeJson: Invalid number ${obj}`)
        }
        if (Object.is(obj, -0)) {
            return '0'
        }
        return obj.toString()
    }
    if (typeof obj === 'string') {
        // Apply Unicode Normalization Form C (NFC)
        const nfc = obj.normalize('NFC')
        return JSON.stringify(nfc)
    }
    if (Array.isArray(obj)) {
        const items = obj.map((item) => {
            if (
                item === undefined ||
                typeof item === 'function' ||
                typeof item === 'symbol'
            ) {
                return 'null'
            }
            return canonicalizeJson(item)
        })
        return `[${items.join(',')}]`
    }
    if (typeof obj === 'object') {
        const keys = Object.keys(obj).sort((a, b) => {
            // Lexicographical sort by UTF-16 code units
            if (a < b) return -1
            if (a > b) return 1
            return 0
        })

        const entries: string[] = []
        for (const key of keys) {
            const val = (obj as Record<string, unknown>)[key]
            if (
                val === undefined ||
                typeof val === 'function' ||
                typeof val === 'symbol'
            ) {
                continue
            }
            const encodedKey = JSON.stringify(key)
            const encodedVal = canonicalizeJson(val)
            entries.push(`${encodedKey}:${encodedVal}`)
        }
        return `{${entries.join(',')}}`
    }

    throw new TypeError(`canonicalizeJson: Unsupported type ${typeof obj}`)
}

/**
 * Computes a 64-character lowercase hexadecimal SHA-256 digest
 * of the canonicalized JSON payload.
 */
export function computeMerkleRoot(payload: unknown): string {
    const canonical = canonicalizeJson(payload)
    const hash = crypto.createHash('sha256')
    hash.update(canonical, 'utf8')
    return hash.digest('hex').toLowerCase()
}

/**
 * Strips the volatile _meta.state_hash before computing and verifying
 * the canonical byte parity against the expected hash.
 * Throws an error if they do not match.
 */
export function verifyStateMerkleParity(
    rawStateJson: unknown,
    expectedHash: string,
): void {
    if (typeof rawStateJson !== 'object' || rawStateJson === null) {
        throw new Error('CANON_DESYNC_HALT: Invalid state payload')
    }

    const payload = JSON.parse(JSON.stringify(rawStateJson))
    if (payload._meta && 'state_hash' in payload._meta) {
        delete payload._meta.state_hash
    }
    // if _meta is completely empty after deleting state_hash, and it wasn't empty before,
    // we should delete it if we want to match parity, but actually the canonicalizer should handle empty objects.
    // Let's ensure _meta exists in the hash1 compute for consistency if needed, but the requirements
    // just say "stripping volatile root _meta.state_hash".
    // Wait, if _meta ends up empty, canonicalizeJson will serialize it as {"_meta":{}} which differs from completely absent _meta.
    // If the original payload had a _meta object with just state_hash, and we delete state_hash, _meta remains.
    // If we want exact parity with a payload that never had _meta, we'd need to delete _meta too if empty.
    if (payload._meta && Object.keys(payload._meta).length === 0) {
        delete payload._meta
    }

    const computed = computeMerkleRoot(payload)
    if (computed !== expectedHash.toLowerCase()) {
        throw new Error(
            `CANON_DESYNC_HALT: Expected Merkle root ${expectedHash}, but computed ${computed}`,
        )
    }
}
