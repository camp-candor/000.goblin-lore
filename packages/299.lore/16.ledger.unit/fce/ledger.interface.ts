import type LedgerBit from './ledger.bit.js'

export default interface Ledger {
  idx: string
  ledgerBitList: LedgerBit[]
  ledgerBits: Record<string, LedgerBit>
}
