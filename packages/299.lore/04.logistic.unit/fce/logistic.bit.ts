import type {
    AnatomicalEquipPartition,
    CharacterLogisticalVector,
    PossessionLogisticalVector,
} from '../val/logistic.val.js'

export interface HandSaturationAuditInput {
    entity_id: string
    arms_available_bps: number
    held_items: PossessionLogisticalVector[]
}

export interface HandSaturationAuditReceipt {
    valid: boolean
    entity_id: string
    arms_available_bps: number
    demanded_hands_bps: number
    errorCode?: 'HAND_CAPACITY_BREACH'
    reason?: string
}

export interface EquipSlotTransferRequest {
    entity_id: string
    item: PossessionLogisticalVector
    source_partition: AnatomicalEquipPartition
    target_partition: AnatomicalEquipPartition
    arms_available_bps: number
    source_location_id?: string
    target_location_id?: string
}

export interface EquipSlotTransferResult {
    success: boolean
    entity_id: string
    item_id: string
    errorCode?:
        | 'HAND_CAPACITY_BREACH'
        | 'PARTITION_CEILING_BREACH'
        | 'ITEM_NOT_IN_SOURCE_PARTITION'
        | 'MISSING_LOCATION_ID'
    reason?: string
    updated_vector?: CharacterLogisticalVector
}

export interface DuplicateItemLeaseEntry {
    item_id: string
    holders: string[]
}

export interface MassConservationAuditReceipt {
    valid: boolean
    total_characters_audited: number
    total_unique_items: number
    duplicate_items: DuplicateItemLeaseEntry[]
    ungrounded_items: string[]
    errorCode?: 'MASS_CONSERVATION_BREACH' | 'UNGROUNDED_POSSESSION_BREACH'
    errors: string[]
}

export interface ItemCustodyDisposition {
    item_id: string
    disposition_type: 'TRANSFER_TO_CHARACTER' | 'DROP_AT_LOCATION'
    recipient_character_id: string | null
    target_partition?: 'held' | 'worn' | 'carried'
    drop_location_id?: string | null
}

export interface ActiveRecipientSnapshot {
    arms_available_bps: number
    vector: CharacterLogisticalVector
    is_retired?: boolean
}

export interface RetiredEntityCustodyPayload {
    retiring_entity_id: string
    held_possessions: PossessionLogisticalVector[]
    item_transfers: ItemCustodyDisposition[]
    active_characters: Record<string, ActiveRecipientSnapshot>
    valid_location_ids: string[]
    known_possessions: Record<string, PossessionLogisticalVector>
}

export interface ReassignedPossessionState {
    item_id: string
    owner_id: string | null
    location_id: string | null
}

export interface MatterConservationReceipt {
    valid: boolean
    retiring_entity_id: string
    total_items_accounted: number
    transferred_count: number
    dropped_count: number
    updated_character_vectors: Record<string, CharacterLogisticalVector>
    updated_possession_states: ReassignedPossessionState[]
    errorCode?:
        | 'MATTER_CONSERVATION_BREACH'
        | 'DANGLING_RETIRED_CUSTODY_BREACH'
        | 'HAND_CAPACITY_BREACH'
    errors: string[]
}

export type DepartureType =
    'death' | 'estrangement' | 'missing' | 'destruction' | 'unresolved_absence'

export interface RetireCanonicalEntityPayload {
    seriesSlug: string
    characterId: string
    departureType: DepartureType
    resolutionCause: string
    departureEpoch: number
    itemTransfers: ItemCustodyDisposition[]
    repoRoot?: string
    sealCallback?: (
        seriesSlug: string,
        repoRoot: string,
    ) => Promise<string> | string
}

export interface RetireCanonicalEntityReceipt {
    success: boolean
    characterId: string
    oldPath: string
    newPath: string
    archivedGrievances: string[]
    updatedPossessions: string[]
    rootMerkleHash: string
    byteZeroVerified: boolean
    errorCode?:
        | 'MATTER_CONSERVATION_BREACH'
        | 'DANGLING_RETIRED_CUSTODY_BREACH'
        | 'HAND_CAPACITY_BREACH'
        | 'ENTITY_NOT_FOUND'
        | 'BYTE_ZERO_BREACH'
    errors: string[]
}

export default interface LogisticBit<TDat = any> {
    idx: string
    src?: string
    val?: number
    dat?: TDat
    slv?: (result: { logBit: { idx: string; val: number; dat?: any } }) => void
}
