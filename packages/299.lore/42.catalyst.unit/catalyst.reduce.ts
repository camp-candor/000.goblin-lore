import clone from 'clone-deep'
import * as Act from './catalyst.action'
import { CatalystModel } from './catalyst.model'
import * as Buzz from './catalyst.buzzer'
import { evaluateCatalystSignificance } from './buz/catalyst.buzz.js'
import State from '../99.core/state'

export function reducer(
    model: CatalystModel = new CatalystModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.UPDATE_CATALYST:
            return Buzz.updateCatalyst(clone(model), act.bale, state)

        case Act.INIT_CATALYST:
            return Buzz.initCatalyst(clone(model), act.bale, state)

        case Act.EVALUATE_CATALYST_SIGNIFICANCE:
        case Act.SCORE_CATALYST_EVENT:
        case Act.SCORE_CATALYST_BATCH: {
            const cpy = clone(model) as any
            try {
                const dat = (act.bale as any)?.dat || {}
                const receipt = evaluateCatalystSignificance(
                    dat.config,
                    dat.event,
                )
                cpy.lastReceipt = receipt
                cpy.lastEvaluatedCategory = (receipt as any).category
                if ((act.bale as any)?.slv) {
                    ;(act.bale as any).slv({
                        ctlBit: {
                            idx: 'evaluate-catalyst-significance',
                            val: (receipt as any).isSignificant ? 1 : 0,
                            dat: { receipt },
                        },
                    })
                }
            } catch (err: any) {
                if ((act.bale as any)?.slv) {
                    ;(act.bale as any).slv({
                        ctlBit: { idx: 'evaluate-catalyst-error', val: -1 },
                        errBit: {
                            code: 'CATALYST_EVALUATION_FAILED',
                            message: err?.message || String(err),
                        },
                    })
                }
            }
            return cpy
        }

        default:
            return model
    }
}
