import { BeliefRecord, WorldFactStanding } from '../val/beliefRecord.val'

export type EpistemicAlignment =
    | 'ALIGNED_TRUE'
    | 'ALIGNED_FALSE'
    | 'FALSE_BELIEF'
    | 'FALSE_DISBELIEF'
    | 'DISPUTED_UNCERTAINTY'
    | 'UNRESOLVED_CANON_IMMUNITY'

export interface BeliefDivergenceReceiptBit {
    readonly valid: boolean
    readonly belief_id: string
    readonly holder_id: string
    readonly proposition_slug: string
    readonly subjective_confidence_bps: number
    readonly canonical_standing: WorldFactStanding
    readonly alignment: EpistemicAlignment
    readonly creates_dramatic_irony: boolean
    readonly detail: string
}

export default interface BeliefRecordRegistry {
    idx: string
    beliefs: Record<string, BeliefRecord>
}
