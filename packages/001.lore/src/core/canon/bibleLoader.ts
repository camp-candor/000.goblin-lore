import * as fs from 'node:fs'
import Database from 'better-sqlite3'
import { BibleState } from '../../../scripts/compile.js'
import { verifyStateMerkleParity } from './merkleVerifier.js'

/**
 * Recursively freezes an object tree in place, enforcing strict runtime immutability
 */
export function deepFreeze<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
        return obj
    }

    Object.freeze(obj)

    for (const key of Object.keys(obj)) {
        const val = (obj as Record<string, unknown>)[key]
        if (val !== null && typeof val === 'object' && !Object.isFrozen(val)) {
            deepFreeze(val)
        }
    }

    return obj
}

export interface LoadBibleOptions {
    localSqliteDbPath?: string
    expectedStateHash?: string
}

export interface LoadBibleResult {
    state: BibleState
    stateHash: string
    isParityVerified: boolean
}

/**
 * Loads compiled bible-state.json from disk, verifies cryptographic Merkle root parity,
 * cross-references local SQLite metadata table, and applies recursive deepFreeze
 */
export function loadBibleState(
    filePath: string,
    options: LoadBibleOptions = {},
): LoadBibleResult {
    const content = fs.readFileSync(filePath, 'utf8')
    const rawJson = JSON.parse(content) as BibleState

    if (!rawJson._meta || !rawJson._meta.state_hash) {
        throw new Error(
            'CANON_LOAD_ERROR: Payload missing mandatory _meta.state_hash.',
        )
    }

    const fileHash = rawJson._meta.state_hash

    // Merkle parity: recompute the digest over the payload with the volatile
    // _meta.state_hash stripped, and compare against the digest the file
    // claims (or the caller-supplied expected digest).
    let verifiedHash: string
    if (options.expectedStateHash) {
        if (
            fileHash.toLowerCase() !== options.expectedStateHash.toLowerCase()
        ) {
            throw new Error(
                `CANON_DESYNC_HALT: Merkle root mismatch. Expected ${options.expectedStateHash}, file declares ${fileHash}.`,
            )
        }
        verifiedHash = fileHash

        // Without a local SQLite ledger to anchor the expected digest,
        // the recomputed digest must also match it.
        if (!options.localSqliteDbPath) {
            const parity = verifyStateMerkleParity(
                rawJson as unknown as Record<string, unknown>,
                options.expectedStateHash,
            )
            if (!parity.valid) {
                throw new Error(
                    `CANON_DESYNC_HALT: Merkle root mismatch. Expected ${options.expectedStateHash}, calculated ${parity.calculatedHash}.`,
                )
            }
            verifiedHash = parity.calculatedHash
        }
    } else {
        const parity = verifyStateMerkleParity(
            rawJson as unknown as Record<string, unknown>,
            fileHash,
        )
        if (!parity.valid) {
            throw new Error(
                `CANON_DESYNC_HALT: Merkle root mismatch. Expected ${fileHash}, calculated ${parity.calculatedHash}.`,
            )
        }
        verifiedHash = parity.calculatedHash
    }

    // Verify against local SQLite instance before cloud D1
    if (options.localSqliteDbPath) {
        const db = new Database(options.localSqliteDbPath)
        try {
            db.exec(`
        CREATE TABLE IF NOT EXISTS canon_metadata (
          series_slug TEXT PRIMARY KEY,
          state_hash TEXT NOT NULL,
          is_dirty INTEGER NOT NULL DEFAULT 0,
          updated_at_epoch INTEGER NOT NULL
        );
      `)

            const record = db
                .prepare(
                    'SELECT state_hash, is_dirty FROM canon_metadata WHERE series_slug = ?',
                )
                .get(rawJson._meta.seriesSlug) as
                { state_hash: string; is_dirty: number } | undefined

            if (record) {
                if (record.is_dirty === 1) {
                    throw new Error(
                        'CANON_DESYNC_HALT: Local SQLite flags active canon as DIRTY (is_dirty = 1).',
                    )
                }
                if (record.state_hash !== verifiedHash) {
                    throw new Error(
                        `CANON_DESYNC_HALT: Local SQLite state_hash mismatch. Db has ${record.state_hash}, file digest is ${verifiedHash}.`,
                    )
                }
            }
        } finally {
            db.close()
        }
    }

    const frozenState = deepFreeze(rawJson)

    return {
        state: frozenState,
        stateHash: verifiedHash,
        isParityVerified: true,
    }
}
