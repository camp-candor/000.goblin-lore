import Database from 'better-sqlite3'
import * as fs from 'node:fs'

export interface SyncOptions {
    localDbPath: string
    compiledBiblePath: string
    isGate1Passed: boolean
    d1BindingTarget?: string
}

export interface SyncResult {
    success: boolean
    syncedFactsCount: number
    stateHash: string
    message: string
}

/**
 * Deploys locally validated canon facts to Cloudflare D1 ONLY after Gate 1 validation passes.
 * No remote edge call is made during local validation; this bridge verifies
 * preconditions and reports sync readiness.
 */
export function syncValidatedCanonToD1(options: SyncOptions): SyncResult {
    if (!options.isGate1Passed) {
        throw new Error(
            'GATE_1_PRECONDITION_FAILED: Cannot deploy to Cloudflare D1 until Gate 1 local audit clears 100%.',
        )
    }

    if (!fs.existsSync(options.localDbPath)) {
        throw new Error(
            `LOCAL_DB_NOT_FOUND: Local SQLite database '${options.localDbPath}' missing.`,
        )
    }

    if (!fs.existsSync(options.compiledBiblePath)) {
        throw new Error(
            `COMPILED_BIBLE_NOT_FOUND: Compiled bible '${options.compiledBiblePath}' missing.`,
        )
    }

    const localDb = new Database(options.localDbPath, { readonly: true })
    let factsCount = 0
    try {
        const row = localDb
            .prepare('SELECT COUNT(*) AS total FROM facts')
            .get() as { total: number }
        factsCount = row.total
    } finally {
        localDb.close()
    }

    const bibleContent = fs.readFileSync(options.compiledBiblePath, 'utf8')
    const bibleJson = JSON.parse(bibleContent) as {
        _meta?: { state_hash?: string }
    }
    const stateHash = bibleJson._meta?.state_hash

    if (!stateHash) {
        throw new Error(
            'COMPILED_HASH_MISSING: bible-state.json is missing _meta.state_hash.',
        )
    }

    if (!/^[0-9a-f]{64}$/i.test(stateHash)) {
        throw new Error(
            'COMPILED_HASH_INVALID: bible-state.json _meta.state_hash must be a valid 64-character Merkle root.',
        )
    }

    console.log(
        `>> [D1_MIGRATE] Preconditions verified. Gate 1: PASSED. Local Facts: ${factsCount}.`,
    )
    console.log(
        `>> [D1_MIGRATE] Upstream sink target: ${options.d1BindingTarget || 'CANON_DB'}.`,
    )
    console.log(`>> [D1_MIGRATE] Sealed Merkle Root H_root: ${stateHash}`)

    return {
        success: true,
        syncedFactsCount: factsCount,
        stateHash,
        message: 'GATE_1_VERIFIED_D1_SYNC_READY',
    }
}
