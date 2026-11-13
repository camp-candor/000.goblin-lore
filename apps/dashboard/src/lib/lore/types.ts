export type EntityKind = 'character' | 'location' | 'item' | 'grievance' | 'mystery'

export interface LoreDossier {
    id: string
    filename: string
    entity_type: EntityKind
    title: string
    byte0Valid: boolean
    asciiValid: boolean
    prose_body: string
    rawContent: string
    // Character fields
    available_arms?: number
    available_legs?: number
    locomotion_tier?: string
    paranoia?: number
    trust?: number
    somatic_strain?: number
    banned_kinetic_verbs?: string[]
    baseline_actions?: string[]
    voice_callbacks?: string[]
    held_items?: string[]
    // Location fields
    occupancy_limit?: number
    temperature_bp?: number
    acoustic_dampening_cdb?: number
    adjacent_to?: string[]
    // Item fields
    owner_id?: string
    weight_class?: string
    occupies_hands?: number
    // Grievance fields
    min_intensity?: number
    max_intensity?: number
    intensity_bp?: number
    escalation_ceiling_bp?: number
    participants?: string[]
    spawns_on_max_escalation?: string[]
    // Mystery fields
    clue_tokens?: string[]
    trigger_lemmas?: string[]
    distorted_belief?: string
}

export interface SeriesCorpus {
    slug: string
    sourcePath: string
    dossiers: LoreDossier[]
    compiledRootHash: string | null
    compiledAt: string | null
    compiledEntityCount: number
}

export interface CorpusSnapshot {
    appName: string
    appVersion: string
    libraryVersion: string
    defaultSeries: string
    seriesList: SeriesCorpus[]
}

export interface ChoiceOption {
    id: string
    label: string
    tooltip: string
}

export interface CompileFailure {
    gate: string
    message: string
    targetFile: string
}

export interface CompileGauntletReport {
    seriesSlug: string
    durationMs: number
    catalog: {
        totalEntities: number
        characterCount: number
        locationCount: number
        possessionCount: number
        grievanceCount: number
        mysteryCount: number
    }
    invariants: {
        BYTE0: boolean
        ASCII: boolean
        SCHEMA: boolean
        SAT: boolean
        FK: boolean
        DAG: boolean
        PORTAL: boolean
        CLUE: boolean
    }
    stylometrics: {
        auditedCount: number
        lexicalDiversityBp: number
        slopViolations: number
        voiceBleedCollisions: number
    }
    failures: CompileFailure[]
    warnings: string[]
    entityHashes: Record<string, string>
    rootMerkleHash: string
    parityVerified: boolean
}

export type ConsoleTone = 'green' | 'red' | 'yellow' | 'cyan' | 'white'

export interface ConsoleLineEntry {
    id: number
    text: string
    tone: ConsoleTone
}
