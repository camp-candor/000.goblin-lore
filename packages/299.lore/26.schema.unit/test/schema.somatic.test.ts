/**
 * packages/299.lore/26.schema.unit/test/schema.somatic.test.ts
 *
 * Vitest verification suite for Phase 7 Somatic Capability Satisfiability Solver.
 * Asserts anatomical limb arithmetic, hand-capacity bounds, and zero-spend clearance.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { SchemaModel } from '../schema.model'
import { solveSomaticSAT } from '../buz/somatic-sat.buzz'
import type SchemaBit from '../fce/schema.bit'

describe('26.schema.unit - Somatic Capability Satisfiability Solver', () => {
    let model: SchemaModel

    beforeEach(() => {
        model = new SchemaModel()
    })

    it('rejects invalid or missing character payloads fail-closed (val = -1)', () => {
        const bit: SchemaBit = {
            idx: 'test-sat-empty',
            src: 'somatic_sat',
            dat: null,
        }

        solveSomaticSAT(model, bit)

        expect(bit.val).toBe(-1)
        expect(bit.lst?.[0]).toContain('INVALID_SOMATIC_SAT_PAYLOAD')
    })

    it('permits dual-hand loadout for an actor with two intact functional arms', () => {
        const bit: SchemaBit = {
            idx: 'test-sat-dual-wield-intact',
            src: 'somatic_sat',
            dat: {
                character: {
                    id: 'char_bog',
                    title: 'Bog the Hoarder',
                    somatic: {
                        arms_available: 2,
                        legs_available: 2,
                        locomotion_tier: 'BIPEDAL_HUNCHED',
                        conditions: [],
                    },
                    logistical: {
                        held_primary: 'item_silver_spoon',
                        held_secondary: 'item_tallow_tin',
                    },
                    epistemic: {},
                },
                possessions: {
                    item_silver_spoon: { occupies_hands: 1 },
                    item_tallow_tin: { occupies_hands: 1 },
                },
            },
        }

        solveSomaticSAT(model, bit)

        expect(bit.val).toBe(0)
        expect(bit.lst).toEqual([])
        expect(bit.dat?.netArmsAvailable).toBe(2)
        expect(bit.dat?.requiredHands).toBe(2)
        expect(bit.dat?.satisfied).toBe(true)
    })

    it('fails with [SOMATIC_OVERLOAD] when an amputee attempts to hold two single-handed items', () => {
        const bit: SchemaBit = {
            idx: 'test-sat-amputee-dual-overload',
            src: 'somatic_sat',
            dat: {
                character: {
                    id: 'char_wart',
                    title: 'Wart the Mender',
                    somatic: {
                        arms_available: 2,
                        legs_available: 2,
                        locomotion_tier: 'BIPEDAL_LIMPING',
                        conditions: ['cond_brachial_plexus_severed_left'],
                    },
                    logistical: {
                        held_primary: 'item_iron_key',
                        held_secondary: 'item_grease_bucket',
                    },
                    epistemic: {},
                },
                possessions: {
                    item_iron_key: { occupies_hands: 1 },
                    item_grease_bucket: { occupies_hands: 1 },
                },
                condition_penalties: {
                    cond_brachial_plexus_severed_left: 1,
                },
            },
        }

        solveSomaticSAT(model, bit)

        expect(bit.val).toBe(-1)
        expect(bit.lst?.[0]).toContain('[SOMATIC_OVERLOAD]')
        expect(bit.lst?.[0]).toContain(
            'demands 2 hands for held items, but possesses only 1 net functional arms',
        )
    })

    it('fails with [SOMATIC_OVERLOAD] when an intact character attempts to wield a two-handed tool with a second item', () => {
        const bit: SchemaBit = {
            idx: 'test-sat-three-hand-demand',
            src: 'somatic_sat',
            dat: {
                character: {
                    id: 'char_spleen',
                    title: 'Spleen the Scavenger',
                    somatic: {
                        arms_available: 2,
                        legs_available: 2,
                        locomotion_tier: 'BIPEDAL_NIMBLE',
                        conditions: [],
                    },
                    logistical: {
                        held_primary: 'item_two_handed_prybar',
                        held_secondary: 'item_lantern',
                    },
                    epistemic: {},
                },
                possessions: {
                    item_two_handed_prybar: { occupies_hands: 2 },
                    item_lantern: { occupies_hands: 1 },
                },
            },
        }

        solveSomaticSAT(model, bit)

        expect(bit.val).toBe(-1)
        expect(bit.lst?.[0]).toContain('[SOMATIC_OVERLOAD]')
        expect(bit.lst?.[0]).toContain(
            'demands 3 hands for held items, but possesses only 2 net functional arms',
        )
    })

    it('clamps net functional arms to zero if locomotion tier is IMMOBILE', () => {
        const bit: SchemaBit = {
            idx: 'test-sat-immobile-clamp',
            src: 'somatic_sat',
            dat: {
                character: {
                    id: 'char_mum_grissel',
                    title: 'Mum Grissel',
                    somatic: {
                        arms_available: 2,
                        legs_available: 0,
                        locomotion_tier: 'IMMOBILE',
                        conditions: [],
                    },
                    logistical: {
                        held_primary: 'item_pipe',
                        held_secondary: null,
                    },
                    epistemic: {},
                },
                possessions: {
                    item_pipe: { occupies_hands: 1 },
                },
            },
        }

        solveSomaticSAT(model, bit)

        expect(bit.val).toBe(-1)
        expect(bit.lst?.[0]).toContain('[SOMATIC_OVERLOAD]')
        expect(bit.lst?.[0]).toContain(
            'demands 1 hands for held items, but possesses only 0 net functional arms',
        )
    })
})
