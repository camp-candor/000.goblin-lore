/**
 * packages/299.lore/26.schema.unit/buz/somatic-sat.buzz.ts
 *
 * Somatic Capability Satisfiability Solver & Kinetic Motor Mask Exclusion Solver
 * for 26.schema.unit. Evaluates anatomical limb capacity and enforces
 * Actions \cap B_total(C) == \emptyset at T_0 = $0.00.
 */

import type { SchemaModel } from '../schema.model'
import type SchemaBit from '../fce/schema.bit'
import type State from '../../99.core/state'
import { CharacterSchema } from './validate.buzz'

export interface SomaticSATPayload {
    character: unknown
    possessions?: Record<string, { occupies_hands?: number }>
    condition_penalties?: Record<string, number>
    condition_banned_verbs?: Record<string, string[]>
    proposedActions?: string[]
}

/**
 * Standard locomotion tier verb restrictions applied to baseline anatomy.
 */
export const LOCOMOTION_TIER_BANNED_VERBS: Record<string, string[]> = {
    BIPEDAL_NIMBLE: [],
    BIPEDAL_HUNCHED: ['SPRINT', 'VAULT'],
    BIPEDAL_LIMPING: ['SPRINT', 'VAULT', 'LEAP', 'LUNGE'],
    IMMOBILE: [
        'SPRINT',
        'VAULT',
        'LEAP',
        'LUNGE',
        'DIVE',
        'LIMP',
        'SCUTTLE',
        'CLIMB',
        'KICK',
        'BIMANUAL_LIFT',
        'BIMANUAL_BRACE',
        'STRANGLE',
    ],
}

/**
 * Solves Somatic Hand Capacity & Kinetic Motor Mask Invariants at T_0 ($0.00).
 *
 * Invariants Enforced:
 *   1. requiredHands <= netArmsAvailable
 *   2. proposedActions \cap B_total(C) == \emptyset
 * Where:
 *   B_total(C) = B_baseline \cup \bigcup B_condition(k) \cup B_locomotion(Tier)
 */
export const solveSomaticSAT = (
    cpy: SchemaModel,
    bal: SchemaBit,
    _ste?: State,
): SchemaModel => {
    const payload = bal?.dat as SomaticSATPayload

    if (!payload || !payload.character) {
        // Check legacy payload compatibility
        if (
            payload &&
            (payload as any).character_id &&
            typeof (payload as any).arms_available === 'number'
        ) {
            const legacy = payload as any
            const netArmsAvailable = Math.max(
                0,
                legacy.arms_available - (legacy.impairment_penalties || 0),
            )
            let requiredHands = 0
            if (legacy.held_primary) {
                requiredHands += legacy.held_primary.occupies_hands ?? 1
            }
            if (legacy.held_secondary) {
                requiredHands += legacy.held_secondary.occupies_hands ?? 1
            }
            if (requiredHands > netArmsAvailable) {
                const errorMsg = `[SOMATIC_OVERLOAD]: Character '${legacy.character_id}' demands ${requiredHands} hands for held items, but only possesses ${netArmsAvailable} functional arm(s).`
                bal.val = -1
                bal.lst = [errorMsg]
                if (bal?.slv) {
                    bal.slv({
                        schBit: {
                            idx: bal.idx,
                            src: legacy.character_id,
                            val: -1,
                            lst: [errorMsg],
                        },
                    })
                }
                return cpy
            }
            bal.val = 0
            bal.lst = []
            if (bal?.slv) {
                bal.slv({
                    schBit: {
                        idx: bal.idx,
                        src: legacy.character_id,
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

        const errorMsg =
            'INVALID_SOMATIC_SAT_PAYLOAD: Missing character state record in payload dat.'
        bal.val = -1
        bal.lst = [errorMsg]

        if (bal?.slv) {
            bal.slv({ schBit: bal })
        }
        return cpy
    }

    // 1. Ingest and parse character structural schema
    const parseRes = CharacterSchema.safeParse(payload.character)
    if (!parseRes.success) {
        const formattedErrors: string[] = parseRes.error.issues.map((issue) => {
            const issuePath =
                issue.path.length > 0 ? issue.path.join('.') : 'root'
            return `[${issuePath}]: ${issue.message}`
        })

        bal.val = -1
        bal.lst = formattedErrors

        if (bal?.slv) {
            bal.slv({ schBit: bal })
        }
        return cpy
    }

    const char = parseRes.data

    // 2. Compute net functional manipulation appendages
    let totalPenaltyArms = 0
    const conditionPenalties = payload.condition_penalties || {}

    for (const condId of char.somatic.conditions) {
        if (typeof conditionPenalties[condId] === 'number') {
            totalPenaltyArms += conditionPenalties[condId]
        } else {
            totalPenaltyArms += 1
        }
    }

    let netArmsAvailable = Math.max(
        0,
        char.somatic.arms_available - totalPenaltyArms,
    )

    // Biological Clamp: Immobile entities lose functional manipulation capability
    if (char.somatic.locomotion_tier === 'IMMOBILE') {
        netArmsAvailable = 0
    }

    // 3. Calculate total required hand saturation across equipped items
    let requiredHands = 0
    const heldItemIds = [
        char.logistical.held_primary,
        char.logistical.held_secondary,
    ].filter(Boolean) as string[]

    const possessionsRegistry = payload.possessions || {}

    for (const itemId of heldItemIds) {
        const itemRecord = possessionsRegistry[itemId]
        if (itemRecord && typeof itemRecord.occupies_hands === 'number') {
            requiredHands += itemRecord.occupies_hands
        } else {
            requiredHands += 1
        }
    }

    // 4. Evaluate Hand Saturation Inequality: requiredHands <= netArmsAvailable
    if (requiredHands > netArmsAvailable) {
        const errorMsg = `[SOMATIC_OVERLOAD]: Character '${char.id}' demands ${requiredHands} hands for held items, but possesses only ${netArmsAvailable} net functional arms (${char.somatic.arms_available} baseline - ${totalPenaltyArms} penalties).`
        bal.val = -1
        bal.lst = [errorMsg]

        if (bal?.slv) {
            bal.slv({ schBit: bal })
        }
        return cpy
    }

    // 5. Compile Monotonic Kinetic Motor Mask: B_total(C)
    const bannedVerbSet = new Set<string>()

    // A. Baseline character verb bans
    for (const verb of char.somatic.banned_verbs) {
        bannedVerbSet.add(verb.toUpperCase().trim())
    }

    // B. Locomotion tier verb bans
    const tierBans =
        LOCOMOTION_TIER_BANNED_VERBS[char.somatic.locomotion_tier] || []
    for (const verb of tierBans) {
        bannedVerbSet.add(verb.toUpperCase().trim())
    }

    // C. Injected condition bans
    const conditionBannedMap = payload.condition_banned_verbs || {}
    for (const condId of char.somatic.conditions) {
        const extraBans = conditionBannedMap[condId] || []
        for (const verb of extraBans) {
            bannedVerbSet.add(verb.toUpperCase().trim())
        }

        // Default: nerve/amputation condition defaults to bimanual bans
        if (
            condId.includes('severed') ||
            condId.includes('amputat') ||
            condId.includes('brachial')
        ) {
            bannedVerbSet.add('BIMANUAL_LIFT')
            bannedVerbSet.add('BIMANUAL_BRACE')
            bannedVerbSet.add('TWO_HANDED_AIM')
            bannedVerbSet.add('CLIMB')
            bannedVerbSet.add('STRANGLE')
        }
    }

    // If character has fewer than 2 functional arms, bimanual actions are automatically banned
    if (netArmsAvailable < 2) {
        bannedVerbSet.add('BIMANUAL_LIFT')
        bannedVerbSet.add('BIMANUAL_BRACE')
        bannedVerbSet.add('TWO_HANDED_AIM')
        bannedVerbSet.add('STRANGLE')
    }

    // 6. Evaluate Kinetic Motor Mask Set-Intersection: Actions \cap B_total(C) == \emptyset
    const proposedActions = payload.proposedActions || []
    for (const action of proposedActions) {
        const normalizedAction = action.toUpperCase().trim()
        if (bannedVerbSet.has(normalizedAction)) {
            const errorMsg = `[SOMATIC_MOTOR_BREACH]: Character '${char.id}' attempted banned kinetic verb '${normalizedAction}'. Active conditions or locomotion tier forbid this action.`
            bal.val = -1
            bal.lst = [errorMsg]

            if (bal?.slv) {
                bal.slv({ schBit: bal })
            }
            return cpy
        }
    }

    // 7. Clearance Certified: Emit deterministic pass token
    bal.val = 0
    bal.lst = []
    bal.dat = {
        characterId: char.id,
        netArmsAvailable,
        requiredHands,
        compiledBannedVerbs: Array.from(bannedVerbSet).sort(),
        proposedActionsEvaluated: proposedActions.length,
        satisfied: true,
    }

    if (bal?.slv) {
        bal.slv({ schBit: bal })
    }

    return cpy
}

export default solveSomaticSAT
