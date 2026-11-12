import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import {
    appendErrataRecord,
    verifyErrataLineage,
    loadErrataLedgerFile,
} from '../buz/errata.buzz.js'
import type { ErrataRecord } from '../fce/errata.schema.js'

describe('03.laws.unit :: Cryptographic Errata Lineage Sealer and Verifier', () => {
    let tempRepoRoot: string
    const seriesSlug = 'test-chronicle'
    const genesisHash = '0'.repeat(64)

    beforeEach(() => {
        tempRepoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'errata-test-'))
        const worldDir = path.join(tempRepoRoot, 'series', seriesSlug, 'world')
        fs.mkdirSync(worldDir, { recursive: true })
    })

    afterEach(() => {
        fs.rmSync(tempRepoRoot, { recursive: true, force: true })
    })

    it('appends the first errata record anchored to the genesis hash', () => {
        const record1: ErrataRecord = {
            errata_id: 'err_aperture_01',
            sequence_number: 1,
            classification: 'FACTUAL_CONTRADICTION',
            superseded_merkle_hash: genesisHash,
            active_merkle_hash: '1'.repeat(64),
            superseded_commit_sha: 'a'.repeat(40),
            active_commit_sha: 'b'.repeat(40),
            affected_entity_ids: ['loc_culvert_siphon'],
            historical_episodes: ['ep001'],
            rationale:
                'Corrected pipe diameter from six inches to eight inches.',
            recorded_at_epoch: 100,
        }

        const res = appendErrataRecord(seriesSlug, record1, tempRepoRoot)
        expect(res.success).toBe(true)
        expect(res.totalRecords).toBe(1)

        const ledger = loadErrataLedgerFile(res.ledgerPath!)
        expect(ledger.records.length).toBe(1)
        expect(ledger.records[0].errata_id).toBe('err_aperture_01')

        const audit = verifyErrataLineage(seriesSlug, tempRepoRoot)
        expect(audit.valid).toBe(true)
        expect(audit.totalRecords).toBe(1)
        expect(audit.headHash).toBe('1'.repeat(64))
    })

    it('appends multiple sequential records maintaining strict hash continuity', () => {
        const record1: ErrataRecord = {
            errata_id: 'err_seq_01',
            sequence_number: 1,
            classification: 'FACTUAL_CONTRADICTION',
            superseded_merkle_hash: genesisHash,
            active_merkle_hash: '1'.repeat(64),
            superseded_commit_sha: 'a'.repeat(40),
            active_commit_sha: 'b'.repeat(40),
            affected_entity_ids: ['loc_culvert_siphon'],
            historical_episodes: ['ep001'],
            rationale: 'First historical correction for pipe diameter.',
            recorded_at_epoch: 100,
        }

        const record2: ErrataRecord = {
            errata_id: 'err_seq_02',
            sequence_number: 2,
            classification: 'ANATOMICAL_ANOMALY',
            superseded_merkle_hash: '1'.repeat(64),
            active_merkle_hash: '2'.repeat(64),
            superseded_commit_sha: 'b'.repeat(40),
            active_commit_sha: 'c'.repeat(40),
            affected_entity_ids: ['char_wart'],
            historical_episodes: ['ep001', 'ep002'],
            rationale: 'Standardized left arm amputation date in timeline.',
            recorded_at_epoch: 200,
        }

        appendErrataRecord(seriesSlug, record1, tempRepoRoot)
        const res2 = appendErrataRecord(seriesSlug, record2, tempRepoRoot)

        expect(res2.success).toBe(true)
        expect(res2.totalRecords).toBe(2)

        const audit = verifyErrataLineage(seriesSlug, tempRepoRoot)
        expect(audit.valid).toBe(true)
        expect(audit.totalRecords).toBe(2)
        expect(audit.genesisHash).toBe(genesisHash)
        expect(audit.headHash).toBe('2'.repeat(64))
    })

    it('rejects sequence number jumps or out-of-order appends', () => {
        const record1: ErrataRecord = {
            errata_id: 'err_seq_01',
            sequence_number: 1,
            classification: 'FACTUAL_CONTRADICTION',
            superseded_merkle_hash: genesisHash,
            active_merkle_hash: '1'.repeat(64),
            superseded_commit_sha: 'a'.repeat(40),
            active_commit_sha: 'b'.repeat(40),
            affected_entity_ids: ['loc_culvert_siphon'],
            historical_episodes: ['ep001'],
            rationale: 'First historical correction for pipe diameter.',
            recorded_at_epoch: 100,
        }
        appendErrataRecord(seriesSlug, record1, tempRepoRoot)

        const jumpRecord: ErrataRecord = {
            errata_id: 'err_seq_03',
            sequence_number: 3, // Expected 2
            classification: 'HISTORICAL_RETCON',
            superseded_merkle_hash: '1'.repeat(64),
            active_merkle_hash: '3'.repeat(64),
            superseded_commit_sha: 'b'.repeat(40),
            active_commit_sha: 'c'.repeat(40),
            affected_entity_ids: ['char_bog'],
            historical_episodes: ['ep002'],
            rationale: 'Illegal jump in sequence numbering.',
            recorded_at_epoch: 300,
        }

        expect(() =>
            appendErrataRecord(seriesSlug, jumpRecord, tempRepoRoot),
        ).toThrow(/ERRATA_SEQUENCE_DISCONTINUITY/)
    })

    it('rejects cyclic or no-op hashes where superseded equals active', () => {
        const cyclicRecord: ErrataRecord = {
            errata_id: 'err_cyclic_01',
            sequence_number: 1,
            classification: 'ORTHOGRAPHIC_CANONIZATION',
            superseded_merkle_hash: 'a'.repeat(64),
            active_merkle_hash: 'a'.repeat(64), // Cyclic
            superseded_commit_sha: '1'.repeat(40),
            active_commit_sha: '2'.repeat(40),
            affected_entity_ids: ['char_wart'],
            historical_episodes: ['ep001'],
            rationale: 'Cyclic hash reference attempt.',
            recorded_at_epoch: 100,
        }

        expect(() =>
            appendErrataRecord(seriesSlug, cyclicRecord, tempRepoRoot),
        ).toThrow(/CYCLIC_HASH_REFERENCE/)
    })

    it('traps hash discontinuities when verifying tampered ledgers', () => {
        const record1: ErrataRecord = {
            errata_id: 'err_seq_01',
            sequence_number: 1,
            classification: 'FACTUAL_CONTRADICTION',
            superseded_merkle_hash: genesisHash,
            active_merkle_hash: '1'.repeat(64),
            superseded_commit_sha: 'a'.repeat(40),
            active_commit_sha: 'b'.repeat(40),
            affected_entity_ids: ['loc_culvert_siphon'],
            historical_episodes: ['ep001'],
            rationale: 'First historical correction for pipe diameter.',
            recorded_at_epoch: 100,
        }
        appendErrataRecord(seriesSlug, record1, tempRepoRoot)

        // Artificially mutate errata.json on disk to simulate a broken chain
        const ledgerFile = path.join(
            tempRepoRoot,
            'series',
            seriesSlug,
            'world',
            'errata.json',
        )
        const ledger = JSON.parse(fs.readFileSync(ledgerFile, 'utf8'))
        ledger.records.push({
            errata_id: 'err_tampered_02',
            sequence_number: 2,
            classification: 'HISTORICAL_RETCON',
            superseded_merkle_hash: 'f'.repeat(64), // Does not match record1's active_merkle_hash
            active_merkle_hash: '9'.repeat(64),
            superseded_commit_sha: 'b'.repeat(40),
            active_commit_sha: 'c'.repeat(40),
            affected_entity_ids: ['char_bog'],
            historical_episodes: ['ep002'],
            rationale: 'Tampered hash continuity record.',
            recorded_at_epoch: 200,
        })
        fs.writeFileSync(ledgerFile, JSON.stringify(ledger, null, 2), 'utf8')

        const audit = verifyErrataLineage(seriesSlug, tempRepoRoot)
        expect(audit.valid).toBe(false)
        expect(
            audit.errors.some((e) => e.includes('[HASH_DISCONTINUITY]')),
        ).toBe(true)
        expect(audit.discontinuities.length).toBe(1)
        expect(audit.discontinuities[0].errataId).toBe('err_tampered_02')
    })
})
