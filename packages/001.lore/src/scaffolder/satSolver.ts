import { Character, Possession } from '../schemas/entities.js'

export interface SatCheckResult {
    passed: boolean
    code?:
        | 'SOMATIC_SAT_BREACH'
        | 'LOGISTICAL_OVERALLOCATION'
        | 'MOTOR_LIMITATION_MISMATCH'
    message?: string
    armsDemanded?: number
    armsAvailable?: number
}

/**
 * Pre-Flight Invariant SAT Solver ($T_0 = $0.00 compute cost)
 * Evaluates hand saturation equation: sum(item.occupies_hands) <= character.available_arms
 * Validates condition-to-banned-verb consistency.
 */
export function evaluateSomaticSAT(
    character: Character,
    inventoryCatalog: Map<string, Possession>,
): SatCheckResult {
    let netArmsAvailable = character.somatic.available_arms

    // Sessile or slithering baseline organisms have 0 functional arms
    if (
        character.somatic.locomotion_baseline === 'sessile' ||
        character.somatic.locomotion_baseline === 'slithering'
    ) {
        netArmsAvailable = 0
    }

    // Penalize functional arms for severe upper-limb trauma
    for (const condition of character.somatic.conditions) {
        if (
            condition.includes('severed_arm') ||
            condition.includes('paralyzed_arm') ||
            condition.includes('amputated')
        ) {
            netArmsAvailable = Math.max(0, netArmsAvailable - 1)
        }
    }

    // Calculate hand demand across equipped held slots
    let handsDemanded = 0
    for (const itemId of character.logistical.held) {
        const item = inventoryCatalog.get(itemId)
        if (!item) {
            return {
                passed: false,
                code: 'LOGISTICAL_OVERALLOCATION',
                message: `Equipped item '${itemId}' not found in registered inventory catalog.`,
            }
        }
        handsDemanded += item.logistical.occupies_hands
    }

    if (handsDemanded > netArmsAvailable) {
        return {
            passed: false,
            code: 'SOMATIC_SAT_BREACH',
            message: `Hand capacity equation violated: Demanded ${handsDemanded} arms, but only ${netArmsAvailable} functional arms available.`,
            armsDemanded: handsDemanded,
            armsAvailable: netArmsAvailable,
        }
    }

    // Verify kinetic prohibition consistency (e.g., NO_SPRINT requires 'sprint' in banned_kinetic_verbs)
    if (character.somatic.motor_limitations.includes('NO_SPRINT')) {
        const hasSprintBanned = character.somatic.banned_kinetic_verbs.some(
            (v) => v.toLowerCase().includes('sprint'),
        )
        if (!hasSprintBanned) {
            return {
                passed: false,
                code: 'MOTOR_LIMITATION_MISMATCH',
                message:
                    "Motor limitation 'NO_SPRINT' declared without corresponding 'sprint' verb in banned_kinetic_verbs.",
            }
        }
    }

    return { passed: true }
}
