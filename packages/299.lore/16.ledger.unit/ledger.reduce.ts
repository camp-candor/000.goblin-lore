import clone from 'clone-deep'
import * as Act from './ledger.action.js'
import { LedgerModel } from './ledger.model.js'
import * as Buzz from './ledger.buzzer.js'
import type State from '../99.core/state.js'

export function reducer(
    model: LedgerModel = new LedgerModel(),
    act: Act.Actions,
    state?: State,
): LedgerModel {
    switch (act.type) {
        case Act.INIT_LEDGER:
            return Buzz.initLedger(clone(model), act.bale, state!)

        case Act.UPDATE_LEDGER:
            return Buzz.updateLedger(clone(model), act.bale, state!)

        case Act.EXTRACT_SOMATIC_LEDGER:
            return Buzz.extractSomaticLedger(
                clone(model),
                act.bale as any,
                state!,
            ) as any

        case Act.QUERY_SOMATIC_LEDGER_RECORD:
            return Buzz.querySomaticLedgerRecord(
                clone(model),
                act.bale as any,
                state!,
            )

        default:
            return model
    }
}
