import type { PayloadModel } from './payload.model.js'
import type PayloadBit from './fce/ttsPayload.bit.js'
import type AphoniaGateBit from './fce/aphoniaGate.bit.js'
import type FactPinningBit from './fce/factPinning.bit.js'
import type PayloadHashBit from './fce/payloadHash.bit.js'
import type State from '../99.core/state.js'
import { validateTtsGenerationPayload } from './buz/validateTtsPayload.buzz.js'
import { assertVocalMotorFeasibility } from './buz/vocalFeasibilityGate.buzz.js'
import { evaluateSceneSomaticStaleness } from './buz/pinSomaticFactVersion.buzz.js'
import {
    hashTtsGenerationRequest,
    verifyPayloadHashParity as verifyHashParityBuzz,
} from './buz/canonicalPayloadHasher.buzz.js'

const UPDATE_CONSOLE = '[Console action] Update Console'

export const initPayload = (
    cpy: PayloadModel,
    bal: PayloadBit,
    _ste: State,
): PayloadModel => {
    cpy.validatedPayloads = {}
    cpy.validationReceipts = {}
    cpy.feasibilityReceipts = {}
    cpy.stalenessReceipts = {}
    cpy.hashedPayloads = {}
    cpy.parityReceipts = {}
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
        const message = err instanceof Error ? err.message : String(err)
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

export const verifyVocalFeasibility = (
    cpy: PayloadModel,
    bal: AphoniaGateBit & { dat: any },
    ste: State,
): PayloadModel => {
    const payload = bal.dat?.candidate || bal.dat
    if (!payload || !payload.entityId) {
        if (bal.slv)
            bal.slv({
                aphBit: { idx: 'verify-vocal-feasibility-fail', val: -1 },
            })
        return cpy
    }

    try {
        const receipt = assertVocalMotorFeasibility(
            payload,
            bal.dat?.epoch || 0,
        )
        cpy.feasibilityReceipts[receipt.entityId] = receipt

        if (ste) {
            ste.hunt(UPDATE_CONSOLE, {
                idx: 'cns00',
                src: `>> [FEASIBILITY] Vocal-motor feasibility certified for ${receipt.entityId} (Aphonic: ${receipt.isAphonic}) [OK]`,
            })
        }

        if (bal.slv) {
            bal.slv({
                aphBit: {
                    idx: 'verify-vocal-feasibility-ok',
                    val: receipt.isPhonationFeasible ? 1 : 0,
                    dat: receipt,
                },
            })
        }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        if (ste) {
            ste.hunt(UPDATE_CONSOLE, {
                idx: 'cns00',
                src: `:: [FEASIBILITY FAIL] ${message}`,
            })
        }
        if (bal.slv) {
            bal.slv({
                aphBit: {
                    idx: 'verify-vocal-feasibility-err',
                    val: -1,
                    src: message,
                },
            })
        }
    }

    return cpy
}

export const checkSceneSomaticStaleness = (
    cpy: PayloadModel,
    bal: FactPinningBit & { dat: any },
    ste: State,
): PayloadModel => {
    const payload = bal.dat?.input || bal.dat
    if (!payload || !payload.sceneId || !payload.pinnedFacts) {
        if (bal.slv)
            bal.slv({
                pinBit: { idx: 'check-somatic-staleness-fail', val: -1 },
            })
        return cpy
    }

    try {
        const receipt = evaluateSceneSomaticStaleness(
            payload,
            bal.dat?.epoch || 0,
        )
        cpy.stalenessReceipts[receipt.sceneId] = receipt

        if (ste) {
            const statusLabel = receipt.isDirty
                ? `[!] DIRTY (${receipt.staleFactCount} mutated facts)`
                : '[OK] CLEAN'
            ste.hunt(UPDATE_CONSOLE, {
                idx: 'cns00',
                src: `>> [STALENESS] Evaluated ${receipt.sceneId} -> ${statusLabel}`,
            })
            for (const diff of receipt.diffs) {
                ste.hunt(UPDATE_CONSOLE, {
                    idx: 'cns00',
                    src: `>> [VERSION_BUMP] ${diff.invalidationReason}`,
                })
            }
        }

        if (bal.slv) {
            bal.slv({
                pinBit: {
                    idx: receipt.isDirty
                        ? 'check-somatic-staleness-dirty'
                        : 'check-somatic-staleness-clean',
                    val: receipt.isDirty ? 1 : 0,
                    dat: receipt,
                },
            })
        }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        if (ste) {
            ste.hunt(UPDATE_CONSOLE, {
                idx: 'cns00',
                src: `:: [STALENESS FAIL] ${message}`,
            })
        }
        if (bal.slv) {
            bal.slv({
                pinBit: {
                    idx: 'check-somatic-staleness-err',
                    val: -1,
                    src: message,
                },
            })
        }
    }

    return cpy
}

export const hashTtsGenerationPayload = (
    cpy: PayloadModel,
    bal: PayloadHashBit & { dat: any },
    ste: State,
): PayloadModel => {
    const candidate = bal.dat?.payload || bal.dat
    if (!candidate) {
        if (bal.slv)
            bal.slv({ hashBit: { idx: 'hash-tts-payload-fail', val: -1 } })
        return cpy
    }

    try {
        const receipt = hashTtsGenerationRequest(candidate, bal.dat?.epoch || 0)
        cpy.hashedPayloads[receipt.lineId] = receipt

        if (ste) {
            ste.hunt(UPDATE_CONSOLE, {
                idx: 'cns00',
                src: `>> [PAYLOAD_HASH] Line: ${receipt.lineId} | SHA-256: ${receipt.payloadSha256.slice(0, 16)}... | Bytes: ${receipt.byteLength} [OK]`,
            })
        }

        if (bal.slv) {
            bal.slv({
                hashBit: {
                    idx: 'hash-tts-payload-ok',
                    val: 1,
                    dat: receipt,
                },
            })
        }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        if (ste) {
            ste.hunt(UPDATE_CONSOLE, {
                idx: 'cns00',
                src: `:: [PAYLOAD_HASH FAIL] ${message}`,
            })
        }
        if (bal.slv) {
            bal.slv({
                hashBit: {
                    idx: 'hash-tts-payload-err',
                    val: -1,
                    src: message,
                },
            })
        }
    }

    return cpy
}

export const verifyPayloadHashParity = (
    cpy: PayloadModel,
    bal: PayloadHashBit & { dat: any },
    ste: State,
): PayloadModel => {
    const input = bal.dat
    if (!input || !input.expectedHash || !input.payload) {
        if (bal.slv)
            bal.slv({ hashBit: { idx: 'verify-parity-fail', val: -1 } })
        return cpy
    }

    try {
        const result = verifyHashParityBuzz(
            input.expectedHash,
            input.payload,
            input.epoch || 0,
        )
        cpy.parityReceipts[result.lineId] = result

        if (ste) {
            if (result.isValid) {
                ste.hunt(UPDATE_CONSOLE, {
                    idx: 'cns00',
                    src: `>> [PARITY_OK] Payload digest matches expected: ${result.expectedHash.slice(0, 16)}... [OK]`,
                })
            } else {
                ste.hunt(UPDATE_CONSOLE, {
                    idx: 'cns00',
                    src: `:: [PARITY_FAIL] Digest divergence: expected ${result.expectedHash.slice(0, 8)} != actual ${result.actualHash.slice(0, 8)}`,
                })
            }
        }

        if (bal.slv) {
            bal.slv({
                hashBit: {
                    idx: result.isValid
                        ? 'verify-parity-match'
                        : 'verify-parity-mismatch',
                    val: result.isValid ? 1 : 0,
                    dat: result,
                },
            })
        }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        if (ste) {
            ste.hunt(UPDATE_CONSOLE, {
                idx: 'cns00',
                src: `:: [PARITY_ERR] ${message}`,
            })
        }
        if (bal.slv) {
            bal.slv({
                hashBit: {
                    idx: 'verify-parity-err',
                    val: -1,
                    src: message,
                },
            })
        }
    }

    return cpy
}
