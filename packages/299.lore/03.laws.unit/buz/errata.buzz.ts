import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import {
    ErrataRecordSchema,
    ErrataLedgerFileSchema,
    type ErrataRecord,
    type ErrataLedgerFile,
} from '../fce/errata.schema.js'
import type {
    ErrataAppendResult,
    ErrataLineageVerificationReport,
} from '../fce/errataOperation.bit.js'
import type { LawsModel } from '../laws.model.js'
import type ErrataOperationBit from '../fce/errataOperation.bit.js'
import type State from '../../99.core/state.js'

export function resolveRepoRoot(): string {
    let curr = process.cwd()
    for (let i = 0; i < 6; i++) {
        if (
            fs.existsSync(path.join(curr, 'series')) ||
            fs.existsSync(path.join(curr, 'package.json'))
        ) {
            if (fs.existsSync(path.join(curr, 'packages/299.lore'))) {
                return curr
            }
        }
        const parent = path.dirname(curr)
        if (parent === curr) break
        curr = parent
    }
    return process.cwd()
}

export function loadErrataLedgerFile(
    ledgerPath: string,
    defaultGenesisHash?: string,
    seriesSlug?: string,
): ErrataLedgerFile {
    if (!fs.existsSync(ledgerPath)) {
        return {
            schema_version: '1.0.0',
            series_slug: seriesSlug || 'default-series',
            genesis_merkle_hash: defaultGenesisHash || '0'.repeat(64),
            records: [],
        }
    }

    const raw = fs.readFileSync(ledgerPath, 'utf8').trim()
    if (!raw) {
        return {
            schema_version: '1.0.0',
            series_slug: seriesSlug || 'default-series',
            genesis_merkle_hash: defaultGenesisHash || '0'.repeat(64),
            records: [],
        }
    }

    const parsed = JSON.parse(raw)
    return ErrataLedgerFileSchema.parse(parsed)
}

export function appendErrataRecord(
    seriesSlug: string,
    candidateRecord: ErrataRecord,
    customRepoRoot?: string,
): ErrataAppendResult {
    const validatedRecord = ErrataRecordSchema.parse(candidateRecord)
    const repoRoot = customRepoRoot || resolveRepoRoot()
    const worldDir = path.join(repoRoot, 'series', seriesSlug, 'world')
    const ledgerPath = path.join(worldDir, 'errata.json')

    if (!fs.existsSync(worldDir)) {
        fs.mkdirSync(worldDir, { recursive: true })
    }

    const ledger = loadErrataLedgerFile(
        ledgerPath,
        validatedRecord.superseded_merkle_hash,
        seriesSlug,
    )
    const existingRecords = ledger.records

    // 1. Verify Monotonic Sequence Number Increment
    const expectedSeq = existingRecords.length + 1
    if (validatedRecord.sequence_number !== expectedSeq) {
        throw new Error(
            `[ERRATA_SEQUENCE_DISCONTINUITY] sequence_number must equal next index ${expectedSeq}, got ${validatedRecord.sequence_number}`,
        )
    }

    // 2. Reject Cyclic/No-Op Hashes
    if (
        validatedRecord.superseded_merkle_hash ===
        validatedRecord.active_merkle_hash
    ) {
        throw new Error(
            `[CYCLIC_HASH_REFERENCE] superseded_merkle_hash cannot equal active_merkle_hash (${validatedRecord.active_merkle_hash})`,
        )
    }

    // 3. Reject Duplicate Errata Identifiers
    if (
        existingRecords.some((r) => r.errata_id === validatedRecord.errata_id)
    ) {
        throw new Error(
            `[DUPLICATE_ERRATA_ID] Errata entry with id '${validatedRecord.errata_id}' already exists in ledger`,
        )
    }

    // 4. Verify Cryptographic Lineage Chaining
    if (existingRecords.length === 0) {
        if (
            validatedRecord.superseded_merkle_hash !==
            ledger.genesis_merkle_hash
        ) {
            throw new Error(
                `[GENESIS_HASH_MISMATCH] First errata record must supersede genesis hash '${ledger.genesis_merkle_hash}', got '${validatedRecord.superseded_merkle_hash}'`,
            )
        }
    } else {
        const tailRecord = existingRecords[existingRecords.length - 1]
        if (
            validatedRecord.superseded_merkle_hash !==
            tailRecord.active_merkle_hash
        ) {
            throw new Error(
                `[HASH_DISCONTINUITY] superseded_merkle_hash '${validatedRecord.superseded_merkle_hash}' must match preceding tail active hash '${tailRecord.active_merkle_hash}'`,
            )
        }
    }

    // 5. Append and Write Atomically via Sibling Temporary File
    const updatedLedger: ErrataLedgerFile = {
        schema_version: '1.0.0',
        series_slug: seriesSlug,
        genesis_merkle_hash: ledger.genesis_merkle_hash,
        records: [...existingRecords, validatedRecord],
    }

    const tempUuid = crypto.randomBytes(6).toString('hex')
    const tempPath = path.join(worldDir, `.tmp_${tempUuid}_errata.json`)

    fs.writeFileSync(
        tempPath,
        JSON.stringify(updatedLedger, null, 2) + '\n',
        'utf8',
    )
    fs.renameSync(tempPath, ledgerPath)

    return {
        success: true,
        record: validatedRecord,
        ledgerPath,
        totalRecords: updatedLedger.records.length,
    }
}

export function verifyErrataLineage(
    seriesSlug: string,
    customRepoRoot?: string,
): ErrataLineageVerificationReport {
    const repoRoot = customRepoRoot || resolveRepoRoot()
    const ledgerPath = path.join(
        repoRoot,
        'series',
        seriesSlug,
        'world',
        'errata.json',
    )

    const errors: string[] = []
    const discontinuities: ErrataLineageVerificationReport['discontinuities'] =
        []

    if (!fs.existsSync(ledgerPath)) {
        return {
            valid: true,
            totalRecords: 0,
            genesisHash: '0'.repeat(64),
            headHash: '0'.repeat(64),
            errors: [],
            discontinuities: [],
        }
    }

    let ledger: ErrataLedgerFile
    try {
        ledger = loadErrataLedgerFile(ledgerPath)
    } catch (err: any) {
        return {
            valid: false,
            totalRecords: 0,
            genesisHash: '0'.repeat(64),
            headHash: '0'.repeat(64),
            errors: [`[MALFORMED_LEDGER_FILE] ${err.message}`],
            discontinuities: [],
        }
    }

    const records = ledger.records
    if (records.length === 0) {
        return {
            valid: true,
            totalRecords: 0,
            genesisHash: ledger.genesis_merkle_hash,
            headHash: ledger.genesis_merkle_hash,
            errors: [],
            discontinuities: [],
        }
    }

    let currentExpectedHash = ledger.genesis_merkle_hash

    for (let i = 0; i < records.length; i++) {
        const record = records[i]
        const expectedSeq = i + 1

        if (record.sequence_number !== expectedSeq) {
            errors.push(
                `[SEQUENCE_GAP] Expected sequence ${expectedSeq} at index ${i}, found ${record.sequence_number}`,
            )
        }

        if (record.superseded_merkle_hash !== currentExpectedHash) {
            errors.push(
                `[HASH_DISCONTINUITY] Sequence ${record.sequence_number} (${record.errata_id}) superseded hash ` +
                    `'${record.superseded_merkle_hash.slice(0, 8)}...' does not match expected '${currentExpectedHash.slice(0, 8)}...'`,
            )
            discontinuities.push({
                sequenceNumber: record.sequence_number,
                errataId: record.errata_id,
                expectedSupersededHash: currentExpectedHash,
                actualSupersededHash: record.superseded_merkle_hash,
            })
        }

        currentExpectedHash = record.active_merkle_hash
    }

    return {
        valid: errors.length === 0,
        totalRecords: records.length,
        genesisHash: ledger.genesis_merkle_hash,
        headHash: currentExpectedHash,
        errors,
        discontinuities,
    }
}

export const appendErrataAction = (
    cpy: LawsModel,
    bal: ErrataOperationBit,
    ste?: State,
): LawsModel => {
    const dat = bal?.dat
    if (!dat || !dat.record) {
        if (bal?.slv) {
            bal.slv({
                lawBit: {
                    idx: 'append-errata-err',
                    val: -1,
                    dat: {
                        success: false,
                        error: '[MISSING_RECORD] record is required',
                    },
                },
            })
        }
        return cpy
    }

    try {
        const res = appendErrataRecord(dat.seriesSlug, dat.record, dat.repoRoot)
        cpy.errataHistory.set(dat.record.errata_id, dat.record)
        if (bal?.slv) {
            bal.slv({
                lawBit: {
                    idx: 'append-errata',
                    val: 0,
                    dat: res,
                },
            })
        }
    } catch (err: any) {
        if (bal?.slv) {
            bal.slv({
                lawBit: {
                    idx: 'append-errata-fail',
                    val: -1,
                    dat: { success: false, error: err.message },
                },
            })
        }
    }

    return cpy
}

export const verifyErrataAction = (
    cpy: LawsModel,
    bal: ErrataOperationBit,
    ste?: State,
): LawsModel => {
    const dat = bal?.dat
    const seriesSlug = dat?.seriesSlug || 'under-the-floorboards'
    const rep = verifyErrataLineage(seriesSlug, dat?.repoRoot)

    if (bal?.slv) {
        bal.slv({
            lawBit: {
                idx: 'verify-errata',
                val: rep.valid ? 0 : -1,
                dat: rep,
            },
        })
    }

    return cpy
}
