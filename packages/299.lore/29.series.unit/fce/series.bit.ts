import type ArchetypeBit from './archetype.bit.js'

export default interface SeriesBit {
    idx: string
    src?: string
    val?: number
    dat?: any
    archetype?: ArchetypeBit
    slv?: (result: any) => void
}
