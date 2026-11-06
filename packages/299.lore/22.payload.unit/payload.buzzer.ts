import type { PayloadModel } from './payload.model.js'
import type PayloadBit from './fce/ttsPayload.bit.js'
import type State from '../99.core/state.js'
import { validateTtsGenerationPayload } from './buz/validateTtsPayload.buzz.js'

const UPDATE_CONSOLE = '[Console action] Update Console'

export const initPayload = (
    cpy: PayloadModel,
    bal: PayloadBit,
    _ste: State,
): PayloadModel => {
    cpy.validatedPayloads = {}
    cpy.validationReceipts = {}
    cpy.totalValidatedCount = 0
    if (bal?.slv) {
        bal.slv({ pldBit: { idx: 'init-payload-ok', val: 1 } })
    }
    return cpy
}

export const updatePayload = (
    cpy: PayloadModel,
    bal: PayloadBit,
    _ste: State,
): PayloadModel => {
    if (bal?.slv) {
        bal.slv({ pldBit: { idx: 'update-payload-ok', val: 1 } })
    }
    return cpy
}

export const validateTtsPayload = (
    cpy: PayloadModel,
    bal: PayloadBit & { dat: any },
    ste: State,
): PayloadModel => {
    const payload = bal.dat?.candidatePayload || bal.dat
    if (!payload) {
        if (bal.slv)
            bal.slv({ pldBit: { idx: 'validate-tts-payload-fail', val: -1 } })
        return cpy
    }

    try {
        const { request, receipt } = validateTtsGenerationPayload(payload)

        cpy.validatedPayloads[request.lineId] = request
        cpy.validationReceipts[request.lineId] = receipt
        cpy.totalValidatedCount++

        if (ste) {
            ste.hunt(UPDATE_CONSOLE, {
                idx: 'cns00',
                src: `>> [PAYLOAD] Validated Ingress Request ${request.lineId} (${request.characterId}) | Facts: ${receipt.pinnedFactCount} [OK]`,
            })
        }

        if (bal.slv) {
            bal.slv({
                pldBit: {
                    idx: 'validate-tts-payload-ok',
                    val: 1,
                    dat: receipt,
                },
            })
        }
    } catch (err: unknown) {
        const message =
            (err as any)?.issues?.[0]?.message ||
            (err instanceof Error ? err.message : String(err))
        if (ste) {
            ste.hunt(UPDATE_CONSOLE, {
                idx: 'cns00',
                src: `:: [PAYLOAD FAIL] Schema breach: ${message}`,
            })
        }
        if (bal.slv) {
            bal.slv({
                pldBit: {
                    idx: 'validate-tts-payload-err',
                    val: -1,
                    src: message,
                },
            })
        }
    }

    return cpy
}
