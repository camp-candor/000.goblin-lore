import fs from 'node:fs'
import { verifyStateMerkleParity } from './merkleVerifier.js'

export interface LoadBibleOptions {
    verifyHash?: boolean
    expectedHash?: string
}

/**
 * Recursively applies Object.freeze() across all properties, arrays, and dictionaries.
 */
export function deepFreeze<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
        return obj
    }

    Object.freeze(obj)

    Object.getOwnPropertyNames(obj).forEach((prop) => {
        const propVal = (obj as any)[prop]
        if (
            propVal !== null &&
            (typeof propVal === 'object' || typeof propVal === 'function') &&
            !Object.isFrozen(propVal)
        ) {
            deepFreeze(propVal)
        }
    })

    return obj
}

/**
 * Loads bible-state.json from disk and deep freezes the payload.
 */
export function loadBibleState(filePath: string, options?: LoadBibleOptions) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`FILE_NOT_FOUND: ${filePath}`)
    }

    const rawJson = fs.readFileSync(filePath, 'utf8')
    const parsed = JSON.parse(rawJson)

    if (options?.verifyHash || options?.expectedHash) {
        const hashToVerify = options.expectedHash || parsed._meta?.state_hash
        if (!hashToVerify) {
            throw new Error('CANON_DESYNC_HALT: No hash provided or found in payload for verification.')
        }

        const isValid = verifyStateMerkleParity(rawJson, hashToVerify)
        if (!isValid) {
            throw new Error('CANON_DESYNC_HALT: Payload Merkle root hash parity verification failed.')
        }
    }

    return deepFreeze(parsed)
}
