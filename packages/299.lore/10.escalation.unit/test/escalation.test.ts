import { describe, expect, it } from 'vitest'
import {
    computeTopologicalDepth,
    detectEscalationCycles,
} from '../buz/escalation.buzz'

describe('detectEscalationCycles', () => {
    it('certifies clean acyclic grievance spawn lattice', () => {
        const dag = {
            grv_spoon_credit: ['grv_hoarding_reveal'],
            grv_hoarding_reveal: ['grv_generational_famine_feud'],
            grv_generational_famine_feud: [],
        }

        const res = detectEscalationCycles(dag)
        expect(res.hasCycle).toBe(false)
        expect(res.cyclePath).toBeUndefined()
    })

    it('detects immediate two-node recursive spawn loop', () => {
        const cyclic = {
            grv_a: ['grv_b'],
            grv_b: ['grv_a'],
        }

        const res = detectEscalationCycles(cyclic)
        expect(res.hasCycle).toBe(true)
        expect(res.cyclePath).toBeDefined()
        expect(res.cyclePath).toEqual(['grv_a', 'grv_b', 'grv_a'])
    })

    it('detects indirect multi-hop cycle', () => {
        const cyclic = {
            grv_1: ['grv_2'],
            grv_2: ['grv_3'],
            grv_3: ['grv_4'],
            grv_4: ['grv_2'],
        }

        const res = detectEscalationCycles(cyclic)
        expect(res.hasCycle).toBe(true)
        expect(res.cyclePath).toBeDefined()
        expect(res.cyclePath).toEqual(['grv_2', 'grv_3', 'grv_4', 'grv_2'])
    })

    it('permits confluent diamond dependencies without false positives', () => {
        const diamond = {
            grv_root: ['grv_left', 'grv_right'],
            grv_left: ['grv_climax'],
            grv_right: ['grv_climax'],
            grv_climax: [],
        }

        const res = detectEscalationCycles(diamond)
        expect(res.hasCycle).toBe(false)
    })
})

describe('computeTopologicalDepth', () => {
    it('correctly assigns sequential integer depth ranks', () => {
        const dag = {
            grv_root: ['grv_step1'],
            grv_step1: ['grv_climax'],
            grv_climax: [],
        }

        const depths = computeTopologicalDepth(dag)
        expect(depths['grv_root']).toBe(0)
        expect(depths['grv_step1']).toBe(1)
        expect(depths['grv_climax']).toBe(2)
    })
})
