/**
 * packages/299.lore/98.menu.unit/test/menu.errata.ledger.test.ts
 *
 * Vitest verification suite for the Phase 3 Cryptographic Errata Ledger
 * menu wiring: submenu route exposure, real verifyErrataLineage auditing,
 * vacuous genesis handling, fails-closed broken-chain detection, and
 * cns00 telemetry formatting.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { MenuModel } from '../menu.model'
import { openSchemaInvariantsMenu } from '../buz/00.menu.buzz'
import {
    ERRATA_MENU_LABEL,
    ERRATA_AUDIT_HEADER,
    ERRATA_INIT_LINE,
    ERRATA_CHAIN_OK_LINE,
    ERRATA_SEALED_FOOTER,
    ERRATA_BREACHED_FOOTER,
    runErrataLedgerAudit,
    auditErrataLedgers,
    VACUOUS_ERRATA_HEAD_HASH,
} from '../buz/16.errata.ledger.buzz'
import { appendErrataRecord } from '../../03.laws.unit/buz/errata.buzz.js'

describe('299.lore - Cryptographic Errata Ledger Menu Wiring Suite', () => {
    let tempDir: string
    let cwdProbe: string

    beforeEach(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'goblin-errata-menu-'))
    })

    afterEach(() => {
        fs.rmSync(tempDir, { recursive: true, force: true })
    })

    it('openSchemaInvariantsMenu -- exposes manifest, solver, registry, errata, and back options headless', async () => {
        let resolved: any = null
        const bal = {
            idx: 'test-schema-menu',
            dat: { activeSeries: '001.goblin-lore' },
            slv: (res: any) => {
                resolved = res
            },
        }

        const model = new MenuModel()
        await openSchemaInvariantsMenu(model, bal as any, undefined as any)

        expect(resolved).toBeTruthy()
        expect(resolved.mnuBit.lst).toContain(
            '[ 1. VALIDATE ENTITY MANIFESTS ]',
        )
        expect(resolved.mnuBit.lst).toContain('[ 2. RUN SOMATIC SAT SOLVER ]')
        expect(resolved.mnuBit.lst).toContain(
            '[ 3. CONSTITUTIONAL RULE REGISTRY ]',
        )
        expect(resolved.mnuBit.lst).toContain(ERRATA_MENU_LABEL)
        expect(resolved.mnuBit.lst).toContain('[ BACK ]')
    })

    it('runErrataLedgerAudit -- validates vacuous 0-record genesis lineage as sealed', async () => {
        // Run from the real repo root: no series carries world/errata.json yet.
        const lines = await runErrataLedgerAudit()

        expect(lines[0]).toBe(ERRATA_AUDIT_HEADER)
        expect(lines[1]).toBe(ERRATA_INIT_LINE)
        expect(lines).toContain(ERRATA_CHAIN_OK_LINE)
        expect(
            lines.some((l) =>
                l.startsWith('>> [ERRATA:HEAD] Active Merkle Hash: '),
            ),
        ).toBe(true)
        expect(lines[lines.length - 1]).toBe(ERRATA_SEALED_FOOTER)

        // Pure 7-bit ASCII telemetry
        for (const line of lines) {
            expect(/^[\x20-\x7E]*$/.test(line)).toBe(true)
        }
    })

    it('runErrataLedgerAudit -- sweeps a disk-backed healthy ledger and reports the active head hash', async () => {
        cwdProbe = process.cwd()
        fs.mkdirSync(
            path.join(tempDir, 'series', 'under-the-floorboards', 'world'),
            {
                recursive: true,
            },
        )
        process.chdir(tempDir)
        try {
            appendErrataRecord(
                'under-the-floorboards',
                {
                    errata_id: 'err_first',
                    sequence_number: 1,
                    classification: 'FACTUAL_CONTRADICTION',
                    superseded_merkle_hash: '0'.repeat(64),
                    active_merkle_hash: '1'.repeat(64),
                    superseded_commit_sha: 'a'.repeat(40),
                    active_commit_sha: 'b'.repeat(40),
                    affected_entity_ids: ['char_bog'],
                    rationale:
                        'Valid rationale documentation for ledger audit.',
                    recorded_at_epoch: 100,
                },
                tempDir,
            )

            const lines = await runErrataLedgerAudit()

            expect(lines[0]).toBe(ERRATA_AUDIT_HEADER)
            expect(
                lines.some(
                    (l) =>
                        l.includes('>> [ERRATA:OK] under-the-floorboards:') &&
                        l.includes('1 append-only record(s)'),
                ),
            ).toBe(true)
            expect(lines).toContain(ERRATA_CHAIN_OK_LINE)
            expect(
                lines.some(
                    (l) =>
                        l.startsWith('>> [ERRATA:HEAD] Active Merkle Hash: ') &&
                        l.endsWith('1'.repeat(64)),
                ),
            ).toBe(true)
            expect(lines[lines.length - 1]).toBe(ERRATA_SEALED_FOOTER)
        } finally {
            process.chdir(cwdProbe)
        }
    })

    it('runErrataLedgerAudit -- fails closed with a breached footer on a broken hash chain', async () => {
        cwdProbe = process.cwd()
        fs.mkdirSync(path.join(tempDir, 'series', 'wiregrass-basin', 'world'), {
            recursive: true,
        })
        process.chdir(tempDir)
        try {
            appendErrataRecord(
                'wiregrass-basin',
                {
                    errata_id: 'err_01',
                    sequence_number: 1,
                    classification: 'FACTUAL_CONTRADICTION',
                    superseded_merkle_hash: '0'.repeat(64),
                    active_merkle_hash: '1'.repeat(64),
                    superseded_commit_sha: 'a'.repeat(40),
                    active_commit_sha: 'b'.repeat(40),
                    affected_entity_ids: ['char_spleen'],
                    rationale:
                        'Valid rationale documentation for first record.',
                    recorded_at_epoch: 100,
                },
                tempDir,
            )

            appendErrataRecord(
                'wiregrass-basin',
                {
                    errata_id: 'err_02',
                    sequence_number: 2,
                    classification: 'FACTUAL_CONTRADICTION',
                    superseded_merkle_hash: '1'.repeat(64),
                    active_merkle_hash: '2'.repeat(64),
                    superseded_commit_sha: 'b'.repeat(40),
                    active_commit_sha: 'c'.repeat(40),
                    affected_entity_ids: ['char_spleen'],
                    rationale:
                        'Valid rationale documentation for second record.',
                    recorded_at_epoch: 101,
                },
                tempDir,
            )

            // Forge a rogue superseded link directly into the ledger to sever
            // record err_02 from the preceding active_merkle_hash.
            const ledgerPath = path.join(
                tempDir,
                'series',
                'wiregrass-basin',
                'world',
                'errata.json',
            )
            const ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'))
            ledger.records[1].superseded_merkle_hash = '8'.repeat(64)
            fs.writeFileSync(ledgerPath, JSON.stringify(ledger), 'utf8')

            const lines = await runErrataLedgerAudit()

            expect(lines[lines.length - 1]).toBe(ERRATA_BREACHED_FOOTER)
            expect(lines).not.toContain(ERRATA_CHAIN_OK_LINE)
            expect(lines.some((l) => l.includes('[HASH_DISCONTINUITY]'))).toBe(
                true,
            )
            expect(lines.some((l) => l.includes('[ERRATA:FATAL]'))).toBe(true)
        } finally {
            process.chdir(cwdProbe)
        }
    })

    it('auditErrataLedgers -- reports vacuous empty-stream head hash and zero errors', async () => {
        cwdProbe = process.cwd()
        process.chdir(tempDir)
        try {
            const audit = auditErrataLedgers()
            expect(audit.valid).toBe(true)
            expect(audit.errors).toEqual([])
            expect(audit.auditedLedgers).toBe(0)
            expect(audit.totalRecords).toBe(0)
            expect(audit.headHash).toBe(VACUOUS_ERRATA_HEAD_HASH)
        } finally {
            process.chdir(cwdProbe)
        }
    })
})
