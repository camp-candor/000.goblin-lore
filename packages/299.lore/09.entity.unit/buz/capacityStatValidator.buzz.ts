import type State from '../../99.core/state.js'
import type {
    SomaticLimbCapacity,
    CombatAttributeStats,
} from '../val/capacityStat.val.js'

export interface HandLoadRequirement {
    readonly item_id: string
    readonly occupies_hands_bps: number
}

export interface CapacityAuditReceipt {
    readonly valid: boolean
    readonly available_arms_bps: number
    readonly required_hands_bps: number
    readonly deficit_bps: number
    readonly errorCode?: string
    readonly message?: string
}

export const auditEntityCapacityPreFlight = (
    somatic: SomaticLimbCapacity,
    equippedItems: readonly HandLoadRequirement[] = [],
    _stats: CombatAttributeStats,
): CapacityAuditReceipt => {
    let requiredHandsBps = 0
    for (const item of equippedItems) {
        if (!Number.isInteger(item.occupies_hands_bps)) {
            return {
                valid: false,
                available_arms_bps: somatic.arms_available_bps,
                required_hands_bps: 0,
                deficit_bps: 0,
                errorCode: 'FLOAT_PROHIBITED',
                message: `[FLOAT_PROHIBITED] Item '${item.item_id}' hand requirement must be an integer basis point.`,
            }
        }
        requiredHandsBps += item.occupies_hands_bps
    }

    const deficitBps = requiredHandsBps - somatic.arms_available_bps
    if (deficitBps > 0) {
        return {
            valid: false,
            available_arms_bps: somatic.arms_available_bps,
            required_hands_bps: requiredHandsBps,
            deficit_bps: deficitBps,
            errorCode: 'ANATOMICAL_CAPACITY_EXCEEDED',
            message: `[ANATOMICAL_CAPACITY_EXCEEDED] Required hand load (${requiredHandsBps} bp) exceeds available somatic capacity (${somatic.arms_available_bps} bp) by ${deficitBps} bp.`,
        }
    }

    return {
        valid: true,
        available_arms_bps: somatic.arms_available_bps,
        required_hands_bps: requiredHandsBps,
        deficit_bps: 0,
    }
}

export const validateCapacityAction = async (
    cpy: any,
    bal: any,
    _ste?: State,
): Promise<any> => {
    const dat = bal?.dat || {}
    const audit = auditEntityCapacityPreFlight(
        dat.somatic,
        dat.equippedItems || [],
        dat.stats,
    )

    if (bal?.slv) {
        bal.slv({
            entBit: {
                idx: bal.idx,
                val: audit.valid ? 1 : 0,
                dat: audit,
            },
        })
    }

    return cpy
}
