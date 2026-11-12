/**
 * packages/299.lore/98.menu.unit/buz/16.errata.ledger.buzz.ts
 *
 * Cryptographic Errata Ledger audit buzzer. Sweeps every discovered series
 * world/errata.json hash-chain ledger through the real verifyErrataLineage
 * gauntlet, handles 0-record vacuous ledgers as valid genesis state, and
 * streams pure 7-bit ASCII telemetry into the cns00 Blessed console pane.
 */

import fs from 'node:fs'
import path from 'node:path'
import { verifyErrataLineage } from '../../03.laws.unit/buz/errata.buzz.js'
import { EMPTY_STREAM_SHA256 } from '../../43.compile.unit/buz/compile.buzz.js'

export const ERRATA_MENU_LABEL = '[ 4. CRYPTOGRAPHIC ERRATA LEDGER ]'

export const ERRATA_AUDIT_HEADER =
    '--- [299.LORE :: 03.LAWS.UNIT :: CRYPTOGRAPHIC ERRATA AUDIT] ---'

export const ERRATA_INIT_LINE = '>> [ERRATA:INIT] Loading world/errata.json...'

export const ERRATA_CHAIN_OK_LINE =
    '>> [ERRATA:CHAIN_OK] Verified unbroken hash lineage across records.'

export const ERRATA_SEALED_FOOTER =
    '--- [AUDIT COMPLETE: ERRATA LEDGER SEALED AT T0 = $0.00] ---'

export const ERRATA_BREACHED_FOOTER =
    '--- [AUDIT HALTED: ERRATA LEDGER BREACHED AT T0 = $0.00] ---'

/**
 * Vacuous lineage head hash for series with no world/errata.json on disk:
 * the SHA-256 of the empty stream, i.e. the un-mutated genesis canon state.
 */
export const VACUOUS_ERRATA_HEAD_HASH = EMPTY_STREAM_SHA256

function findSeriesBaseDir(): string | null {
    let curr = process.cwd()
    while (curr && curr !== path.dirname(curr)) {
        const candidate = path.join(curr, 'series')
        if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
            return candidate
        }
        curr = path.dirname(curr)
    }
    return null
}

function listSeriesSlugs(baseDir: string): string[] {
    return fs
        .readdirSync(baseDir, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
        .sort((a, b) =>
            a === 'under-the-floorboards'
                ? -1
                : b === 'under-the-floorboards'
                  ? 1
                  : a.localeCompare(b),
        )
}

export interface ErrataLedgerAudit {
    auditedLedgers: number
    totalRecords: number
    headHash: string
    valid: boolean
    errors: string[]
}

/**
 * Sweeps every series errata ledger from disk through the real
 * verifyErrataLineage hash-chain gauntlet. Missing ledgers count as
 * vacuous 0-record genesis lineage (valid). Fails closed on the first
 * broken hash link or corrupted ledger file.
 */
export function auditErrataLedgers(): ErrataLedgerAudit {
    const errors: string[] = []
    const baseDir = findSeriesBaseDir()

    let auditedLedgers = 0
    let totalRecords = 0
    let headHash = VACUOUS_ERRATA_HEAD_HASH

    if (!baseDir) {
        return {
            auditedLedgers: 0,
            totalRecords: 0,
            headHash,
            valid: true,
            errors,
        }
    }

    for (const slug of listSeriesSlugs(baseDir)) {
        const ledgerPath = path.join(baseDir, slug, 'world', 'errata.json')
        if (!fs.existsSync(ledgerPath)) {
            continue // Vacuous 0-record genesis lineage is valid.
        }

        auditedLedgers += 1
        const report = verifyErrataLineage(slug, path.dirname(baseDir))
        if (!report.valid) {
            headHash = ''
            for (const err of report.errors) {
                errors.push(`[${slug}] ${err}`)
            }
        } else {
            totalRecords += report.totalRecords
            if (report.totalRecords > 0) {
                headHash = report.headHash
            }
        }
    }

    return {
        auditedLedgers,
        totalRecords,
        headHash,
        valid: errors.length === 0,
        errors,
    }
}

/**
 * Streams the full cryptographic errata ledger audit as pure 7-bit ASCII
 * lines for the cns00 Blessed console pane.
 */
export const runErrataLedgerAudit = async (): Promise<string[]> => {
    const lines: string[] = []
    lines.push(ERRATA_AUDIT_HEADER)
    lines.push(ERRATA_INIT_LINE)

    const baseDir = findSeriesBaseDir()
    if (baseDir) {
        for (const slug of listSeriesSlugs(baseDir)) {
            const ledgerPath = path.join(baseDir, slug, 'world', 'errata.json')
            if (!fs.existsSync(ledgerPath)) {
                lines.push(
                    `>> [ERRATA:VACUOUS] ${slug}: no world/errata.json on disk - 0-record genesis lineage valid.`,
                )
                continue
            }
            const report = verifyErrataLineage(slug, path.dirname(baseDir))
            if (!report.valid) {
                for (const err of report.errors) {
                    lines.push(`:: [${slug}] ${err}`)
                }
            } else {
                lines.push(
                    `>> [ERRATA:OK] ${slug}: ${report.totalRecords} append-only record(s), head sealed.`,
                )
            }
        }
    }

    const audit = auditErrataLedgers()

    if (!audit.valid) {
        for (const err of audit.errors) {
            lines.push(`:: [ERRATA:FATAL] ${err}`)
        }
        lines.push(ERRATA_BREACHED_FOOTER)
        return lines
    }

    lines.push(ERRATA_CHAIN_OK_LINE)
    lines.push(`>> [ERRATA:HEAD] Active Merkle Hash: ${audit.headHash}`)
    lines.push(ERRATA_SEALED_FOOTER)
    return lines
}
