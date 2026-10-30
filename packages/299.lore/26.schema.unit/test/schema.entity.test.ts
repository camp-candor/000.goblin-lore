/**
 * packages/299.lore/26.schema.unit/test/schema.entity.test.ts
 *
 * Vitest verification suite for Phase 6 Entity Structural Validation Solver.
 * Asserts strict closed-set rejection, path-delimited diagnostic formatting,
 * and V8 heap deep-freeze immutability at T_0 = $0.00.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { SchemaModel } from '../schema.model'
import { validateEntity } from '../buz/validate.buzz'
import type SchemaBit from '../fce/schema.bit'

describe('26.schema.unit - Entity Structural Validation Solver', () => {
    let model: SchemaModel

    beforeEach(() => {
        model = new SchemaModel()
    })

    it('rejects unmapped entity discriminator families fail-closed (val = -1)', () => {
        const bit: SchemaBit = {
            idx: 'test-unmapped',
            src: 'unknown_species',
            dat: { id: 'alien_01' },
        }

        validateEntity(model, bit)

        expect(bit.val).toBe(-1)
        expect(bit.lst).toBeDefined()
        expect(bit.lst?.[0]).toContain('UNKNOWN_ENTITY_SCHEMA')
        expect(model.lastValidationReport?.status).toBe(-1)
        expect(model.lastValidationReport?.errors[0]).toContain(
            'UNKNOWN_ENTITY_SCHEMA',
        )
    })

    it('rejects undeclared properties via .strict() mode with path-delimited formatting', () => {
        const bit: SchemaBit = {
            idx: 'test-strict-breach',
            src: 'character',
            dat: {
                id: 'char_bog',
                title: 'Bog the Hoarder',
                somatic: {
                    arms_available: 2,
                    legs_available: 2,
                    locomotion_tier: 'BIPEDAL_HUNCHED',
                    hallucinated_teleportation: true, // Forbidden undeclared property
                },
                logistical: {},
                epistemic: {},
            },
        }

        validateEntity(model, bit)

        expect(bit.val).toBe(-1)
        expect(bit.lst).toBeDefined()
        expect(bit.lst?.some((err) => err.includes('[somatic]'))).toBe(true)
        expect(bit.lst?.some((err) => err.includes('unrecognized_keys'))).toBe(
            true,
        )
        expect(model.lastValidationReport?.status).toBe(-1)
        expect(model.validatedEntities['char_bog']).toBeUndefined()
    })

    it('rejects basis-point scalar violations exceeding 10000 or falling below 0', () => {
        const bit: SchemaBit = {
            idx: 'test-bp-overflow',
            src: 'location',
            dat: {
                location_id: 'loc_warm_pipe',
                title: 'The Warm Pipe',
                occupancy_limit: 2,
                temperature_bp: 12500, // Breaches 10000 bp ceiling
            },
        }

        validateEntity(model, bit)

        expect(bit.val).toBe(-1)
        expect(bit.lst?.some((err) => err.includes('[temperature_bp]'))).toBe(
            true,
        )
        expect(model.lastValidationReport?.status).toBe(-1)
    })

    it('enforces the Clue-Lemma Disjointness Theorem on UnresolvedMysterySchema', () => {
        const bit: SchemaBit = {
            idx: 'test-clue-disjointness',
            src: 'mystery',
            dat: {
                topic_id: 'mystery_the_famine',
                description:
                    'The bitter winter starvation under the floorboards',
                forbidden_propositions: [
                    'Bog devoured the reserved winter tallow',
                ],
                trigger_lemma_sets: [['winter', 'tallow']],
                permitted_clue_tokens: [
                    'tallow candle stump',
                    'gnawed floorboard',
                ], // 'tallow' collides
                human_promotion_condition:
                    'Showrunner explicit manual resolution decree',
            },
        }

        validateEntity(model, bit)

        expect(bit.val).toBe(-1)
        expect(
            bit.lst?.some((err) =>
                err.includes('CLUE_LEMMA_DISJOINTNESS_VIOLATION'),
            ),
        ).toBe(true)
        expect(model.lastValidationReport?.status).toBe(-1)
    })

    it('validates compliant entities, stores them in validatedEntities, and deep-freezes V8 heap', () => {
        const bit: SchemaBit = {
            idx: 'test-valid-possession',
            src: 'possession',
            dat: {
                item_id: 'item_good_silver_spoon',
                title: 'Good Silver Spoon',
                weight_class: 'SCRAP',
                occupies_hands: 1,
                bulk_units: 1,
                status_anchor: 'char_bog',
            },
        }

        validateEntity(model, bit)

        expect(bit.val).toBe(0)
        expect(bit.lst).toEqual([])
        expect(model.validatedEntities['item_good_silver_spoon']).toBeDefined()
        expect(model.lastValidationReport?.status).toBe(0)
        expect(model.lastValidationReport?.validatedCount).toBe(1)

        // Verify V8 heap immutability: attempting property assignment must throw TypeError
        const stored = model.validatedEntities['item_good_silver_spoon']
        expect(() => {
            ;(stored as any).title = 'Tampered Silver Spoon'
        }).toThrow(TypeError)
    })
})
