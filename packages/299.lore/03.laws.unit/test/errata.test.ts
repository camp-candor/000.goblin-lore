import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import {
    ErrataRecordSchema,
    ErrataLedgerFileSchema,
} from '../fce/errata.schema.js'
import { appendErrataRecord, verifyErrataLineage } from '../buz/errata.buzz.js'

describe('Phase 3 Cryptographic Errata Ledger Engine Gauntlet', () => {
    let tempDir: string

    beforeEach(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'goblin-errata-test-'))
    })

    afterEach(() => {
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true })
        }
    })

    it('rejects floating-point numbers in sequence_number and recorded_at_epoch', () => {
        expect(() =>
            ErrataRecordSchema.parse({
                errata_id: 'err_float_seq',
                sequence_number: 1.5,
                classification: 'FACTUAL_CONTRADICTION',
                superseded_merkle_hash: 'a'.repeat(64),
                active_merkle_hash: 'b'.repeat(64),
                superseded_commit_sha: '1'.repeat(40),
                active_commit_sha: '2'.repeat(40),
                affected_entity_ids: ['char_bog'],
                rationale:
                    'Valid rationale with sufficient character length here.',
                recorded_at_epoch: 100,
            }),
        ).toThrow('[FLOAT_PROHIBITED]')

        expect(() =>
            ErrataRecordSchema.parse({
                errata_id: 'err_float_epoch',
                sequence_number: 1,
                classification: 'FACTUAL_CONTRADICTION',
                superseded_merkle_hash: 'a'.repeat(64),
                active_merkle_hash: 'b'.repeat(64),
                superseded_commit_sha: '1'.repeat(40),
                active_commit_sha: '2'.repeat(40),
                affected_entity_ids: ['char_bog'],
                rationale:
                    'Valid rationale with sufficient character length here.',
                recorded_at_epoch: 100.25,
            }),
        ).toThrow('[FLOAT_PROHIBITED]')
    })

    it('rejects errata records lacking affected entity ids or with short rationales', () => {
        expect(() =>
            ErrataRecordSchema.parse({
                errata_id: 'err_no_targets',
                sequence_number: 1,
                classification: 'CHRONOLOGICAL_SLIP',
                superseded_merkle_hash: 'a'.repeat(64),
                active_merkle_hash: 'b'.repeat(64),
                superseded_commit_sha: '1'.repeat(40),
                active_commit_sha: '2'.repeat(40),
                affected_entity_ids: [],
                rationale:
                    'Valid rationale with sufficient character length here.',
                recorded_at_epoch: 100,
            }),
        ).toThrow('[ERRATA_EMPTY_TARGETS]')

        expect(() =>
            ErrataRecordSchema.parse({
                errata_id: 'err_short_reason',
                sequence_number: 1,
                classification: 'CHRONOLOGICAL_SLIP',
                superseded_merkle_hash: 'a'.repeat(64),
                active_merkle_hash: 'b'.repeat(64),
                superseded_commit_sha: '1'.repeat(40),
                active_commit_sha: '2'.repeat(40),
                affected_entity_ids: ['char_bog'],
                rationale: 'Too short',
                recorded_at_epoch: 100,
            }),
        ).toThrow('[RATIONALE_TOO_SHORT]')
    })

    it('appends sequential errata records and maintains unbroken hash lineage', () => {
        const genesisHash = '0'.repeat(64)
        const hash1 = '1'.repeat(64)
        const hash2 = '2'.repeat(64)

        // Record 1
        const res1 = appendErrataRecord(tempDir, {
            errata_id: 'err_siphon_diameter',
            sequence_number: 1,
            classification: 'FACTUAL_CONTRADICTION',
            superseded_merkle_hash: genesisHash,
            active_merkle_hash: hash1,
            superseded_commit_sha: 'a'.repeat(40),
            active_commit_sha: 'b'.repeat(40),
            affected_entity_ids: ['loc_culvert_siphon'],
            historical_episodes: ['ep001'],
            rationale:
                'Corrected culvert diameter measurement from 12 inches to 8 inches.',
            recorded_at_epoch: 101,
        })

        expect(res1.success).toBe(true)
        expect(res1.sequenceNumber).toBe(1)
        expect(res1.recordCount).toBe(1)

        // Record 2
        const res2 = appendErrataRecord(tempDir, {
            errata_id: 'err_wart_injury_locus',
            sequence_number: 2,
            classification: 'ANATOMICAL_ANOMALY',
            superseded_merkle_hash: hash1,
            active_merkle_hash: hash2,
            superseded_commit_sha: 'b'.repeat(40),
            active_commit_sha: 'c'.repeat(40),
            affected_entity_ids: ['char_wart'],
            historical_episodes: ['ep001', 'ep002'],
            rationale:
                'Clarified amputation locus below the elbow joint rather than wrist.',
            recorded_at_epoch: 102,
        })

        expect(res2.success).toBe(true)
        expect(res2.sequenceNumber).toBe(2)
        expect(res2.recordCount).toBe(2)

        // Verify Lineage
        const audit = verifyErrataLineage(res2.filePath)
        expect(audit.valid).toBe(true)
        expect(audit.totalRecords).toBe(2)
        expect(audit.genesisHash).toBe(genesisHash)
        expect(audit.currentHeadHash).toBe(hash2)
        expect(audit.errors).toEqual([])
    })

    it('traps broken hash chain links when superseded hash diverges', () => {
        const genesisHash = '0'.repeat(64)
        const hash1 = '1'.repeat(64)
        const rogueHash = 'f'.repeat(64)
        const hash2 = '2'.repeat(64)

        appendErrataRecord(tempDir, {
            errata_id: 'err_initial',
            sequence_number: 1,
            classification: 'HISTORICAL_RETCON',
            superseded_merkle_hash: genesisHash,
            active_merkle_hash: hash1,
            superseded_commit_sha: '1'.repeat(40),
            active_commit_sha: '2'.repeat(40),
            affected_entity_ids: ['char_bog'],
            rationale:
                'Initial historical retcon documentation for the record.',
            recorded_at_epoch: 100,
        })

        // Attempt append with rogue hash
        expect(() =>
            appendErrataRecord(tempDir, {
                errata_id: 'err_divergent',
                sequence_number: 2,
                classification: 'HISTORICAL_RETCON',
                superseded_merkle_hash: rogueHash,
                active_merkle_hash: hash2,
                superseded_commit_sha: '2'.repeat(40),
                active_commit_sha: '3'.repeat(40),
                affected_entity_ids: ['char_bog'],
                rationale: 'Attempting invalid append with broken link hash.',
                recorded_at_epoch: 101,
            }),
        ).toThrow('[ERRATA_HASH_CHAIN_BREACH]')
    })
})
