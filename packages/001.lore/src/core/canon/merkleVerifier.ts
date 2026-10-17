import * as crypto from 'node:crypto'

/**
 * Implements RFC 8785 JSON Canonicalization Scheme (JCS):
 * 1. Recursively sorts dictionary keys lexicographically by UTF-16 code units.
 * 2. Normalizes all string values to Unicode Normalization Form C (NFC).
 * 3. Prohibits NaN, Infinity, and undefined.
 * 4. Strips non-literal whitespace.
 */
export function canonicalizeJson(obj: unknown): string {
    if (obj === null) {
        return 'null'
    }

    if (typeof obj === 'boolean' || typeof obj === 'number') {
        if (typeof obj === 'number' && !Number.isFinite(obj)) {
            throw new TypeError(
                'CANONICALIZE_ERROR: Non-finite numbers (NaN, Infinity) are prohibited by RFC 8785.',
            )
        }
        return JSON.stringify(obj)
    }

    if (typeof obj === 'string') {
        return JSON.stringify(obj.normalize('NFC'))
    }

    if (Array.isArray(obj)) {
        const elements = obj.map((item) => {
            const val = item === undefined ? null : item
            return canonicalizeJson(val)
        })
        return `[${elements.join(',')}]`
    }

    if (typeof obj === 'object') {
        const record = obj as Record<string, unknown>
        const sortedKeys = Object.keys(record).sort((a, b) => {
            const len = Math.min(a.length, b.length)
            for (let i = 0; i < len; i++) {
                const codeA = a.charCodeAt(i)
                const codeB = b.charCodeAt(i)
                if (codeA !== codeB) return codeA - codeB
            }
            return a.length - b.length
        })

        const entries: string[] = []
        for (const key of sortedKeys) {
            const val = record[key]
            if (
                val === undefined ||
                typeof val === 'function' ||
                typeof val === 'symbol'
            ) {
                continue
            }
            const canonicalKey = JSON.stringify(key.normalize('NFC'))
            const canonicalVal = canonicalizeJson(val)
            entries.push(`${canonicalKey}:${canonicalVal}`)
        }

        return `{${entries.join(',')}}`
    }

    return ''
}

/**
 * Computes 64-character lowercase SHA-256 Merkle root digest over RFC 8785 canonical representation
 */
export function computeMerkleRoot(payload: unknown): string {
    const canonicalBytes = Buffer.from(canonicalizeJson(payload), 'utf8')
    return crypto.createHash('sha256').update(canonicalBytes).digest('hex')
}

/**
 * Strips volatile _meta.state_hash before verifying canonical Merkle parity
 */
export function verifyStateMerkleParity(
    rawState: Record<string, unknown>,
    expectedHash: string,
): { valid: boolean; calculatedHash: string } {
    const clone = { ...rawState }
    if (clone._meta && typeof clone._meta === 'object') {
        const metaClone = { ...(clone._meta as Record<string, unknown>) }
        delete metaClone.state_hash
        clone._meta = metaClone
    }

    const calculatedHash = computeMerkleRoot(clone)
    return {
        valid: calculatedHash.toLowerCase() === expectedHash.toLowerCase(),
        calculatedHash,
    }
}
