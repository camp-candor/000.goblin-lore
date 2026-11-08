import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import {
    ErrataRecordSchema,
    ErrataLedgerFileSchema,
    type ErrataRecord,
    type ErrataLedgerFile,
} from '../fce/errata.schema.js'

export interface ErrataAppendResult {
    success: boolean
    sequenceNumber: number
    activeMerkleHash: string
    recordCount: number
    filePath: string
    error?: string
}

export interface ErrataLineageVerificationReport {
    valid: boolean
    totalRecords: number
    genesisHash: string
    currentHeadHash: string
    brokenIndex?: number
    errors: string[]
}

/**
 * Appends a new ErrataRecord to the active series errata ledger.
 * Enforces strict append-only constraints, unbroken hash linking,
 * and atomic writes via sibling temporary rename.
 */
export function appendErrataRecord(
    seriesDir: string,
    recordCandidate: unknown,
): ErrataAppendResult {
    const parsedRecord = ErrataRecordSchema.parse(recordCandidate)
    const worldDir = path.join(seriesDir, 'world')
    const errataFilePath = path.join(worldDir, 'errata.json')

    if (!fs.existsSync(worldDir)) {
        fs.mkdirSync(worldDir, { recursive: true })
    }

    let ledger: ErrataLedgerFile
    const seriesSlug = path.basename(seriesDir)

    if (fs.existsSync(errataFilePath)) {
        try {
            const raw = fs.readFileSync(errataFilePath, 'utf8')
            ledger = ErrataLedgerFileSchema.parse(JSON.parse(raw))
        } catch (err: any) {
            throw new Error(
                `[ERRATA_FILE_CORRUPTED] Failed to read ${errataFilePath}: ${err.message}`,
            )
        }
    } else {
        ledger = {
            schema_version: '1.0.0',
            series_slug: seriesSlug,
            genesis_merkle_hash: parsedRecord.superseded_merkle_hash,
            records: [],
        }
    }

    // 1. Verify Monotonic Sequence Number
    const expectedSeq = ledger.records.length + 1
    if (parsedRecord.sequence_number !== expectedSeq) {
        throw new Error(
            `[ERRATA_SEQUENCE_MISMATCH] Expected sequence_number ${expectedSeq}, received ${parsedRecord.sequence_number}`,
        )
    }

    // 2. Verify Cryptographic Linkage Against Preceding Record
    if (ledger.records.length > 0) {
        const lastRecord = ledger.records[ledger.records.length - 1]
        if (
            parsedRecord.superseded_merkle_hash !==
            lastRecord.active_merkle_hash
        ) {
            throw new Error(
                `[ERRATA_HASH_CHAIN_BREACH] superseded_merkle_hash '${parsedRecord.superseded_merkle_hash}' ` +
                    `does not match last active_merkle_hash '${lastRecord.active_merkle_hash}'`,
            )
        }
    } else {
        if (
            parsedRecord.superseded_merkle_hash !== ledger.genesis_merkle_hash
        ) {
            throw new Error(
                `[ERRATA_GENESIS_MISMATCH] superseded_merkle_hash '${parsedRecord.superseded_merkle_hash}' ` +
                    `does not match ledger genesis_merkle_hash '${ledger.genesis_merkle_hash}'`,
            )
        }
    }

    // 3. Verify Active Hash Divergence
    if (
        parsedRecord.superseded_merkle_hash === parsedRecord.active_merkle_hash
    ) {
        throw new Error(
            `[ERRATA_NO_OP_BREACH] active_merkle_hash must differ from superseded_merkle_hash`,
        )
    }

    // 4. Append Record to Immutable Array
    ledger.records.push(parsedRecord)

    // 5. Atomic POSIX File Write via Sibling .tmp_[UUID]
    const tmpFilePath = path.join(
        worldDir,
        `.tmp_${crypto.randomUUID()}_errata.json`,
    )
    const serialized = JSON.stringify(ledger, null, 2) + '\n'

    fs.writeFileSync(tmpFilePath, serialized, 'utf8')
    fs.renameSync(tmpFilePath, errataFilePath)

    return {
        success: true,
        sequenceNumber: parsedRecord.sequence_number,
        activeMerkleHash: parsedRecord.active_merkle_hash,
        recordCount: ledger.records.length,
        filePath: errataFilePath,
    }
}

/**
 * Audits the unbroken hash-chain lineage across series errata records.
 */
export function verifyErrataLineage(
    errataFilePath: string,
): ErrataLineageVerificationReport {
    const errors: string[] = []

    if (!fs.existsSync(errataFilePath)) {
        return {
            valid: true,
            totalRecords: 0,
            genesisHash: '',
            currentHeadHash: '',
            errors: [],
        }
    }

    let ledger: ErrataLedgerFile
    try {
        const raw = fs.readFileSync(errataFilePath, 'utf8')
        ledger = ErrataLedgerFileSchema.parse(JSON.parse(raw))
    } catch (err: any) {
        return {
            valid: false,
            totalRecords: 0,
            genesisHash: '',
            currentHeadHash: '',
            errors: [`[ERRATA_PARSE_FAILED] ${err.message}`],
        }
    }

    if (ledger.records.length === 0) {
        return {
            valid: true,
            totalRecords: 0,
            genesisHash: ledger.genesis_merkle_hash,
            currentHeadHash: ledger.genesis_merkle_hash,
            errors: [],
        }
    }

    let expectedPrevHash = ledger.genesis_merkle_hash

    for (let i = 0; i < ledger.records.length; i++) {
        const record = ledger.records[i]
        const currentSeq = i + 1

        if (record.sequence_number !== currentSeq) {
            errors.push(
                `[SEQUENCE_GAP] Index ${i}: expected sequence ${currentSeq}, found ${record.sequence_number}`,
            )
        }

        if (record.superseded_merkle_hash !== expectedPrevHash) {
            errors.push(
                `[HASH_DISCONTINUITY] Record ${record.errata_id} (seq #${record.sequence_number}): ` +
                    `superseded_merkle_hash '${record.superseded_merkle_hash}' does not match expected '${expectedPrevHash}'`,
            )
            return {
                valid: false,
                totalRecords: ledger.records.length,
                genesisHash: ledger.genesis_merkle_hash,
                currentHeadHash:
                    ledger.records[ledger.records.length - 1]
                        .active_merkle_hash,
                brokenIndex: i,
                errors,
            }
        }

        expectedPrevHash = record.active_merkle_hash
    }

    return {
        valid: errors.length === 0,
        totalRecords: ledger.records.length,
        genesisHash: ledger.genesis_merkle_hash,
        currentHeadHash: expectedPrevHash,
        errors,
    }
}
