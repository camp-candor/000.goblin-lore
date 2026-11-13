export type GenreClassification =
    | 'LOW_FANTASY_FARCE'
    | 'STANDARD'
    | 'SUPERHERO_URBAN_VIGILANTE'
    | 'SOUTHERN_GOTHIC_INDUSTRIAL'
    | 'HARD_SCIFI_VACUUM'

export interface GenesisWizardStateSpace {
    readonly scarcity_index_bp: number
    readonly paranoia_baseline_bp: number
    readonly somatic_fatigue_enabled: boolean
    readonly epistemic_ignorance_enabled: boolean
    readonly gram_mass_tiers: {
        readonly scrap_max_grams: number
        readonly weight_max_grams: number
        readonly bulk_min_grams: number
    }
}

export interface GenesisWizardActionVocabulary {
    readonly permitted_kinetic_verbs: readonly string[]
    readonly forbidden_verbs_global: readonly string[]
    readonly locomotion_taxonomies: readonly string[]
}

export interface GenesisWizardInvariantRules {
    readonly max_farce_ratio_bp: number
    readonly min_grievance_depth_delta: number
    readonly global_acoustic_floor_cdb: number
    readonly voiceover_ducking_db: number
    readonly min_normalized_category_entropy_bp: number
    readonly thematic_categories: readonly string[]
}

export interface GenesisWizardMediumProjections {
    readonly target_fps: 24
    readonly audio_sample_rate_hz: 48000
    readonly tts_service_port: number
    readonly video_service_port: number
    readonly aspect_ratio: '16:9'
}

export interface AssembledFourTupleConfig {
    readonly schema_version: '1.0.0'
    readonly series_slug: string
    readonly display_name: string
    readonly genre_tag: GenreClassification
    readonly central_irony: string
    readonly state_space: GenesisWizardStateSpace
    readonly action_vocabulary: GenesisWizardActionVocabulary
    readonly invariant_rules: GenesisWizardInvariantRules
    readonly medium_projections: GenesisWizardMediumProjections
    readonly chronology?: any
}

export interface BlessedChoiceModalOptions {
    readonly promptHeader: string
    readonly choices: readonly string[]
    readonly defaultValue?: string
}

export interface BlessedInputModalOptions {
    readonly promptLabel: string
    readonly defaultValue?: string
    readonly sanitizeSlug?: boolean
}

export interface ModalPromptResult<T> {
    readonly cancelled: boolean
    readonly value: T
}

export interface GenreModalityPromptResult {
    readonly cancelled: boolean
    readonly value: GenreClassification
}
