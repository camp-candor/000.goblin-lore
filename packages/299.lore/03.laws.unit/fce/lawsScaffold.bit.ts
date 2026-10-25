/**
 * packages/299.lore/03.laws.unit/fce/lawsScaffold.bit.ts
 * Data transport contracts for the Interactive World Axiom Scaffolding Interview.
 * Pure 7-bit clean ASCII.
 */
export type EpistemicHorizonEnum =
    | 'TOTAL_IGNORANCE'
    | 'RUMOR_ONLY'
    | 'FALSE_BELIEF'
    | 'PARTIAL_FACT'
    | 'WITHHELD'
    | 'FACTUAL_WITNESS'

export interface WorldAxiomScaffoldInput {
    seriesSlug?: string
    axiomId?: string
    name?: string
    domain?:
        | 'PHYSICAL_METAPHYSICAL'
        | 'SOCIOLOGICAL_TABOO'
        | 'ECONOMIC_SCARCITY'
        | 'EPISTEMIC_MYSTERY'
    epoch?: string
    dominantFactions?: string[]
    axioms?: string[]
    epistemicDefault?: EpistemicHorizonEnum
    clueTokens?: string[]
    forbiddenConclusionLemmas?: string[]
}

export interface WorldAxiomScaffoldResult {
    success: boolean
    filePath?: string
    axiomId?: string
    epoch?: string
    axiomsCount?: number
    error?: string
}

export default interface LawsScaffoldBit {
    idx: string
    src?: string
    val?: number
    dat?: WorldAxiomScaffoldInput
    slv?: (value: WorldAxiomScaffoldResult) => void
}
