/**
 * packages/299.lore/01.location.unit/fce/locationScaffold.bit.ts
 * Data transport contracts for the Interactive Location Scaffolding Interview.
 * Pure 7-bit clean ASCII.
 */
export interface LocationScaffoldInput {
    seriesSlug?: string
    locId?: string
    name?: string
    maxAdultGoblins?: number
    acousticDampingCdB?: number
    ambientNoiseCdB?: number
    volumeProfile?: string
    connectedLocations?: string[]
    reconcileReciprocalLinks?: boolean
}

export interface LocationScaffoldResult {
    success: boolean
    filePath?: string
    locId?: string
    reconciledTargets?: string[]
    error?: string
}

export default interface LocationScaffoldBit {
    idx: string
    src?: string
    val?: number
    dat?: LocationScaffoldInput
    slv?: (value: LocationScaffoldResult) => void
}
