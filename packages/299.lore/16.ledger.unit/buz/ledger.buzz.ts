import { LedgerModel } from '../ledger.model.js'
import type LedgerBit from '../fce/ledger.bit.js'
import type State from '../../99.core/state.js'

export const initLedger = (
    cpy: LedgerModel,
    bal: LedgerBit,
    ste?: State,
): LedgerModel => {
    cpy.idx = bal.idx || '16.ledger'
    if (bal.slv) {
        bal.slv({ ldgBit: { idx: 'init-ledger', val: 0 } })
    }
    return cpy
}

export const updateLedger = (
    cpy: LedgerModel,
    bal: LedgerBit,
    ste?: State,
): LedgerModel => {
    if (bal.slv) {
        bal.slv({ ldgBit: { idx: 'update-ledger', val: 0 } })
    }
    return cpy
}
