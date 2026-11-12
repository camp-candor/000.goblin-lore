import type { ErrataRecord, ErrataLedgerFile } from './errata.schema.js'

export interface ErrataAppendResult {
    success: boolean
    record?: ErrataRecord
    ledgerPath?: string
    totalRecords?: number
    error?: string
}

export interface ErrataLineageVerificationReport {
    valid: boolean
    totalRecords: number
    genesisHash: string
    headHash: string
    errors: string[]
    discontinuities: Array<{
        sequenceNumber: number
        errataId: string
        expectedSupersededHash: string
        actualSupersededHash: string
    }>
}

export default interface ErrataOperationBit {
    idx: string
    src?: string
    val?: number
    dat?: {
        seriesSlug: string
        record?: ErrataRecord
        repoRoot?: string
    }
    slv?: (result: {
        lawBit: {
            idx: string
            val: number
            dat: ErrataAppendResult | ErrataLineageVerificationReport
        }
    }) => void
}
