export default interface EntityBit {
    idx: string
    src?: string
    val?: number
    dat?: any
    slv?: Function
}

export interface SomaticSATCandidateBit {
    readonly entity_id: string
    readonly base_arms_bp: number
    readonly somatic_conditions: readonly string[]
    readonly equipped_items: readonly {
        readonly item_id: string
        readonly slot:
            'held_primary' | 'held_offhand' | 'worn' | 'carried' | 'cached'
        readonly occupies_hands_bp: number
    }[]
    readonly locomotion_baseline: string
    readonly manual_banned_verbs?: readonly string[]
}

export interface SomaticSATReceiptBit {
    readonly success: boolean
    readonly entity_id: string
    readonly code: string
    readonly available_arms_bp: number
    readonly required_hands_bp: number
    readonly max_velocity_bp: number
    readonly consolidated_banned_verbs: readonly string[]
    readonly message: string
}
