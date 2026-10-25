/**
 * packages/299.lore/13.grievance.unit/fce/grievanceScaffold.bit.ts
 * Data transport contracts for the Interactive Grievance Scaffolding Interview.
 * Pure 7-bit clean ASCII.
 */
export interface TypedSpawnTarget {
    type: 'grievance' | 'secret'
    target_id: string
}

export interface GrievanceScaffoldInput {
    seriesSlug?: string
    grvId?: string
    title?: string
    category?: string
    participantsPrimary?: [string, string]
    participantsCanInvolve?: string[]
    participantsCannotInvolve?: string[]
    intensityFloor?: number
    intensityCeiling?: number
    cooldownCycles?: number
    decayRate?: 'fast' | 'medium' | 'slow' | 'none'
    tonalOverrideEligible?: boolean
    physicalAnchorProp?: string
    spawnsOnMaxEscalation?: TypedSpawnTarget | null
}

export interface GrievanceScaffoldResult {
    success: boolean
    filePath?: string
    grvId?: string
    category?: string
    participants?: [string, string]
    error?: string
}

export default interface GrievanceScaffoldBit {
    idx: string
    src?: string
    val?: number
    dat?: GrievanceScaffoldInput
    slv?: (value: GrievanceScaffoldResult) => void
}
