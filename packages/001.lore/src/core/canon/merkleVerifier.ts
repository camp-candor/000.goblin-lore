import crypto from 'node:crypto'

/**
 * Implements RFC 8785 JSON Canonicalization Scheme (JCS).
 * - Recursively sorts dictionary keys lexicographically by UTF-16 code units
 * - Applies Unicode Normalization Form C (NFC) across all string literals
 * - Rejects non-finite IEEE 754 numbers
 * - Zero ambient whitespace
 */
export function canonicalizeJson(obj: unknown): string {
    if (obj === null) {
        return 'null'
    }
    if (typeof obj === 'boolean') {
        return obj ? 'true' : 'false'
    }
    if (typeof obj === 'number') {
        if (!Number.isFinite(obj)) {
            throw new TypeError('Non-finite numbers (NaN, Infinity) are rejected')
        }
        return JSON.stringify(obj)
    }
    if (typeof obj === 'string') {
        return JSON.stringify(obj.normalize('NFC'))
    }
    if (Array.isArray(obj)) {
        const elements = obj.map((item) =>
            item === undefined ? 'null' : canonicalizeJson(item),
        )
        return `[${elements.join(',')}]`
    }
    if (typeof obj === 'object') {
        const keys = Object.keys(obj)
            .filter((k) => (obj as any)[k] !== undefined)
            .sort((a, b) => {
                // Lexicographically by UTF-16 code units
                if (a < b) return -1
                if (a > b) return 1
                return 0
            })

        const properties = keys.map((k) => {
            const val = (obj as any)[k]
            return `${JSON.stringify(k)}:${canonicalizeJson(val)}`
        })

        return `{${properties.join(',')}}`
    }
    throw new TypeError(`Unsupported type: ${typeof obj}`)
}

/**
 * Calculates a 64-character lowercase hexadecimal SHA-256 digest
 */
export function computeMerkleRoot(canonicalPayload: string): string {
    return crypto.createHash('sha256').update(canonicalPayload, 'utf8').digest('hex')
}

/**
 * Strips volatile root _meta.state_hash before verifying canonical byte parity
 */
export function verifyStateMerkleParity(rawStateJson: string, expectedHash: string): boolean {
    const obj = JSON.parse(rawStateJson)
    if (obj && obj._meta && obj._meta.state_hash) {
        delete obj._meta.state_hash
    }
    const canonicalPayload = canonicalizeJson(obj)
    const computedHash = computeMerkleRoot(canonicalPayload)
    return computedHash === expectedHash
}
