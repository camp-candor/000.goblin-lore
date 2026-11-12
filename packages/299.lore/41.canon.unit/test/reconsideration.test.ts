import { describe, it, expect } from 'vitest'
import {
    calculateAuditPriorityScoreBps,
    rankReconsiderationQueue,
    affirmStillGood,
} from '../buz/standing.buzz.js'
import type { CanonFactStanding } from '../fce/standing.schema.js'

describe('41.canon.unit :: Still-Good Reconsideration Priority Calculator & Protocol', () => {
    it('calculates audit priority score using integer basis points without float drift', () => {
        // 90 days stale, 42 dependent scenes
        // log10(43) = 1.6334684555793223
        // 90 * 1.6334684555793223 * 100 = 14701.216 -> Math.round -> 14701 bps
        const scoreBps = calculateAuditPriorityScoreBps(90, 42)
        expect(scoreBps).toBe(14701)
        expect(Number.isInteger(scoreBps)).toBe(true)

        // 0 days stale yields strictly 0 score
        expect(calculateAuditPriorityScoreBps(0, 10)).toBe(0)
    })

    it('rejects floating-point numbers in priority score calculator', () => {
        expect(() => calculateAuditPriorityScoreBps(90.5, 42)).toThrow(
            /FLOAT_PROHIBITED/,
        )
        expect(() => calculateAuditPriorityScoreBps(90, 42.2)).toThrow(
            /FLOAT_PROHIBITED/,
        )
    })

    it('ranks facts descending by priority score and identifies monolithic spines', () => {
        const catalog = new Map<string, CanonFactStanding>([
            [
                'fact_isolated_leaf',
                {
                    fact_id: 'fact_isolated_leaf',
                    entity_id: 'char_bog',
                    standing: 'ACTIVE_ENDORSED',
                    in_degree_count: 0,
                    days_since_reconsideration: 90,
                    last_reviewed_epoch: 0,
                },
            ],
            [
                'fact_monolithic_spine',
                {
                    fact_id: 'fact_monolithic_spine',
                    entity_id: 'char_wart',
                    standing: 'ACTIVE_ENDORSED',
                    in_degree_count: 42,
                    days_since_reconsideration: 90,
                    last_reviewed_epoch: 0,
                },
            ],
            [
                'fact_active_fresh',
                {
                    fact_id: 'fact_active_fresh',
                    entity_id: 'loc_culvert_siphon',
                    standing: 'ACTIVE_ENDORSED',
                    in_degree_count: 15,
                    days_since_reconsideration: 5,
                    last_reviewed_epoch: 0,
                },
            ],
        ])

        const queue = rankReconsiderationQueue(catalog, 0, 0)
        expect(queue).toHaveLength(3)

        // Highest reach unreviewed fact surfaces at top
        expect(queue[0].fact_id).toBe('fact_monolithic_spine')
        expect(queue[0].is_monolithic_spine).toBe(true)
        expect(queue[0].priority_score_bps).toBe(14701)

        // Isolated leaf node has 0 score (log10(1) = 0)
        expect(queue[1].fact_id).toBe('fact_active_fresh')
        expect(queue[2].fact_id).toBe('fact_isolated_leaf')
        expect(queue[2].priority_score_bps).toBe(0)
        expect(queue[2].is_monolithic_spine).toBe(false)
    })

    it('proves the "Still Good" protocol: resets age, preserves version, and triggers zero cascades', () => {
        const catalog = new Map<string, CanonFactStanding>([
            [
                'fact_load_bearing_anchor',
                {
                    fact_id: 'fact_load_bearing_anchor',
                    entity_id: 'char_wart',
                    standing: 'FLAGGED_FOR_REVIEW',
                    in_degree_count: 38,
                    days_since_reconsideration: 75,
                    last_reviewed_epoch: 0,
                },
            ],
        ])

        const result = affirmStillGood(
            catalog,
            'fact_load_bearing_anchor',
            86400 * 75,
        )

        expect(result.success).toBe(true)
        expect(result.version_bumped).toBe(false)
        expect(result.cascade_triggered).toBe(false)
        expect(result.previous_standing).toBe('FLAGGED_FOR_REVIEW')
        expect(result.current_standing).toBe('ACTIVE_ENDORSED')

        const affirmed = catalog.get('fact_load_bearing_anchor')!
        expect(affirmed.days_since_reconsideration).toBe(0)
        expect(affirmed.last_reviewed_epoch).toBe(86400 * 75)
        expect(affirmed.standing).toBe('ACTIVE_ENDORSED')
    })

    it('rejects affirmation for non-existent facts', () => {
        const catalog = new Map<string, CanonFactStanding>()
        expect(() => affirmStillGood(catalog, 'fact_ghost', 1000)).toThrow(
            /FACT_NOT_FOUND/,
        )
    })
})
