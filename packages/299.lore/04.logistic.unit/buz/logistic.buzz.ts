import type {
    CharacterLogisticalVector,
    PossessionLogisticalVector,
} from '../val/logistic.val.js'
import type {
    HandSaturationAuditInput,
    HandSaturationAuditReceipt,
    EquipSlotTransferRequest,
    EquipSlotTransferResult,
    DuplicateItemLeaseEntry,
    MassConservationAuditReceipt,
    default as LogisticBit,
} from '../fce/logistic.bit.js'
import type { LogisticModel } from '../logistic.model.js'
import type State from '../../99.core/state.js'

export const initLogistic = (
    cpy: LogisticModel,
    bal: LogisticBit,
    ste?: State,
): LogisticModel => {
    cpy.characterVectors = {}
    cpy.possessionCatalog = {}
    if (bal?.slv) {
        bal.slv({ logBit: { idx: bal.idx || 'init-logistic', val: 1 } })
    }
    return cpy
}

export const updateLogistic = (
    cpy: LogisticModel,
    bal: LogisticBit,
    ste?: State,
): LogisticModel => {
    if (bal?.slv) {
        bal.slv({ logBit: { idx: bal.idx || 'update-logistic', val: 1 } })
    }
    return cpy
}

export function verifyHandSaturationSat(
    input: HandSaturationAuditInput,
): HandSaturationAuditReceipt {
    if (!Number.isInteger(input.arms_available_bps)) {
        throw new Error(
            '[FLOAT_PROHIBITED] arms_available_bps must be an integer',
        )
    }
    if (input.arms_available_bps < 0 || input.arms_available_bps > 20000) {
        throw new Error(
            '[OUT_OF_BOUNDS] arms_available_bps must be between 0 and 20000',
        )
    }

    let demandedHandsBps = 0
    for (const item of input.held_items) {
        if (!Number.isInteger(item.occupies_hands_bps)) {
            throw new Error(
                '[FLOAT_PROHIBITED] occupies_hands_bps must be an integer',
            )
        }
        demandedHandsBps += item.occupies_hands_bps
    }

    if (demandedHandsBps > input.arms_available_bps) {
        return {
            valid: false,
            entity_id: input.entity_id,
            arms_available_bps: input.arms_available_bps,
            demanded_hands_bps: demandedHandsBps,
            errorCode: 'HAND_CAPACITY_BREACH',
            reason: `Entity '${input.entity_id}' demanded ${demandedHandsBps} bps hands with only ${input.arms_available_bps} bps available`,
        }
    }

    return {
        valid: true,
        entity_id: input.entity_id,
        arms_available_bps: input.arms_available_bps,
        demanded_hands_bps: demandedHandsBps,
    }
}

export function transferEquipSlot(
    currentVector: CharacterLogisticalVector,
    request: EquipSlotTransferRequest,
    knownPossessions: Record<string, PossessionLogisticalVector>,
): EquipSlotTransferResult {
    const nextVector: CharacterLogisticalVector = {
        entity_id: currentVector.entity_id,
        worn: [...currentVector.worn],
        held: [...currentVector.held],
        carried: [...currentVector.carried],
        cached: Object.fromEntries(
            Object.entries(currentVector.cached).map(([loc, items]) => [
                loc,
                [...items],
            ]),
        ),
    }

    const itemId = request.item.item_id

    if (request.source_partition === 'cached') {
        const srcLoc = request.source_location_id
        if (!srcLoc) {
            return {
                success: false,
                entity_id: request.entity_id,
                item_id: itemId,
                errorCode: 'MISSING_LOCATION_ID',
                reason: 'source_location_id is required when transferring from cached partition',
            }
        }
        const locList = nextVector.cached[srcLoc] || []
        const idx = locList.indexOf(itemId)
        if (idx === -1) {
            return {
                success: false,
                entity_id: request.entity_id,
                item_id: itemId,
                errorCode: 'ITEM_NOT_IN_SOURCE_PARTITION',
                reason: `Item '${itemId}' not found in cached location '${srcLoc}'`,
            }
        }
        locList.splice(idx, 1)
        nextVector.cached[srcLoc] = locList
    } else {
        const srcArr = nextVector[request.source_partition]
        const idx = srcArr.indexOf(itemId)
        if (idx === -1) {
            return {
                success: false,
                entity_id: request.entity_id,
                item_id: itemId,
                errorCode: 'ITEM_NOT_IN_SOURCE_PARTITION',
                reason: `Item '${itemId}' not found in '${request.source_partition}' partition`,
            }
        }
        srcArr.splice(idx, 1)
    }

    if (request.target_partition === 'cached') {
        const tgtLoc = request.target_location_id
        if (!tgtLoc) {
            return {
                success: false,
                entity_id: request.entity_id,
                item_id: itemId,
                errorCode: 'MISSING_LOCATION_ID',
                reason: 'target_location_id is required when transferring into cached partition',
            }
        }
        nextVector.cached[tgtLoc] = nextVector.cached[tgtLoc] || []
        nextVector.cached[tgtLoc].push(itemId)
        return {
            success: true,
            entity_id: request.entity_id,
            item_id: itemId,
            updated_vector: nextVector,
        }
    }

    const ceilingMap: Record<'worn' | 'held' | 'carried', number> = {
        worn: 4,
        held: 2,
        carried: 4,
    }

    const tgtArr = nextVector[request.target_partition]
    if (tgtArr.length >= ceilingMap[request.target_partition]) {
        return {
            success: false,
            entity_id: request.entity_id,
            item_id: itemId,
            errorCode: 'PARTITION_CEILING_BREACH',
            reason: `Partition '${request.target_partition}' reached maximum capacity (${ceilingMap[request.target_partition]})`,
        }
    }

    tgtArr.push(itemId)

    if (request.target_partition === 'held') {
        const heldVectors: PossessionLogisticalVector[] = nextVector.held.map(
            (id) => knownPossessions[id] || request.item,
        )
        const satAudit = verifyHandSaturationSat({
            entity_id: request.entity_id,
            arms_available_bps: request.arms_available_bps,
            held_items: heldVectors,
        })

        if (!satAudit.valid) {
            return {
                success: false,
                entity_id: request.entity_id,
                item_id: itemId,
                errorCode: 'HAND_CAPACITY_BREACH',
                reason: satAudit.reason,
            }
        }
    }

    return {
        success: true,
        entity_id: request.entity_id,
        item_id: itemId,
        updated_vector: nextVector,
    }
}

export const allocateEquipSlot = transferEquipSlot

export function assertMassConservation(
    characters: Record<string, CharacterLogisticalVector>,
    catalog?: Record<string, PossessionLogisticalVector>,
): MassConservationAuditReceipt {
    const leaseRegistry = new Map<string, string[]>()
    const errors: string[] = []

    const recordLease = (itemId: string, holderLabel: string) => {
        const existing = leaseRegistry.get(itemId) || []
        existing.push(holderLabel)
        leaseRegistry.set(itemId, existing)
    }

    for (const [charId, vec] of Object.entries(characters)) {
        for (const id of vec.worn) recordLease(id, `${charId}:worn`)
        for (const id of vec.held) recordLease(id, `${charId}:held`)
        for (const id of vec.carried) recordLease(id, `${charId}:carried`)
        for (const [locId, items] of Object.entries(vec.cached)) {
            for (const id of items) recordLease(id, `${charId}:cached:${locId}`)
        }
    }

    const duplicateItems: DuplicateItemLeaseEntry[] = []
    for (const [itemId, holders] of leaseRegistry.entries()) {
        if (holders.length > 1) {
            duplicateItems.push({ item_id: itemId, holders })
            errors.push(
                `[DUPLICATE_ITEM_LEASE_BREACH] Item '${itemId}' simultaneously leased across [${holders.join(', ')}]`,
            )
        }
    }

    const ungroundedItems: string[] = []
    if (catalog) {
        for (const [itemId, dossier] of Object.entries(catalog)) {
            const leased = leaseRegistry.has(itemId)
            const hasOwner = Boolean(dossier.owner_id)
            const hasLocation = Boolean(dossier.location_id)
            if (!leased && !hasOwner && !hasLocation) {
                ungroundedItems.push(itemId)
                errors.push(
                    `[UNGROUNDED_POSSESSION_BREACH] Item '${itemId}' lacks active lease, owner_id, and location_id`,
                )
            }
        }
    }

    const valid = duplicateItems.length === 0 && ungroundedItems.length === 0
    let errorCode:
        'MASS_CONSERVATION_BREACH' | 'UNGROUNDED_POSSESSION_BREACH' | undefined
    if (duplicateItems.length > 0) errorCode = 'MASS_CONSERVATION_BREACH'
    else if (ungroundedItems.length > 0)
        errorCode = 'UNGROUNDED_POSSESSION_BREACH'

    return {
        valid,
        total_characters_audited: Object.keys(characters).length,
        total_unique_items: leaseRegistry.size,
        duplicate_items: duplicateItems,
        ungrounded_items: ungroundedItems,
        errorCode,
        errors,
    }
}

export const verifyHandSaturationAction = (
    cpy: LogisticModel,
    bal: LogisticBit,
    ste?: State,
): LogisticModel => {
    const dat = bal?.dat
    if (!dat) return cpy
    const receipt = verifyHandSaturationSat(dat)
    if (bal?.slv) {
        bal.slv({
            logBit: {
                idx: bal.idx || 'verify-hand-saturation',
                val: receipt.valid ? 1 : 0,
                dat: receipt,
            },
        })
    }
    return cpy
}

export const allocateEquipSlotAction = (
    cpy: LogisticModel,
    bal: LogisticBit,
    ste?: State,
): LogisticModel => {
    const dat = bal?.dat
    if (!dat || !dat.request) return cpy
    const current = cpy.characterVectors[dat.request.entity_id]
    if (!current) return cpy

    const res = transferEquipSlot(current, dat.request, cpy.possessionCatalog)
    if (res.success && res.updated_vector) {
        cpy.characterVectors[dat.request.entity_id] = res.updated_vector
    }
    if (bal?.slv) {
        bal.slv({
            logBit: {
                idx: bal.idx || 'allocate-equip-slot',
                val: res.success ? 1 : 0,
                dat: res,
            },
        })
    }
    return cpy
}

export const assertMassConservationAction = (
    cpy: LogisticModel,
    bal: LogisticBit,
    ste?: State,
): LogisticModel => {
    const receipt = assertMassConservation(
        cpy.characterVectors,
        cpy.possessionCatalog,
    )
    if (bal?.slv) {
        bal.slv({
            logBit: {
                idx: bal.idx || 'assert-mass-conservation',
                val: receipt.valid ? 1 : 0,
                dat: receipt,
            },
        })
    }
    return cpy
}
