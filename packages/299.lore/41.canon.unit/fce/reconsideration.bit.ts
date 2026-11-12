import type { EpistemologicalStanding } from './standing.schema.js'

export interface ReconsiderationPriorityRecord {
    fact_id: string
    entity_id: string
    standing: EpistemologicalStanding
    in_degree_count: number
    days_since_reconsideration: number
    priority_score_bps: number
    is_monolithic_spine: boolean
}

export interface StillGoodAffirmationResult {
    success: boolean
    fact_id: string
    version_bumped: boolean
    cascade_triggered: boolean
    updated_last_reviewed_epoch: number
    previous_standing: EpistemologicalStanding
    current_standing: EpistemologicalStanding
}

export default interface CanonReconsiderationBit {
    idx: string
    src?: string
    val?: number
    dat?: {
        currentEpoch?: number
        factId?: string
        minDaysStale?: number
    }
    slv?: (result: {
        canBit: {
            idx: string
            val: number
            dat: ReconsiderationPriorityRecord[] | StillGoodAffirmationResult
        }
    }) => void
}
