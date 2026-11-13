import clone from 'clone-deep'
import type {
    CharacterLogisticalVector,
    PossessionLogisticalVector,
} from '../val/logistic.val.js'
import type {
    RetiredEntityCustodyPayload,
    MatterConservationReceipt,
    ReassignedPossessionState,
    default as LogisticBit,
} from '../fce/logistic.bit.js'
import type { LogisticModel } from '../logistic.model.js'
import type State from '../../99.core/state.js'
import { verifyHandSaturationSat } from './logistic.buzz.js'

const CEILING_MAP: Record<'worn' | 'held' | 'carried', number> = {
    worn: 4,
    held: 2,
    carried: 4,
}

export function reconcileRetiredEntityPossessions(
    payload: RetiredEntityCustodyPayload,
): MatterConservationReceipt {
    const {
        retiring_entity_id,
        held_possessions,
        item_transfers,
        active_characters,
        valid_location_ids,
        known_possessions,
    } = payload

    const errors: string[] = []
    const validLocSet = new Set(valid_location_ids)
    const dispositionMap = new Map<string, (typeof item_transfers)[number]>()

    for (const transfer of item_transfers) {
        if (dispositionMap.has(transfer.item_id)) {
            errors.push(
                `[MATTER_CONSERVATION_BREACH] Duplicate disposition declared for item '${transfer.item_id}'`,
            )
        } else {
            dispositionMap.set(transfer.item_id, transfer)
        }
    }

    for (const pos of held_possessions) {
        if (!dispositionMap.has(pos.item_id)) {
            errors.push(
                `[DANGLING_RETIRED_CUSTODY_BREACH] Held possession '${pos.item_id}' of retiring '${retiring_entity_id}' has no disposition in item_transfers`,
            )
        }
    }

    if (errors.length > 0) {
        return {
            valid: false,
            retiring_entity_id,
            total_items_accounted: 0,
            transferred_count: 0,
            dropped_count: 0,
            updated_character_vectors: {},
            updated_possession_states: [],
            errorCode: 'DANGLING_RETIRED_CUSTODY_BREACH',
            errors,
        }
    }

    const workingCharacters = clone(active_characters)
    const updatedVectors: Record<string, CharacterLogisticalVector> = {}
    const updatedStates: ReassignedPossessionState[] = []
    let transferredCount = 0
    let droppedCount = 0
    let primaryErrorCode:
        | 'MATTER_CONSERVATION_BREACH'
        | 'DANGLING_RETIRED_CUSTODY_BREACH'
        | 'HAND_CAPACITY_BREACH'
        | undefined

    for (const pos of held_possessions) {
        const disp = dispositionMap.get(pos.item_id)!

        if (disp.disposition_type === 'DROP_AT_LOCATION') {
            if (disp.recipient_character_id !== null) {
                primaryErrorCode =
                    primaryErrorCode || 'MATTER_CONSERVATION_BREACH'
                errors.push(
                    `[MATTER_CONSERVATION_BREACH] Dropped item '${pos.item_id}' must set recipient_character_id to null`,
                )
                continue
            }

            const locId = disp.drop_location_id
            if (!locId || !validLocSet.has(locId)) {
                primaryErrorCode =
                    primaryErrorCode || 'MATTER_CONSERVATION_BREACH'
                errors.push(
                    `[MATTER_CONSERVATION_BREACH] Dropped item '${pos.item_id}' targets invalid or missing location '${locId || ''}'`,
                )
                continue
            }

            updatedStates.push({
                item_id: pos.item_id,
                owner_id: null,
                location_id: locId,
            })
            droppedCount++
            continue
        }

        if (disp.disposition_type === 'TRANSFER_TO_CHARACTER') {
            const recipientId = disp.recipient_character_id
            if (!recipientId || recipientId === retiring_entity_id) {
                primaryErrorCode =
                    primaryErrorCode || 'DANGLING_RETIRED_CUSTODY_BREACH'
                errors.push(
                    `[DANGLING_RETIRED_CUSTODY_BREACH] Item '${pos.item_id}' cannot transfer to self or empty recipient`,
                )
                continue
            }

            const recipient = workingCharacters[recipientId]
            if (!recipient || recipient.is_retired) {
                primaryErrorCode =
                    primaryErrorCode || 'DANGLING_RETIRED_CUSTODY_BREACH'
                errors.push(
                    `[DANGLING_RETIRED_CUSTODY_BREACH] Recipient '${recipientId}' for item '${pos.item_id}' is missing or retired`,
                )
                continue
            }

            const partition = disp.target_partition || 'held'
            const targetArr = recipient.vector[partition]
            if (targetArr.length >= CEILING_MAP[partition]) {
                primaryErrorCode =
                    primaryErrorCode || 'MATTER_CONSERVATION_BREACH'
                errors.push(
                    `[MATTER_CONSERVATION_BREACH] Recipient '${recipientId}' partition '${partition}' exceeded ceiling (${CEILING_MAP[partition]}) for '${pos.item_id}'`,
                )
                continue
            }

            targetArr.push(pos.item_id)

            if (partition === 'held') {
                const heldVectors: PossessionLogisticalVector[] =
                    recipient.vector.held.map(
                        (id) => known_possessions[id] || pos,
                    )
                const satAudit = verifyHandSaturationSat({
                    entity_id: recipientId,
                    arms_available_bps: recipient.arms_available_bps,
                    held_items: heldVectors,
                })

                if (!satAudit.valid) {
                    primaryErrorCode =
                        primaryErrorCode || 'HAND_CAPACITY_BREACH'
                    errors.push(
                        `[MATTER_CONSERVATION_BREACH] ${satAudit.reason || 'Recipient hand saturation breached'}`,
                    )
                    continue
                }
            }

            updatedVectors[recipientId] = recipient.vector
            updatedStates.push({
                item_id: pos.item_id,
                owner_id: recipientId,
                location_id: null,
            })
            transferredCount++
        }
    }

    if (errors.length > 0) {
        return {
            valid: false,
            retiring_entity_id,
            total_items_accounted: 0,
            transferred_count: 0,
            dropped_count: 0,
            updated_character_vectors: {},
            updated_possession_states: [],
            errorCode: primaryErrorCode || 'MATTER_CONSERVATION_BREACH',
            errors,
        }
    }

    return {
        valid: true,
        retiring_entity_id,
        total_items_accounted: transferredCount + droppedCount,
        transferred_count: transferredCount,
        dropped_count: droppedCount,
        updated_character_vectors: updatedVectors,
        updated_possession_states: updatedStates,
        errors: [],
    }
}

export const reconcileRetiredPossessionsAction = (
    cpy: LogisticModel,
    bal: LogisticBit<RetiredEntityCustodyPayload>,
    ste?: State,
): LogisticModel => {
    const dat = bal?.dat
    if (!dat) return cpy

    const receipt = reconcileRetiredEntityPossessions(dat)
    if (receipt.valid) {
        for (const [charId, vec] of Object.entries(
            receipt.updated_character_vectors,
        )) {
            cpy.characterVectors[charId] = vec
        }
    }

    if (bal?.slv) {
        bal.slv({
            logBit: {
                idx: bal.idx || 'reconcile-retired-possessions',
                val: receipt.valid ? 1 : 0,
                dat: receipt,
            },
        })
    }
    return cpy
}
