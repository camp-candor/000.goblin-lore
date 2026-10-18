import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { FactNodeSchema, FactNode } from '../src/schemas/factNode.schema.js'
import {
    computeFactContentHash,
    verifyMonotonicClaimUpdate,
    generateClaimDiff,
} from '../src/core/versioning/monotonicDiffGuard.js'

describe('Task MV-1.1: Monotonic Claim-Diff Guard & Fact Node Schema', () => {
    let db: Database.Database

    beforeEach(() => {
        db = new Database(':memory:')
        db.exec(`
      CREATE TABLE facts (
        id TEXT PRIMARY KEY,
        claim_text TEXT NOT NULL,
        scope TEXT CHECK(scope IN ('CHARACTER', 'LOCATION', 'LOGISTIC', 'LAW')) NOT NULL,
        authority_level TEXT NOT NULL,
        standing TEXT NOT NULL,
        version INTEGER NOT NULL DEFAULT 1,
        content_hash TEXT NOT NULL,
        author TEXT NOT NULL,
        created_at_epoch INTEGER NOT NULL,
        last_edited_epoch INTEGER NOT NULL
      );
    `)
    })

    afterEach(() => {
        db.close()
    })

    const createSampleFact = (overrides: Partial<FactNode> = {}): FactNode => {
        const claim =
            overrides.claim_text || 'The rusted key has three distinct tumblers'
        const scope = overrides.scope || 'LOGISTIC'
        const hash =
            overrides.content_hash || computeFactContentHash(claim, scope)

        return FactNodeSchema.parse({
            id: 'fact_culvert_key',
            claim_text: claim,
            scope: scope,
            authority_level: 'CANON',
            standing: 'ACTIVE_ENDORSED',
            version: 1,
            content_hash: hash,
            author: 'Elena',
            created_at_epoch: 0,
            last_edited_epoch: 0,
            ...overrides,
        })
    }

    it('enforces strict Zod validation rejecting un-schemaed properties and non-positive versions', () => {
        const base = createSampleFact()
        expect(() =>
            FactNodeSchema.parse({
                ...base,
                unauthorized_field: 'ILLEGAL_DATA',
            }),
        ).toThrow()

        expect(() =>
            FactNodeSchema.parse({
                ...base,
                version: 0,
            }),
        ).toThrow()
    })

    it('computes deterministic SHA-256 content hashes with Unicode NFC normalization', () => {
        const textA = "Spleen's hideout in Sector 4"
        const textB = "Spleen's hideout in Sector 4\u0041\u030A" // Decomposed \\u00C5
        const textBNormalized = "Spleen's hideout in Sector 4\u00C5" // Precomposed \\u00C5

        const hash1 = computeFactContentHash(textB, 'LOCATION')
        const hash2 = computeFactContentHash(textBNormalized, 'LOCATION')
        expect(hash1).toBe(hash2)
        expect(hash1).toHaveLength(64)
    })

    it('permits valid monotonic version updates when claim_text changes', () => {
        const factV1 = createSampleFact({ version: 1 })
        const factV2 = createSampleFact({
            version: 2,
            claim_text: 'The key is a flat brass skeleton key',
            content_hash: computeFactContentHash(
                'The key is a flat brass skeleton key',
                'LOGISTIC',
            ),
        })

        const result = verifyMonotonicClaimUpdate(factV1, factV2)
        expect(result.valid).toBe(true)
        expect(result.diff?.is_claim_mutated).toBe(true)
        expect(result.diff?.human_readable_diff).toContain('mutated v1 -> v2')
    })

    it('catches MONOTONIC_VERSION_REGRESSION_BREACH when claim mutates without version bump', () => {
        const factV1 = createSampleFact({ version: 1 })
        const corruptUpdate = createSampleFact({
            version: 1, // ILLEGAL: Version did not increment
            claim_text: 'The key is a flat brass skeleton key',
            content_hash: computeFactContentHash(
                'The key is a flat brass skeleton key',
                'LOGISTIC',
            ),
        })

        const result = verifyMonotonicClaimUpdate(factV1, corruptUpdate)
        expect(result.valid).toBe(false)
        expect(result.errorCode).toBe('MONOTONIC_VERSION_REGRESSION_BREACH')
        expect(result.reason).toContain('Claim text mutated')
    })

    it('catches authority demotion attempts', () => {
        const canonFact = createSampleFact({
            authority_level: 'CANON',
            version: 1,
        })
        const demotedFact = createSampleFact({
            version: 2,
            authority_level: 'SPECULATION',
            claim_text: 'Speculative guess about the key',
            content_hash: computeFactContentHash(
                'Speculative guess about the key',
                'LOGISTIC',
            ),
        })

        const result = verifyMonotonicClaimUpdate(canonFact, demotedFact)
        expect(result.valid).toBe(false)
        expect(result.errorCode).toBe('AUTHORITY_DEMOTION_BREACH')
    })

    it('preserves the Zero-Cascade Liminal Guarantee on FLAGGED_FOR_REVIEW without version bump', () => {
        const factV1 = createSampleFact({
            version: 2,
            standing: 'ACTIVE_ENDORSED',
        })
        const liminalReview = createSampleFact({
            version: 2, // No version bump required for standing review
            standing: 'FLAGGED_FOR_REVIEW',
            review_notes: 'Marcus doubts if key is three-tumbler',
        })

        const result = verifyMonotonicClaimUpdate(factV1, liminalReview)
        expect(result.valid).toBe(true)
        expect(result.diff?.is_claim_mutated).toBe(false)
        expect(result.diff?.is_standing_mutated).toBe(true)
    })

    it('verifies transition integrity inside local SQLite transactions', () => {
        const factV1 = createSampleFact({ version: 1 })

        const insertStmt = db.prepare(`
      INSERT INTO facts (id, claim_text, scope, authority_level, standing, version, content_hash, author, created_at_epoch, last_edited_epoch)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

        insertStmt.run(
            factV1.id,
            factV1.claim_text,
            factV1.scope,
            factV1.authority_level,
            factV1.standing,
            factV1.version,
            factV1.content_hash,
            factV1.author,
            factV1.created_at_epoch,
            factV1.last_edited_epoch,
        )

        // Attempt invalid update: mutated claim without version increment
        const proposedV2Claim = 'Key was melted down'
        const proposedV2Hash = computeFactContentHash(
            proposedV2Claim,
            'LOGISTIC',
        )

        const row = db
            .prepare('SELECT * FROM facts WHERE id = ?')
            .get(factV1.id) as any
        const existingFact = FactNodeSchema.parse(row)

        const proposedFact: FactNode = {
            ...existingFact,
            claim_text: proposedV2Claim,
            content_hash: proposedV2Hash,
            version: existingFact.version, // Unbumped!
        }

        const guardResult = verifyMonotonicClaimUpdate(
            existingFact,
            proposedFact,
        )
        expect(guardResult.valid).toBe(false)

        // Assert that the database remains unmutated
        const currentDbFact = db
            .prepare('SELECT claim_text, version FROM facts WHERE id = ?')
            .get(factV1.id) as any
        expect(currentDbFact.claim_text).toBe(factV1.claim_text)
        expect(currentDbFact.version).toBe(1)
    })
})
