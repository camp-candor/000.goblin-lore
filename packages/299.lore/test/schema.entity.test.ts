/**
 * packages/299.lore/test/schema.entity.test.ts
 *
 * Vitest verification suite for Phase 11 Task 11.1: Structural Entity Invalidation Gauntlet.
 * Asserts strict closed-set schema routing, dot-notation diagnostic error formatting,
 * and V8 heap deep-freeze immutability at T_0 = $0.00.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { SchemaModel } from '../26.schema.unit/schema.model'
import {
    validateEntity,
    SCHEMA_ROUTER,
} from '../26.schema.unit/buz/validate.buzz'
import type SchemaBit from '../26.schema.unit/fce/schema.bit'

describe('299.lore - Task 11.1 Structural Entity Invalidation Gauntlet', () => {
    let model: SchemaModel

    beforeEach(() => {
        model = new SchemaModel()
    })

    it('validates compliant Character, Location, Possession, Grievance, and Mystery payloads', () => {
        const validManifests: Record<string, any> = {
            character: {
                id: 'char_bog',
                title: 'Bog the Hoarder',
                somatic: {
                    arms_available: 2,
                    legs_available: 2,
                    locomotion_tier: 'BIPEDAL_HUNCHED',
                    banned_verbs: ['SPRINT', 'VAULT'],
                },
                logistical: {
                    held_primary: 'item_spoon',
                },
                epistemic: {
                    paranoia_bp: 2500,
                },
            },
            location: {
                location_id: 'loc_warm_pipe',
                title: 'The Warm Pipe',
                occupancy_limit: 2,
                temperature_bp: 5000,
            },
            possession: {
                item_id: 'item_spoon',
                title: 'Silver Spoon',
                weight_class: 'SCRAP',
                occupies_hands: 1,
            },
            grievance: {
                id: 'grv_stolen_tallow',
                title: 'Stolen Winter Tallow',
                category: 'RESOURCE_HOARDING',
                participants_primary: ['char_bog', 'char_wart'],
                outcomes: {
                    clean_win: {
                        mechanics: 'Yields tallow',
                        somatic_cost_bp: 0,
                    },
                    costly_win: {
                        mechanics: 'Loses joint mobility',
                        somatic_cost_bp: 500,
                    },
                    mutual_wound: {
                        mechanics: 'Broken fingers',
                        somatic_cost_bp: 1200,
                    },
                    backfire: {
                        mechanics: 'Trapped in grate',
                        somatic_cost_bp: 2000,
                    },
                },
            },
            mystery: {
                topic_id: 'mystery_the_culvert',
                description: 'The cold poison dumped into the iron culvert',
                forbidden_propositions: ['Bog tipped the lye bucket'],
                trigger_lemma_sets: [['poison', 'culvert']],
                permitted_clue_tokens: ['empty jar', 'white residue'],
                human_promotion_condition: 'Showrunner manual executive review',
            },
        }

        for (const [entityFamily, payload] of Object.entries(validManifests)) {
            const bit: SchemaBit = {
                idx: `test-${entityFamily}`,
                src: entityFamily,
                dat: payload,
            }

            validateEntity(model, bit)

            expect(bit.val).toBe(0)
            expect(bit.lst).toEqual([])
            expect(model.lastValidationReport?.status).toBe(0)
        }

        expect(Object.keys(model.validatedEntities).length).toBe(5)
    })

    it('rejects unknown entity discriminator keys fail-closed with val: -1', () => {
        const bit: SchemaBit = {
            idx: 'test-unknown-discriminator',
            src: 'invalid_type',
            dat: { id: 'unknown_01' },
        }

        validateEntity(model, bit)

        expect(bit.val).toBe(-1)
        expect(bit.lst?.[0]).toContain('UNKNOWN_ENTITY_SCHEMA')
        expect(model.lastValidationReport?.status).toBe(-1)
    })

    it('rejects payloads containing undeclared keys in strict mode', () => {
        const bit: SchemaBit = {
            idx: 'test-strict-violation',
            src: 'character',
            dat: {
                id: 'char_rogue',
                title: 'Rogue Infiltrator',
                somatic: {
                    arms_available: 2,
                    legs_available: 2,
                    locomotion_tier: 'BIPEDAL_NIMBLE',
                    unauthorized_cybernetic_limb: true,
                },
                logistical: {},
                epistemic: {},
            },
        }

        validateEntity(model, bit)

        expect(bit.val).toBe(-1)
        expect(bit.lst?.some((err) => err.includes('unrecognized_keys'))).toBe(
            true,
        )
        expect(model.validatedEntities['char_rogue']).toBeUndefined()
    })

    it('rejects basis points exceeding 10000 or falling below 0', () => {
        const bit: SchemaBit = {
            idx: 'test-bp-overflow',
            src: 'location',
            dat: {
                location_id: 'loc_boiling_flue',
                title: 'The Boiling Flue',
                occupancy_limit: 1,
                temperature_bp: 12500,
            },
        }

        validateEntity(model, bit)

        expect(bit.val).toBe(-1)
        expect(bit.lst?.some((err) => err.includes('[temperature_bp]'))).toBe(
            true,
        )
    })

    it('asserts that successfully validated payloads are deep-frozen and throw TypeError upon mutation', () => {
        const bit: SchemaBit = {
            idx: 'test-freeze-lock',
            src: 'possession',
            dat: {
                item_id: 'item_copper_nail',
                title: 'Bent Copper Nail',
                weight_class: 'SCRAP',
                occupies_hands: 1,
            },
        }

        validateEntity(model, bit)

        expect(bit.val).toBe(0)
        const sealedRecord = model.validatedEntities['item_copper_nail']
        expect(sealedRecord).toBeDefined()

        expect(() => {
            sealedRecord.title = 'Mutated Nail'
        }).toThrow(TypeError)
    })
})
