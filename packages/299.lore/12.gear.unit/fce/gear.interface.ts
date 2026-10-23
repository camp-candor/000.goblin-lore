import {
    PossessionDossierFrontmatter,
    ResolveGearPointersInput,
} from '../val/gear.val'

export interface ResolvedGearItemRecordBit {
    readonly item_id: string
    readonly name: string
    readonly mass_grams: number
    readonly occupies_hands_bps: number
    readonly weight_class: string
    readonly is_contested: boolean
    readonly slot_assigned: 'worn' | 'held' | 'carried' | 'cached'
    readonly location_id?: string
}

export interface CharacterGearResolutionResultBit {
    readonly success: boolean
    readonly character_id: string
    readonly total_mass_grams: number
    readonly total_held_hands_bps: number
    readonly resolved_items: readonly ResolvedGearItemRecordBit[]
    readonly missing_item_slugs: readonly string[]
    readonly duplicate_item_slugs: readonly string[]
    readonly errorCode?:
        | 'NONE'
        | 'DANGLING_POSSESSION_POINTER'
        | 'DUPLICATE_ITEM_LEASE_BREACH'
        | 'DANGLING_RETIRED_CUSTODY_BREACH'
        | 'SCHEMA_VALIDATION_ERROR'
    readonly reason?: string
}

export interface FleetGearAuditResultBit {
    readonly success: boolean
    readonly total_characters_audited: number
    readonly total_possessions_indexed: number
    readonly duplicate_leases: readonly string[]
    readonly ungrounded_possessions: readonly string[]
    readonly dangling_pointers: readonly string[]
}

export default interface Gear {
    idx: string
    catalog: Record<string, PossessionDossierFrontmatter>
    allocations: Record<string, CharacterGearResolutionResultBit>
}
