import { RefusalModel } from '../refusal.model'
import type RefusalBit from '../fce/refusal.bit'
import type State from '../../99.core/state'
import {
    CharacterRefusalListSchema,
    RefusalVectorRuleSchema,
    type RefusalValidationResult,
    type CharacterRefusalList,
} from '../val/refusal.val'

/**
 * Initializes the Refusal unit state.
 */
export const initRefusal = (
    cpy: RefusalModel,
    bal: RefusalBit,
    ste: State,
): RefusalModel => {
    if (bal.slv != null) {
        bal.slv({ rflBit: { idx: 'init-refusal', val: 1 } })
    }
    return cpy
}

/**
 * Updates Refusal unit state.
 */
export const updateRefusal = (
    cpy: RefusalModel,
    bal: RefusalBit,
    ste: State,
): RefusalModel => {
    if (bal.slv != null) {
        bal.slv({ rflBit: { idx: 'update-refusal', dat: bal.dat } })
    }
    return cpy
}

/**
 * Executes a deterministic unit test ping for Refusal unit.
 */
export const testRefusal = (
    cpy: RefusalModel,
    bal: RefusalBit,
    ste: State,
): RefusalModel => {
    if (bal.slv != null) {
        bal.slv({ rflBit: { idx: 'test-refusal', val: 1 } })
    }
    return cpy
}

/**
 * Validates the three-stage refusal vector triad, finite strain capacity,
 * and post-break state definitions against strict Zod schema contracts.
 */
export const validateRefusalTuple = (
    cpy: RefusalModel,
    bal: RefusalBit,
    ste: State,
): RefusalModel => {
    const characterId = String(
        bal.idx ?? bal.dat?.character_id ?? 'char_unknown',
    )
    const payload = bal.dat ?? {}

    // Case 1: Validate a single RefusalVectorRule if passed directly
    if (payload.refusal_id !== undefined) {
        const singleParse = RefusalVectorRuleSchema.safeParse({
            character_id: characterId,
            ...payload,
        })

        if (!singleParse.success) {
            const issue = singleParse.error.issues[0]
            const failure: RefusalValidationResult = {
                character_id: characterId,
                isValid: false,
                refusalCount: 0,
                validatedRules: [],
                errorCode: 'INVALID_REFUSAL_TUPLE_BREACH',
                message: `${issue.path.join('.')}: ${issue.message}`,
            }

            if (bal.slv != null) {
                bal.slv({
                    rflBit: {
                        idx: 'validate-refusal-tuple',
                        val: 0,
                        dat: failure,
                    },
                })
            }
            return cpy
        }

        const success: RefusalValidationResult = {
            character_id: characterId,
            isValid: true,
            refusalCount: 1,
            validatedRules: [singleParse.data],
            message: `Refusal rule '${singleParse.data.refusal_id}' validated successfully at T0.`,
        }

        if (bal.slv != null) {
            bal.slv({
                rflBit: {
                    idx: 'validate-refusal-tuple',
                    val: 1,
                    dat: success,
                },
            })
        }
        return cpy
    }

    // Case 2: Validate a collection of RefusalVectorRules for a character
    const listParse = CharacterRefusalListSchema.safeParse({
        character_id: characterId,
        refusals: payload.refusals ?? [],
    })

    if (!listParse.success) {
        const issue = listParse.error.issues[0]
        const failure: RefusalValidationResult = {
            character_id: characterId,
            isValid: false,
            refusalCount: 0,
            validatedRules: [],
            errorCode: 'INVALID_REFUSAL_LIST_BREACH',
            message: `${issue.path.join('.')}: ${issue.message}`,
        }

        if (bal.slv != null) {
            bal.slv({
                rflBit: {
                    idx: 'validate-refusal-tuple',
                    val: 0,
                    dat: failure,
                },
            })
        }
        return cpy
    }

    const validatedList: CharacterRefusalList = listParse.data
    const success: RefusalValidationResult = {
        character_id: characterId,
        isValid: true,
        refusalCount: validatedList.refusals.length,
        validatedRules: validatedList.refusals,
        message: `Character '${characterId}' certified with ${validatedList.refusals.length} refusal triad rules.`,
    }

    if (bal.slv != null) {
        bal.slv({
            rflBit: {
                idx: 'validate-refusal-tuple',
                val: 1,
                dat: success,
            },
        })
    }

    return cpy
}
