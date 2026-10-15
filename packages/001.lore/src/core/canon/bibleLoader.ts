import fs from 'node:fs'
import { verifyStateMerkleParity } from './merkleVerifier.js'

export interface LoadBibleOptions {
    verifyHash?: boolean
}

/**
 * Deep freezes an object recursively to prevent any mutations.
 */
export function deepFreeze<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
        return obj
    }

    Object.freeze(obj)

    for (const propKey in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, propKey)) {
            const prop = (obj as any)[propKey]
            if (
                typeof prop === 'object' &&
                prop !== null &&
                !Object.isFrozen(prop)
            ) {
                deepFreeze(prop)
            }
        }
    }

    return obj
}

/**
 * Loads the bible-state.json from disk, verifies its Merkle root hash,
 * and deep freezes the object before returning it.
 */
export function loadBibleState(filePath: string, options?: LoadBibleOptions) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`CANON_DESYNC_HALT: File not found at ${filePath}`)
    }

    const fileContent = fs.readFileSync(filePath, 'utf8')
    const state = JSON.parse(fileContent)

    if (options?.verifyHash !== false) {
        if (!state._meta || typeof state._meta.state_hash !== 'string') {
            throw new Error(
                'CANON_DESYNC_HALT: Missing _meta.state_hash in payload',
            )
        }
        verifyStateMerkleParity(state, state._meta.state_hash)
    }

    return deepFreeze(state)
}
