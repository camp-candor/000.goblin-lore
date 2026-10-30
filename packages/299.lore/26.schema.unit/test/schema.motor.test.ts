/**
 * packages/299.lore/26.schema.unit/test/schema.motor.test.ts
 *
 * Vitest verification suite for Phase 8 Kinetic Motor Mask Exclusion Solver.
 * Asserts locomotion tier exclusions, condition verb injections,
 * and O(1) set-intersection enforcement at T_0 = $0.00.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { SchemaModel } from '../schema.model'
import { solveSomaticSAT } from '../buz/somatic-sat.buzz'
import type SchemaBit from '../fce/schema.bit'

describe('26.schema.unit - Kinetic Motor Mask Exclusion Solver', () => {
    let model: SchemaModel

    beforeEach(() => {
        model = new SchemaModel()
    })

    it('permits compliant kinetic actions outside the banned mask', () => {
        const bit: SchemaBit = {
            idx: 'test-motor-pass',
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
                        held_primary: 'item_grease_bucket',
                        held_secondary: null,
                    },
                    epistemic: {},
                },
                possessions: {
                    item_grease_bucket: { occupies_hands: 1 },
                },
                condition_penalties: {
                    cond_brachial_plexus_severed_left: 1,
                },
                proposedActions: ['KICK', 'SCUTTLE'],
            },
        }

        solveSomaticSAT(model, bit)

        expect(bit.val).toBe(0)
        expect(bit.lst).toEqual([])
        expect(bit.dat?.satisfied).toBe(true)
        expect(bit.dat?.compiledBannedVerbs).toContain('BIMANUAL_LIFT')
        expect(bit.dat?.compiledBannedVerbs).toContain('SPRINT')
    })

    it('rejects high-energy locomotion forbidden by locomotion tier (BIPEDAL_HUNCHED -> SPRINT)', () => {
        const bit: SchemaBit = {
            idx: 'test-motor-locomotion-breach',
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
                        held_primary: null,
                        held_secondary: null,
                    },
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

    it('rejects bimanual actions when net functional arms are less than two', () => {
        const bit: SchemaBit = {
            idx: 'test-motor-bimanual-breach',
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
                        held_primary: null,
                        held_secondary: null,
                    },
                    epistemic: {},
                },
                condition_penalties: {
                    cond_brachial_plexus_severed_left: 1,
                },
                proposedActions: ['BIMANUAL_LIFT'],
            },
        }

        solveSomaticSAT(model, bit)

        expect(bit.val).toBe(-1)
        expect(bit.lst?.[0]).toContain('[SOMATIC_MOTOR_BREACH]')
        expect(bit.lst?.[0]).toContain(
            "attempted banned kinetic verb 'BIMANUAL_LIFT'",
        )
    })

    it('rejects explicit verbs injected via condition_banned_verbs payload map', () => {
        const bit: SchemaBit = {
            idx: 'test-motor-condition-injection',
            src: 'somatic_sat',
            dat: {
                character: {
                    id: 'char_spleen',
                    title: 'Spleen the Scavenger',
                    somatic: {
                        arms_available: 2,
                        legs_available: 2,
                        locomotion_tier: 'BIPEDAL_NIMBLE',
                        conditions: ['cond_cracked_ribs'],
                        banned_verbs: [],
                    },
                    logistical: {
                        held_primary: null,
                        held_secondary: null,
                    },
                    epistemic: {},
                },
                condition_banned_verbs: {
                    cond_cracked_ribs: ['VAULT', 'STRANGLE'],
                },
                proposedActions: ['VAULT'],
            },
        }

        solveSomaticSAT(model, bit)

        expect(bit.val).toBe(-1)
        expect(bit.lst?.[0]).toContain('[SOMATIC_MOTOR_BREACH]')
        expect(bit.lst?.[0]).toContain(
            "Character 'char_spleen' attempted banned kinetic verb 'VAULT'",
        )
    })

    it('halts with [SOMATIC_MOTOR_BREACH] on IMMOBILE character attempting physical scuttle', () => {
        const bit: SchemaBit = {
            idx: 'test-motor-immobile-breach',
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
                        banned_verbs: [],
                    },
                    logistical: {
                        held_primary: null,
                        held_secondary: null,
                    },
                    epistemic: {},
                },
                proposedActions: ['SCUTTLE'],
            },
        }

        solveSomaticSAT(model, bit)

        expect(bit.val).toBe(-1)
        expect(bit.lst?.[0]).toContain('[SOMATIC_MOTOR_BREACH]')
        expect(bit.lst?.[0]).toContain(
            "attempted banned kinetic verb 'SCUTTLE'",
        )
    })
})
