/**
 * packages/299.lore/test/schema.somatic.test.ts
 *
 * Vitest verification suite for Phase 11 Task 11.2: Biological Hand Saturation Proofs.
 * Asserts anatomical limb capacity bounds, trauma condition deductions,
 * and kinetic motor mask set-intersection exclusions at T_0 = $0.00.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { SchemaModel } from '../26.schema.unit/schema.model'
import { solveSomaticSAT } from '../26.schema.unit/buz/somatic-sat.buzz'
import type SchemaBit from '../26.schema.unit/fce/schema.bit'

describe('299.lore - Task 11.2 Biological Hand Saturation Proofs Verification', () => {
    let model: SchemaModel

    beforeEach(() => {
        model = new SchemaModel()
    })

    it('permits dual-handed item equipping by a character with two functional arms', () => {
        const bit: SchemaBit = {
            idx: 'test-sat-dual-intact',
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
                        banned_verbs: [],
                    },
                    logistical: {
                        held_primary: 'item_spoon',
                        held_secondary: 'item_tallow_tin',
                    },
                    epistemic: {},
                },
                possessions: {
                    item_spoon: { occupies_hands: 1 },
                    item_tallow_tin: { occupies_hands: 1 },
                },
            },
        }

        solveSomaticSAT(model, bit)

        expect(bit.val).toBe(0)
        expect(bit.lst).toEqual([])
        expect(bit.dat?.satisfied).toBe(true)
        expect(bit.dat?.netArmsAvailable).toBe(2)
        expect(bit.dat?.requiredHands).toBe(2)
    })

    it('fails with [SOMATIC_OVERLOAD] when Wart attempts two-hand loadout with severed plexus penalty', () => {
        const bit: SchemaBit = {
            idx: 'test-sat-wart-overload',
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
                        banned_verbs: [],
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

    it('permits single-hand tool equipping combined with a lower limb action like KICK', () => {
        const bit: SchemaBit = {
            idx: 'test-sat-single-hand-kick',
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
                        banned_verbs: [],
                    },
                    logistical: {
                        held_primary: 'item_iron_key',
                        held_secondary: null,
                    },
                    epistemic: {},
                },
                possessions: {
                    item_iron_key: { occupies_hands: 1 },
                },
                condition_penalties: {
                    cond_brachial_plexus_severed_left: 1,
                },
                proposedActions: ['KICK'],
            },
        }

        solveSomaticSAT(model, bit)

        expect(bit.val).toBe(0)
        expect(bit.lst).toEqual([])
        expect(bit.dat?.satisfied).toBe(true)
    })

    it('halts with [SOMATIC_MOTOR_BREACH] when character executes a banned verb declared in conditions or tier', () => {
        const bit: SchemaBit = {
            idx: 'test-sat-motor-breach',
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
                        banned_verbs: [],
                    },
                    logistical: {},
                    epistemic: {},
                },
                proposedActions: ['SPRINT'],
            },
        }

        solveSomaticSAT(model, bit)

        expect(bit.val).toBe(-1)
        expect(bit.lst?.[0]).toContain('[SOMATIC_MOTOR_BREACH]')
        expect(bit.lst?.[0]).toContain(
            "Character 'char_bog' attempted banned kinetic verb 'SPRINT'",
        )
    })

    it('bubbles up diagnostic errors cleanly in bal.lst without throwing unhandled exceptions', () => {
        const bit: SchemaBit = {
            idx: 'test-sat-malformed',
            src: 'somatic_sat',
            dat: {
                character: {
                    id: 'char_invalid',
                    // Missing somatic block entirely
                },
            },
        }

        expect(() => solveSomaticSAT(model, bit)).not.toThrow()
        expect(bit.val).toBe(-1)
        expect(bit.lst).toBeDefined()
        expect(bit.lst!.length).toBeGreaterThan(0)
    })
})
