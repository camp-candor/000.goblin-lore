import type Ledger from './fce/ledger.interface.js'
import type LedgerBit from './fce/ledger.bit.js'

export class LedgerModel implements Ledger {
  idx: string = '16.ledger'
  ledgerBitList: LedgerBit[] = []
  ledgerBits: Record<string, LedgerBit> = {}
}
