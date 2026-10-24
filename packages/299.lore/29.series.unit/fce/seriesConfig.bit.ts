export interface StateSpaceConfig {
    readonly scarcity_index_bps: number
    readonly paranoia_baseline_bps: number
    readonly scrap_max_grams: number
    readonly weight_max_grams: number
}

export interface InvariantLawsConfig {
    readonly max_farce_ratio_bps: number
    readonly global_acoustic_floor_cdb: number
    readonly vo_ducking_db: number
    readonly min_grievances_per_dyad: number
    readonly min_normalized_category_entropy_bps: number
    readonly thematic_categories: readonly string[]
}

export interface MediumProjectionsConfig {
    readonly tts_port: number
    readonly comfy_port: number
    readonly lora_trigger_tokens: readonly string[]
}

export interface SeriesConfigPayload {
    readonly series_slug: string
    readonly display_name: string
    readonly genre_tag:
        'LOW_FANTASY_FARCE' | 'SOUTHERN_GOTHIC_INDUSTRIAL' | 'HARD_SCIFI_VACUUM'
    readonly central_irony: string
    readonly state_space: StateSpaceConfig
    readonly action_vocabulary: readonly string[]
    readonly invariants: InvariantLawsConfig
    readonly medium_projections: MediumProjectionsConfig
}

export default interface SeriesConfigBit {
    readonly idx: string
    readonly src?: string
    readonly val?: number
    readonly dat?: {
        readonly config?: SeriesConfigPayload
        readonly filePath?: string
        readonly cancelled?: boolean
        readonly error?: string
    }
    readonly slv?: (res: any) => void
}
