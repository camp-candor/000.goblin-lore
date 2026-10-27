import { GearModel } from '../gear.model.js'
import GearBit from '../fce/gear.bit.js'
import State from '../../99.core/state.js'

export interface SomaticHandProfile {
    total_arms: number
    impairment_penalty_arms: number
}

export interface HandValidationItem {
    id: string
    occupies_hands: number
}

export interface HandCapacityValidationResult {
    valid: boolean
    available_arms: number
    occupied_hands: number
    error?: string
}

/**
 * Pre-Flight Hand Capacity Invariant Solver (T_0 = $0.00).
 * Enforces: sum(held_items.occupies_hands) <= max(0, total_arms - impairment_penalty)
 */
export const solveHandCapacitySAT = (
    somatic: SomaticHandProfile,
    heldItems: HandValidationItem[],
): HandCapacityValidationResult => {
    const availableArms = Math.max(
        0,
        somatic.total_arms - somatic.impairment_penalty_arms,
    )
    const occupiedHands = heldItems.reduce(
        (sum, item) => sum + item.occupies_hands,
        0,
    )

    if (occupiedHands > availableArms) {
        return {
            valid: false,
            available_arms: availableArms,
            occupied_hands: occupiedHands,
            error: `HAND_CAPACITY_EXCEEDED: Demanded ${occupiedHands} hands but only ${availableArms} functional arm(s) available.`,
        }
    }

    return {
        valid: true,
        available_arms: availableArms,
        occupied_hands: occupiedHands,
    }
}

export const initGear = (cpy: GearModel, bal: GearBit, _ste: State) => {
    if (bal?.slv) {
        bal.slv({ idx: 'init-gear', val: 0 })
    }
    return cpy
}

export const updateGear = (cpy: GearModel, bal: GearBit, _ste: State) => {
    if (bal?.slv) {
        bal.slv({ idx: 'update-gear', val: 0 })
    }
    return cpy
}
