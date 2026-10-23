import {
    CharacterLogisticalVector,
    PossessionLogisticalVector,
    AnatomicalEquipPartition,
} from '../val/logistic.val'

export interface HandCapacityAuditResultBit {
    readonly valid: boolean
    readonly entity_id: string
    readonly arms_available_bps: number
    readonly demanded_hands_bps: number
    readonly errorCode?: string
    readonly reason?: string
}

export interface EquipSlotTransferPayloadBit {
    readonly entity_id: string
    readonly item: PossessionLogisticalVector
    readonly source_partition?: AnatomicalEquipPartition
    readonly target_partition: AnatomicalEquipPartition
    readonly source_location_id?: string
    readonly target_location_id?: string
    readonly arms_available_bps: number
}

export interface EquipSlotTransferResultBit {
    readonly success: boolean
    readonly entity_id: string
    readonly item_id: string
    readonly target_partition: AnatomicalEquipPartition
    readonly updated_vector?: CharacterLogisticalVector
    readonly errorCode?: string
    readonly reason?: string
}

export interface MassConservationAuditResultBit {
    readonly valid: boolean
    readonly total_entities_checked: number
    readonly total_unique_items: number
    readonly duplicate_items: readonly string[]
    readonly errorCode?: string
}

export default interface Logistic {
    idx: string
    characters: Record<string, CharacterLogisticalVector>
    possessions: Record<string, PossessionLogisticalVector>
}
