import { LogisticModel } from '../logistic.model.js'
import LogisticBit from '../fce/logistic.bit'
import State from '../../99.core/state'
import {
    CharacterLogisticalVectorSchema,
    PossessionLogisticalVectorSchema,
    CharacterLogisticalVector,
    PossessionLogisticalVector,
    HandCapacityEvaluationInputSchema,
    HandCapacityEvaluationInput,
} from '../val/logistic.val'
import {
    HandCapacityAuditResultBit,
    EquipSlotTransferPayloadBit,
    EquipSlotTransferResultBit,
    MassConservationAuditResultBit,
} from '../fce/logistic.interface'

/**
 * Pure 7-bit ASCII Telemetry logger helper.
 */
async function emitTelemetry(channel: string, message: string): Promise<void> {
    const lib = (
        globalThis as unknown as {
            LIBRARY?: { hunt: (typ: string, obj: unknown) => Promise<void> }
        }
    ).LIBRARY
    if (lib && typeof lib.hunt === 'function') {
        await lib.hunt('[Console action] Update Console', {
            idx: channel,
            src: message,
        })
    }
}

export const initLogistic = (
    cpy: LogisticModel,
    bal: LogisticBit,
    ste: State,
) => {
    if (bal.slv != null) {
        bal.slv({ logBit: { idx: 'init-logistic', val: 1 } })
    }
    return cpy
}

export const updateLogistic = (
    cpy: LogisticModel,
    bal: LogisticBit,
    ste: State,
) => {
    if (bal.slv != null) {
        bal.slv({ logBit: { idx: 'update-logistic', val: 1 } })
    }
    return cpy
}

/**
 * Evaluates the Hand Capacity Invariant Equation at Stage T_0:
 * sum(occupies_hands_bps) <= arms_available_bps
 */
export function verifyHandSaturationSat(
    input: HandCapacityEvaluationInput,
): HandCapacityAuditResultBit
export function verifyHandSaturationSat(
    availableArmsBps: number,
    heldItems: Array<{
        id?: string
        handsRequiredBps?: number
        occupies_hands_bps?: number
    }>,
): HandCapacityAuditResultBit & {
    isSatisfiable: boolean
    demandedArmsBps: number
}
export function verifyHandSaturationSat(
    inputOrArms: HandCapacityEvaluationInput | number,
    heldItemsArg?: Array<{
        id?: string
        handsRequiredBps?: number
        occupies_hands_bps?: number
    }>,
): HandCapacityAuditResultBit & {
    isSatisfiable: boolean
    demandedArmsBps: number
} {
    if (typeof inputOrArms === 'number') {
        const availableArmsBps = inputOrArms
        const heldItems = heldItemsArg || []
        let demandedBps = 0
        for (const item of heldItems) {
            demandedBps += item.handsRequiredBps ?? item.occupies_hands_bps ?? 0
        }
        const isSatisfiable = demandedBps <= availableArmsBps
        return {
            valid: isSatisfiable,
            isSatisfiable,
            entity_id: 'char_unknown',
            arms_available_bps: availableArmsBps,
            demanded_hands_bps: demandedBps,
            demandedArmsBps: demandedBps,
            errorCode: isSatisfiable
                ? undefined
                : 'HAND_CAPACITY_SAT_VIOLATION',
            reason: isSatisfiable
                ? undefined
                : `Demanded upper-limb capacity (${demandedBps} bps) exceeds available biological arms (${availableArmsBps} bps)`,
        }
    }

    const parsed = HandCapacityEvaluationInputSchema.safeParse(inputOrArms)
    if (!parsed.success) {
        return {
            valid: false,
            isSatisfiable: false,
            entity_id: inputOrArms.entity_id || 'char_unknown',
            arms_available_bps: inputOrArms.arms_available_bps ?? 0,
            demanded_hands_bps: 0,
            demandedArmsBps: 0,
            errorCode: 'HAND_CAPACITY_INPUT_INVALID',
            reason:
                parsed.error.issues[0]?.message ??
                'Invalid hand capacity input schema',
        }
    }

    const { entity_id, arms_available_bps, held_items } = parsed.data

    let demandedBps = 0
    for (const item of held_items) {
        demandedBps += item.occupies_hands_bps
    }

    if (demandedBps > arms_available_bps) {
        return {
            valid: false,
            isSatisfiable: false,
            entity_id,
            arms_available_bps,
            demanded_hands_bps: demandedBps,
            demandedArmsBps: demandedBps,
            errorCode: 'HAND_CAPACITY_BREACH',
            reason: `Demanded upper-limb capacity (${demandedBps} bps) exceeds available biological arms (${arms_available_bps} bps)`,
        }
    }

    return {
        valid: true,
        isSatisfiable: true,
        entity_id,
        arms_available_bps,
        demanded_hands_bps: demandedBps,
        demandedArmsBps: demandedBps,
    }
}

export const verifyHandSaturationBuzz = async (
    cpy: LogisticModel,
    bal: LogisticBit<HandCapacityEvaluationInput>,
    ste: State,
) => {
    if (!bal.dat) {
        if (bal.slv) bal.slv({ logBit: { idx: bal.idx, val: 0 } })
        return cpy
    }

    const result = verifyHandSaturationSat(bal.dat)
    if (!result.valid) {
        await emitTelemetry(
            'cns00',
            `>> [HAND_CAPACITY_BREACH] Entity ${result.entity_id}: Demanded ${result.demanded_hands_bps} bps > Available ${result.arms_available_bps} bps`,
        )
    } else {
        await emitTelemetry(
            'cns00',
            `>> [HAND_CAPACITY_SAT] Entity ${result.entity_id}: Verified (${result.demanded_hands_bps} <= ${result.arms_available_bps} bps) [OK]`,
        )
    }

    if (bal.slv) {
        bal.slv({
            logBit: { idx: bal.idx, val: result.valid ? 1 : 0, dat: result },
        })
    }
    return cpy
}

/**
 * Transfers an item between 4-tier slot partitions on an entity.
 * Evaluates hand saturation if moving into 'held'.
 */
export function transferEquipSlot(
    vector: CharacterLogisticalVector,
    payload: EquipSlotTransferPayloadBit,
    knownPossessions: Record<string, PossessionLogisticalVector>,
): EquipSlotTransferResultBit {
    const {
        entity_id,
        item,
        target_partition,
        arms_available_bps,
        target_location_id,
    } = payload

    const currentVector = CharacterLogisticalVectorSchema.parse(vector)
    const targetItem = PossessionLogisticalVectorSchema.parse(item)

    // 1. If targeting 'held', evaluate the Hand Capacity Invariant SAT
    if (target_partition === 'held') {
        const currentlyHeldObjects: PossessionLogisticalVector[] =
            currentVector.held
                .filter((id) => id !== targetItem.item_id)
                .map((id) => {
                    const found = knownPossessions[id]
                    return (
                        found ?? {
                            item_id: id,
                            occupies_hands: 1,
                            occupies_hands_bps: 10000,
                            mass_grams: 100,
                            weight_class: 'scrap',
                            is_contested: false,
                            allowed_slots: ['HELD_PRIMARY', 'HELD_OFFHAND'],
                        }
                    )
                })

        currentlyHeldObjects.push(targetItem)

        const satCheck = verifyHandSaturationSat({
            entity_id,
            arms_available_bps,
            held_items: currentlyHeldObjects,
        })

        if (!satCheck.valid) {
            return {
                success: false,
                entity_id,
                item_id: targetItem.item_id,
                target_partition,
                errorCode: satCheck.errorCode,
                reason: satCheck.reason,
            }
        }
    }

    // 2. Clone partitions and remove item from any existing partition on this character
    const newWorn = currentVector.worn.filter((id) => id !== targetItem.item_id)
    const newHeld = currentVector.held.filter((id) => id !== targetItem.item_id)
    const newCarried = currentVector.carried.filter(
        (id) => id !== targetItem.item_id,
    )
    const newCached: Record<string, string[]> = {}

    for (const [locId, items] of Object.entries(currentVector.cached)) {
        newCached[locId] = items.filter((id) => id !== targetItem.item_id)
    }

    // 3. Insert into the target partition with ceiling checks
    if (target_partition === 'worn') {
        if (newWorn.length >= 4) {
            return {
                success: false,
                entity_id,
                item_id: targetItem.item_id,
                target_partition,
                errorCode: 'WORN_SLOT_CAPACITY_EXCEEDED',
                reason: 'Cannot exceed 4 worn items on body',
            }
        }
        newWorn.push(targetItem.item_id)
    } else if (target_partition === 'held') {
        if (newHeld.length >= 2) {
            return {
                success: false,
                entity_id,
                item_id: targetItem.item_id,
                target_partition,
                errorCode: 'HELD_SLOT_CAPACITY_EXCEEDED',
                reason: 'Cannot exceed 2 held items in hands',
            }
        }
        newHeld.push(targetItem.item_id)
    } else if (target_partition === 'carried') {
        if (newCarried.length >= 4) {
            return {
                success: false,
                entity_id,
                item_id: targetItem.item_id,
                target_partition,
                errorCode: 'CARRIED_SLOT_CAPACITY_EXCEEDED',
                reason: 'Cannot exceed 4 carried items',
            }
        }
        newCarried.push(targetItem.item_id)
    } else if (target_partition === 'cached') {
        const loc = target_location_id || 'loc_cache_default'
        if (!newCached[loc]) {
            newCached[loc] = []
        }
        newCached[loc].push(targetItem.item_id)
    }

    const updatedVector: CharacterLogisticalVector = {
        entity_id,
        worn: newWorn,
        held: newHeld,
        carried: newCarried,
        cached: newCached,
    }

    return {
        success: true,
        entity_id,
        item_id: targetItem.item_id,
        target_partition,
        updated_vector: CharacterLogisticalVectorSchema.parse(updatedVector),
    }
}

export const transferEquipSlotBuzz = async (
    cpy: LogisticModel,
    bal: LogisticBit<EquipSlotTransferPayloadBit>,
    ste: State,
) => {
    if (!bal.dat) {
        if (bal.slv) bal.slv({ logBit: { idx: bal.idx, val: 0 } })
        return cpy
    }

    const entityVector = cpy.characters[bal.dat.entity_id] ?? {
        entity_id: bal.dat.entity_id,
        worn: [],
        held: [],
        carried: [],
        cached: {},
    }

    const result = transferEquipSlot(entityVector, bal.dat, cpy.possessions)
    if (!result.success) {
        await emitTelemetry(
            'cns00',
            `>> [SLOT_TRANSFER_REJECTED] Item ${result.item_id} -> ${result.target_partition}: ${result.reason}`,
        )
    } else if (result.updated_vector) {
        cpy.characters[bal.dat.entity_id] = result.updated_vector
        cpy.possessions[bal.dat.item.item_id] = bal.dat.item
        await emitTelemetry(
            'cns00',
            `>> [SLOT_TRANSFER_OK] Item ${result.item_id} allocated to ${result.target_partition} on ${result.entity_id}`,
        )
    }

    if (bal.slv) {
        bal.slv({
            logBit: { idx: bal.idx, val: result.success ? 1 : 0, dat: result },
        })
    }
    return cpy
}

/**
 * Audits spatial exclusivity and conservation of mass across all registered entities.
 */
export function assertMassConservation(
    characters: Record<string, CharacterLogisticalVector>,
): MassConservationAuditResultBit {
    const itemSeenMap = new Map<string, string>()
    const duplicates: string[] = []
    let totalUnique = 0

    for (const [entityId, vector] of Object.entries(characters)) {
        const allSlots = [
            ...vector.worn,
            ...vector.held,
            ...vector.carried,
            ...Object.values(vector.cached).flat(),
        ]

        for (const itemId of allSlots) {
            if (itemSeenMap.has(itemId)) {
                duplicates.push(
                    `Item ${itemId} duplicate: already in entity ${itemSeenMap.get(itemId)}, re-encountered in ${entityId}`,
                )
            } else {
                itemSeenMap.set(itemId, entityId)
                totalUnique += 1
            }
        }
    }

    if (duplicates.length > 0) {
        return {
            valid: false,
            total_entities_checked: Object.keys(characters).length,
            total_unique_items: totalUnique,
            duplicate_items: duplicates,
            errorCode: 'MASS_CONSERVATION_BREACH',
        }
    }

    return {
        valid: true,
        total_entities_checked: Object.keys(characters).length,
        total_unique_items: totalUnique,
        duplicate_items: [],
    }
}

export const auditMassConservationBuzz = async (
    cpy: LogisticModel,
    bal: LogisticBit,
    ste: State,
) => {
    const audit = assertMassConservation(cpy.characters)
    if (!audit.valid) {
        await emitTelemetry(
            'cns00',
            `>> [MASS_CONSERVATION_BREACH] Detected ${audit.duplicate_items.length} spatial duplication(s)!`,
        )
    } else {
        await emitTelemetry(
            'cns00',
            `>> [MASS_CONSERVATION_OK] Audited ${audit.total_entities_checked} entities, ${audit.total_unique_items} unique items [OK]`,
        )
    }

    if (bal.slv) {
        bal.slv({
            logBit: { idx: bal.idx, val: audit.valid ? 1 : 0, dat: audit },
        })
    }
    return cpy
}

export const registerCharacterLogisticBuzz = (
    cpy: LogisticModel,
    bal: LogisticBit<CharacterLogisticalVector>,
    ste: State,
) => {
    if (bal.dat) {
        const validated = CharacterLogisticalVectorSchema.parse(bal.dat)
        cpy.characters[validated.entity_id] = validated
    }
    if (bal.slv) {
        bal.slv({ logBit: { idx: bal.idx, val: 1 } })
    }
    return cpy
}

export const registerPossessionBuzz = (
    cpy: LogisticModel,
    bal: LogisticBit<PossessionLogisticalVector>,
    ste: State,
) => {
    if (bal.dat) {
        const validated = PossessionLogisticalVectorSchema.parse(bal.dat)
        cpy.possessions[validated.item_id] = validated
    }
    if (bal.slv) {
        bal.slv({ logBit: { idx: bal.idx, val: 1 } })
    }
    return cpy
}

export interface EquippedItemDescriptor {
    readonly item_id: string
    readonly slot:
        'held_primary' | 'held_offhand' | 'worn' | 'carried' | 'cached'
    readonly occupies_hands_bp: number
}

export interface HandLoadResult {
    readonly required_hands_bp: number
    readonly items_in_hands: readonly string[]
}

/**
 * Calculates total hand capacity required by actively held equipment in basis points.
 */
export function calculateHandLoadBuzz(
    items: readonly EquippedItemDescriptor[] = [],
): HandLoadResult {
    let requiredHandsBp = 0
    const itemsInHands: string[] = []

    for (const item of items) {
        if (item.slot === 'held_primary' || item.slot === 'held_offhand') {
            requiredHandsBp += item.occupies_hands_bp
            itemsInHands.push(item.item_id)
        }
    }

    return {
        required_hands_bp: requiredHandsBp,
        items_in_hands: itemsInHands,
    }
}
