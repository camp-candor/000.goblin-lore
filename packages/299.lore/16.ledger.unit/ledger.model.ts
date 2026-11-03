import Ledger from './fce/ledger.interface.js'
import type { ConditionRegistryEntry } from './val/conditionsRegistry.val.js'
import type { ExtractedSomaticLedgerRecordBit } from './fce/somaticLedger.bit.js'
import type { SqliteSomaticStore } from './buz/sqliteSomaticStore.buzz.js'

export class LedgerModel implements Ledger {
    idx: string = '16.ledger'
    conditionsCatalog: Record<string, ConditionRegistryEntry> = {}
    somaticRecords: Record<string, ExtractedSomaticLedgerRecordBit> = {}
    sqliteStore?: SqliteSomaticStore
}
