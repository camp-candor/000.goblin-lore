import { Action } from '../99.core/interface/action.interface.js'
import type LedgerBit from './fce/ledger.bit.js'
import type { ExtractedSomaticLedgerRecordBit } from './fce/somaticLedger.bit.js'

export const INIT_LEDGER = '[Ledger action] Init Ledger'
export class InitLedger implements Action {
    readonly type = INIT_LEDGER
    constructor(public bale: LedgerBit) {}
}

export const UPDATE_LEDGER = '[Ledger action] Update Ledger'
export class UpdateLedger implements Action {
    readonly type = UPDATE_LEDGER
    constructor(public bale: LedgerBit) {}
}

export const EXTRACT_SOMATIC_LEDGER = '[Ledger action] Extract Somatic Ledger'
export class ExtractSomaticLedger implements Action {
    readonly type = EXTRACT_SOMATIC_LEDGER
    constructor(
        public bale: LedgerBit<{
            conditionsPath: string
            characterPaths: string[]
        }>,
    ) {}
}

export const QUERY_SOMATIC_LEDGER_RECORD =
    '[Ledger action] Query Somatic Ledger Record'
export class QuerySomaticLedgerRecord implements Action {
    readonly type = QUERY_SOMATIC_LEDGER_RECORD
    constructor(public bale: LedgerBit<{ entityId: string }>) {}
}

export type Actions =
    InitLedger | UpdateLedger | ExtractSomaticLedger | QuerySomaticLedgerRecord
