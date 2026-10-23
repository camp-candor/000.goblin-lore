import type { WoundModel } from '../wound.model'
import type WoundBit from '../fce/wound.bit'
import type State from '../../99.core/state'
import {
    CompoundTraumaInputSchema,
    LimbClampingReceiptSchema,
    SEVERE_ARM_CONDITIONS_LIST,
    type CompoundTraumaInput,
    type LimbClampingReceipt,
} from '../val/wound.val'

const SEVERE_ARM_CONDITIONS_SET = new Set<string>(
    SEVERE_ARM_CONDITIONS_LIST.map((c) => c.toLowerCase()),
)

export const assertIntegerBps = (val: number, label: string): void => {
    if (!Number.isInteger(val)) {
        throw new Error(
            `[FLOAT_PROHIBITED] ${label} must be integer basis points. Received: ${val}`,
        )
    }
}

/**
 * Computes upper-limb capacity under compound trauma with lower-bound clamping at 0 bps.
 */
export const calculateCompoundTraumaLimbClamping = (
    input: CompoundTraumaInput,
): LimbClampingReceipt => {
    const parsed = CompoundTraumaInputSchema.parse(input)

    // 1. Determine base biological allocation in integer basis points
    let baseArmsBps = 20000 // 2.0 arms default
    if (
        parsed.locomotionBaseline === 'sessile' ||
        parsed.locomotionBaseline === 'slithering'
    ) {
        baseArmsBps = 0
    } else if (parsed.baseArmsBps !== undefined) {
        assertIntegerBps(parsed.baseArmsBps, 'baseArmsBps')
        baseArmsBps = parsed.baseArmsBps
    }

    // 2. Audit active conditions case-insensitively
    const matchedSevereConditions: string[] = []
    for (const rawCondition of parsed.conditions) {
        const normalized = rawCondition.trim().toLowerCase()
        if (SEVERE_ARM_CONDITIONS_SET.has(normalized)) {
            matchedSevereConditions.push(normalized)
        }
    }

    // 3. Subtract 10,000 bps (1.0 arm) per severe condition
    const penaltiesAppliedCount = matchedSevereConditions.length
    const totalPenaltyBps = penaltiesAppliedCount * 10000
    const rawCalculatedBps = baseArmsBps - totalPenaltyBps

    // 4. Lower-bound clamp at 0 bps to prevent negative limb capacity
    const availableArmsBps = Math.max(0, rawCalculatedBps)
    const isClampedAtZero = rawCalculatedBps < 0
    const armsAvailable = Math.floor(availableArmsBps / 10000)

    const receipt: LimbClampingReceipt = {
        entityId: parsed.entityId,
        locomotionBaseline: parsed.locomotionBaseline,
        baseArmsBps,
        penaltiesAppliedCount,
        totalPenaltyBps,
        rawCalculatedBps,
        availableArmsBps,
        armsAvailable,
        isClampedAtZero,
        matchedSevereConditions,
    }

    return LimbClampingReceiptSchema.parse(receipt)
}

export const initWound = (
    cpy: WoundModel,
    bal: WoundBit,
    _ste: State,
): WoundModel => {
    cpy.clampedReceipts = {}
    if (bal?.slv) bal.slv({ wndBit: { idx: 'init-wound', val: 0 } })
    return cpy
}

export const updateWound = (
    cpy: WoundModel,
    bal: WoundBit,
    _ste: State,
): WoundModel => {
    if (bal?.slv) bal.slv({ wndBit: { idx: 'update-wound' } })
    return cpy
}

export const clampCompoundTrauma = (
    cpy: WoundModel,
    bal: WoundBit<CompoundTraumaInput>,
    _ste: State,
): WoundModel => {
    const payload = bal?.dat
    if (!payload?.entityId) {
        if (bal?.slv) {
            bal.slv({
                wndBit: {
                    idx: 'clamp-compound-trauma-err',
                    src: 'MISSING_PAYLOAD',
                    val: -1,
                },
            })
        }
        return cpy
    }

    try {
        const receipt = calculateCompoundTraumaLimbClamping(payload)
        cpy.clampedReceipts[receipt.entityId] = receipt

        if (bal?.slv) {
            bal.slv({
                wndBit: {
                    idx: 'clamp-compound-trauma-ok',
                    src: receipt.entityId,
                    val: receipt.availableArmsBps,
                    dat: receipt,
                },
            })
        }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        if (bal?.slv) {
            bal.slv({
                wndBit: {
                    idx: 'clamp-compound-trauma-fail',
                    src: payload.entityId,
                    val: -1,
                    dat: { error: message },
                },
            })
        }
    }

    return cpy
}
