import { RefusalModel } from '../refusal.model'
import type RefusalBit from '../fce/refusal.bit'
import type State from '../../99.core/state'
import {
    RefusalStrainEvaluationPayloadSchema,
    clampBasisPoints,
    type RefusalStrainReceipt,
    type RefusalStrainEvaluationPayload,
} from '../val/strain.val'

/**
 * Pure integer basis-point refusal strain evaluation and fracture clamper.
 */
export const clampRefusalStrain = (
    cpy: RefusalModel,
    bal: RefusalBit,
    ste: State,
): RefusalModel => {
    const characterId = String(
        bal.idx ?? bal.dat?.character_id ?? 'char_unknown',
    )
    const payload = bal.dat ?? {}

    // Check for floating-point values explicitly before schema parsing
    const valuesToCheck = [
        payload.current_strain_bps,
        payload.delta_strain_bps,
        payload.strain_threshold_bps,
    ]

    for (const v of valuesToCheck) {
        if (typeof v === 'number' && !Number.isInteger(v)) {
            const failure: RefusalStrainReceipt = {
                character_id: characterId,
                refusal_id: String(payload.refusal_id ?? 'ref_unknown'),
                previous_strain_bps: 0,
                delta_strain_bps: 0,
                clamped_strain_bps: 0,
                strain_threshold_bps: 8000,
                threshold_breached: false,
                active_state: 'INTACT',
                is_fractured: false,
                isValid: false,
                errorCode: 'FLOAT_PROHIBITED_BREACH',
                message:
                    'Floating point value detected in strain metric. Integer basis points strictly required.',
            }

            if (bal.slv != null) {
                bal.slv({
                    rflBit: {
                        idx: 'clamp-refusal-strain',
                        val: 0,
                        dat: failure,
                    },
                })
            }
            return cpy
        }
    }

    const parseResult = RefusalStrainEvaluationPayloadSchema.safeParse({
        character_id: characterId,
        ...payload,
    })

    if (!parseResult.success) {
        const issue = parseResult.error.issues[0]
        const failure: RefusalStrainReceipt = {
            character_id: characterId,
            refusal_id: String(payload.refusal_id ?? 'ref_unknown'),
            previous_strain_bps: 0,
            delta_strain_bps: 0,
            clamped_strain_bps: 0,
            strain_threshold_bps: 8000,
            threshold_breached: false,
            active_state: 'INTACT',
            is_fractured: false,
            isValid: false,
            errorCode: 'INVALID_STRAIN_PAYLOAD_BREACH',
            message: `${issue?.path.join('.')}: ${issue?.message}`,
        }

        if (bal.slv != null) {
            bal.slv({
                rflBit: {
                    idx: 'clamp-refusal-strain',
                    val: 0,
                    dat: failure,
                },
            })
        }
        return cpy
    }

    const validData: RefusalStrainEvaluationPayload = parseResult.data
    const clampedStrainBps = clampBasisPoints(
        validData.current_strain_bps,
        validData.delta_strain_bps,
    )
    const thresholdBreached = clampedStrainBps >= validData.strain_threshold_bps

    const receipt: RefusalStrainReceipt = {
        character_id: validData.character_id,
        refusal_id: validData.refusal_id,
        previous_strain_bps: validData.current_strain_bps,
        delta_strain_bps: validData.delta_strain_bps,
        clamped_strain_bps: clampedStrainBps,
        strain_threshold_bps: validData.strain_threshold_bps,
        threshold_breached: thresholdBreached,
        active_state: thresholdBreached ? validData.post_break_state : 'INTACT',
        is_fractured: thresholdBreached,
        isValid: true,
        message: thresholdBreached
            ? `Strain threshold (${validData.strain_threshold_bps} bps) breached at ${clampedStrainBps} bps. Post-break state engaged.`
            : `Refusal strain updated cleanly to ${clampedStrainBps} / ${validData.strain_threshold_bps} bps.`,
    }

    if (bal.slv != null) {
        bal.slv({
            rflBit: {
                idx: 'clamp-refusal-strain',
                val: 1,
                dat: receipt,
            },
        })
    }

    return cpy
}
