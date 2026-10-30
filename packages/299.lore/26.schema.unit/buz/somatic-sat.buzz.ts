import type State from '../../99.core/state'
import type SchemaBit from '../fce/schema.bit'
import type { SchemaModel } from '../schema.model'

export interface SomaticSATParams {
    character_id: string
    arms_available: number
    impairment_penalties: number
    held_primary?: { id: string; occupies_hands: number } | null
    held_secondary?: { id: string; occupies_hands: number } | null
}

/**
 * Evaluates biological satisfiability:
 * netArmsAvailable = max(0, arms_available - impairment_penalties)
 * requiredHands = sum(held.occupies_hands)
 * Invariant: requiredHands <= netArmsAvailable
 */
export const solveSomaticSAT = async (
    cpy: SchemaModel,
    bal: SchemaBit,
    _ste: State,
): Promise<SchemaModel> => {
    const params = bal.dat as SomaticSATParams

    if (!params || typeof params.arms_available !== 'number') {
        bal.val = -1
        bal.lst = [
            'INVALID_SAT_PAYLOAD: Missing valid arms_available parameter',
        ]
        if (bal.slv) {
            bal.slv({ schBit: { idx: bal.idx, val: -1, lst: bal.lst } })
        }
        return cpy
    }

    const netArmsAvailable = Math.max(
        0,
        params.arms_available - (params.impairment_penalties || 0),
    )

    let requiredHands = 0
    if (params.held_primary) {
        requiredHands += params.held_primary.occupies_hands ?? 1
    }
    if (params.held_secondary) {
        requiredHands += params.held_secondary.occupies_hands ?? 1
    }

    if (requiredHands > netArmsAvailable) {
        const errorMsg = `[SOMATIC_OVERLOAD]: Character '${params.character_id}' demands ${requiredHands} hands for held items, but only possesses ${netArmsAvailable} functional arm(s).`
        bal.val = -1
        bal.lst = [errorMsg]

        if (bal.slv) {
            bal.slv({
                schBit: {
                    idx: bal.idx,
                    src: params.character_id,
                    val: -1,
                    lst: [errorMsg],
                },
            })
        }
        return cpy
    }

    bal.val = 0
    bal.lst = []

    if (bal.slv) {
        bal.slv({
            schBit: {
                idx: bal.idx,
                src: params.character_id,
                val: 0,
                dat: {
                    netArmsAvailable,
                    requiredHands,
                },
                lst: [],
            },
        })
    }

    return cpy
}
