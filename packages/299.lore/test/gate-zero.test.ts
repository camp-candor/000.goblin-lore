import { describe, expect, it } from 'vitest'
import { solveHandCapacitySAT } from '../12.gear.unit/buz/gear.buzz'
import { detectEscalationCycles } from '../10.escalation.unit/buz/escalation.buzz'
import { validatePortalReciprocity } from '../01.location.unit/buz/spatial.buzz'
import { verifyClueLemmaDisjointness } from '../41.canon.unit/buz/disjointness.buzz'

describe('Local Gate Zero Verification Gauntlet (T_0 = $0.00)', () => {
    it('GATE 0.1: Somatic Hand Capacity Invariant', () => {
        const intact = solveHandCapacitySAT(
            { total_arms: 2, impairment_penalty_arms: 0 },
            [{ id: 'item_spoon', occupies_hands: 1 }],
        )
        expect(intact.valid).toBe(true)

        const overload = solveHandCapacitySAT(
            { total_arms: 2, impairment_penalty_arms: 1 },
            [
                { id: 'item_spoon', occupies_hands: 1 },
                { id: 'item_thimble', occupies_hands: 1 },
            ],
        )
        expect(overload.valid).toBe(false)
    })

    it('GATE 0.2: Escalation DAG Acyclicity Invariant', () => {
        const cleanDag = {
            grv_1: ['grv_2'],
            grv_2: ['grv_3'],
            grv_3: [],
        }
        expect(detectEscalationCycles(cleanDag).hasCycle).toBe(false)

        const cyclicDag = {
            grv_1: ['grv_2'],
            grv_2: ['grv_1'],
        }
        expect(detectEscalationCycles(cyclicDag).hasCycle).toBe(true)
    })

    it('GATE 0.3: Spatial Topology Portal Reciprocity Invariant', () => {
        const reciprocalLocations: any = [
            {
                schema_version: 1,
                id: 'loc_a',
                name: 'Room A',
                max_occupancy: 2,
                ambient_noise_cdb: 1000,
                temperature_bp: 5000,
                portals: [
                    {
                        portal_id: 'prt_a_to_b',
                        target_location_id: 'loc_b',
                        target_portal_id: 'prt_b_to_a',
                        acoustic_dampening_cdb: 1000,
                        traversal_cost: 100,
                        is_passable: true,
                        is_latched: false,
                    },
                ],
            },
            {
                schema_version: 1,
                id: 'loc_b',
                name: 'Room B',
                max_occupancy: 2,
                ambient_noise_cdb: 1000,
                temperature_bp: 5000,
                portals: [
                    {
                        portal_id: 'prt_b_to_a',
                        target_location_id: 'loc_a',
                        target_portal_id: 'prt_a_to_b',
                        acoustic_dampening_cdb: 1000,
                        traversal_cost: 100,
                        is_passable: true,
                        is_latched: false,
                    },
                ],
            },
        ]

        expect(validatePortalReciprocity(reciprocalLocations).valid).toBe(true)
    })

    it('GATE 0.4: Epistemic Clue-Lemma Disjointness Invariant', () => {
        const clues = ['frost_crust', 'bitter_ash']
        const triggers = [['famine', 'poisoned', 'well']]
        expect(verifyClueLemmaDisjointness(clues, triggers).valid).toBe(true)

        const taintedClues = ['frost_crust', 'famine']
        expect(verifyClueLemmaDisjointness(taintedClues, triggers).valid).toBe(
            false,
        )
    })
})
