import type {
    SomaticArchetype,
    SomaticDelta,
    ResolvedSomaticProfile,
} from '../val/archetype.val.js'

export default interface ArchetypeBit {
    idx: string
    src?: string
    val?: number
    dat?: {
        archetypeId?: string
        archetype?: SomaticArchetype
        delta?: SomaticDelta
        resolvedProfile?: ResolvedSomaticProfile
        isValid?: boolean
        error?: string
    }
    slv?: (result: any) => void
}
