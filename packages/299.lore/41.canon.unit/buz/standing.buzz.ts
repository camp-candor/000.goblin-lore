import type { CanonFactStanding } from '../fce/standing.schema.js'
import type {
    ReconsiderationPriorityRecord,
    StillGoodAffirmationResult,
    default as CanonReconsiderationBit,
} from '../fce/reconsideration.bit.js'
import type { CanonModel } from '../canon.model.js'
import type State from '../../99.core/state.js'

/**
 * Calculates topological blast-radius review priority score in integer basis points.
 * Score = DaysSinceReconsideration * log10(DependentScenes + 1) * 100
 * Bounded to discrete integers to eliminate IEEE 754 float drift.
 */
export function calculateAuditPriorityScoreBps(
    daysSinceReconsideration: number,
    downstreamDependentScenes: number,
): number {
    if (!Number.isInteger(daysSinceReconsideration)) {
        throw new Error(
            '[FLOAT_PROHIBITED] daysSinceReconsideration must be an integer',
        )
    }
    if (!Number.isInteger(downstreamDependentScenes)) {
        throw new Error(
            '[FLOAT_PROHIBITED] downstreamDependentScenes must be an integer',
        )
    }
    if (daysSinceReconsideration <= 0) return 0
    if (downstreamDependentScenes < 0) return 0

    const rawScore =
        daysSinceReconsideration * Math.log10(downstreamDependentScenes + 1)
    return Math.round(rawScore * 100)
}

/**
 * Evaluates all tracked facts and returns an ordered queue of audit candidates.
 */
export function rankReconsiderationQueue(
    factCatalog:
        Map<string, CanonFactStanding> | Record<string, CanonFactStanding>,
    currentEpoch: number = 0,
    minDaysStale: number = 0,
): ReconsiderationPriorityRecord[] {
    if (!Number.isInteger(currentEpoch)) {
        throw new Error('[FLOAT_PROHIBITED] currentEpoch must be an integer')
    }

    const factList =
        factCatalog instanceof Map
            ? Array.from(factCatalog.values())
            : Object.values(factCatalog)
    const candidates: ReconsiderationPriorityRecord[] = []
    const secondsPerDay = 86400

    for (const fact of factList) {
        if (fact.standing === 'DEPRECATED_ARCHIVED') continue

        const elapsedSeconds = Math.max(
            0,
            currentEpoch - fact.last_reviewed_epoch,
        )
        const daysStale = Math.max(
            fact.days_since_reconsideration,
            Math.floor(elapsedSeconds / secondsPerDay),
        )

        if (
            daysStale >= minDaysStale ||
            fact.standing === 'FLAGGED_FOR_REVIEW'
        ) {
            const scoreBps = calculateAuditPriorityScoreBps(
                daysStale,
                fact.in_degree_count,
            )
            const isMonolithicSpine =
                fact.in_degree_count >= 12 && daysStale > 60

            candidates.push({
                fact_id: fact.fact_id,
                entity_id: fact.entity_id,
                standing: fact.standing,
                in_degree_count: fact.in_degree_count,
                days_since_reconsideration: daysStale,
                priority_score_bps: scoreBps,
                is_monolithic_spine: isMonolithicSpine,
            })
        }
    }

    return candidates.sort((a, b) => {
        if (b.priority_score_bps !== a.priority_score_bps) {
            return b.priority_score_bps - a.priority_score_bps
        }
        return a.fact_id.localeCompare(b.fact_id)
    })
}

/**
 * Executes the 5-second "Still Good" re-affirmation protocol.
 * Resets stale duration, preserves version, and triggers zero cascades.
 */
export function affirmStillGood(
    factCatalog: Map<string, CanonFactStanding>,
    factId: string,
    affirmationEpoch: number = 0,
): StillGoodAffirmationResult {
    if (!Number.isInteger(affirmationEpoch)) {
        throw new Error(
            '[FLOAT_PROHIBITED] affirmationEpoch must be an integer',
        )
    }

    const existing = factCatalog.get(factId)
    if (!existing) {
        throw new Error(
            `[FACT_NOT_FOUND] Cannot affirm non-existent fact '${factId}'`,
        )
    }

    const previousStanding = existing.standing
    existing.last_reviewed_epoch = affirmationEpoch
    existing.days_since_reconsideration = 0

    if (existing.standing === 'FLAGGED_FOR_REVIEW') {
        existing.standing = 'ACTIVE_ENDORSED'
    }

    return {
        success: true,
        fact_id: factId,
        version_bumped: false,
        cascade_triggered: false,
        updated_last_reviewed_epoch: affirmationEpoch,
        previous_standing: previousStanding,
        current_standing: existing.standing,
    }
}

export const rankReconsiderationQueueAction = (
    cpy: CanonModel,
    bal: CanonReconsiderationBit,
    ste?: State,
): CanonModel => {
    const dat = bal?.dat
    const currentEpoch = dat?.currentEpoch ?? 0
    const minDaysStale = dat?.minDaysStale ?? 0

    const queue = rankReconsiderationQueue(
        cpy.factStandings,
        currentEpoch,
        minDaysStale,
    )

    if (bal?.slv) {
        bal.slv({
            canBit: {
                idx: 'rank-reconsideration-queue',
                val: 0,
                dat: queue,
            },
        })
    }
    return cpy
}

export const affirmStillGoodAction = (
    cpy: CanonModel,
    bal: CanonReconsiderationBit,
    ste?: State,
): CanonModel => {
    const dat = bal?.dat
    if (!dat || !dat.factId) {
        if (bal?.slv) {
            bal.slv({
                canBit: {
                    idx: 'affirm-still-good-err',
                    val: -1,
                    dat: {
                        success: false,
                        fact_id: '',
                        version_bumped: false,
                        cascade_triggered: false,
                        updated_last_reviewed_epoch: 0,
                        previous_standing: 'ACTIVE_ENDORSED',
                        current_standing: 'ACTIVE_ENDORSED',
                    },
                },
            })
        }
        return cpy
    }

    try {
        const res = affirmStillGood(
            cpy.factStandings,
            dat.factId,
            dat.currentEpoch ?? 0,
        )
        if (bal?.slv) {
            bal.slv({
                canBit: {
                    idx: 'affirm-still-good',
                    val: 0,
                    dat: res,
                },
            })
        }
    } catch (err: any) {
        if (bal?.slv) {
            bal.slv({
                canBit: {
                    idx: 'affirm-still-good-fail',
                    val: -1,
                    dat: {
                        success: false,
                        fact_id: dat.factId,
                        version_bumped: false,
                        cascade_triggered: false,
                        updated_last_reviewed_epoch: 0,
                        previous_standing: 'ACTIVE_ENDORSED',
                        current_standing: 'ACTIVE_ENDORSED',
                    },
                },
            })
        }
    }
    return cpy
}
