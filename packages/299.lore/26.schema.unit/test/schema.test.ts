import { describe, expect, it } from 'vitest'
import { SchemaModel } from '../schema.model'
import { validateEntity } from '../buz/validate.buzz'
import { solveSomaticSAT } from '../buz/somatic-sat.buzz'
import { deepFreeze } from '../buz/freeze.buzz'

describe('26.schema.unit: Invariant Solvers & Immutability', () => {
    const mockState: any = {
        hunt: async () => ({}),
    }

    it('deepFreeze enforces complete in-memory property immutability', () => {
        const raw = { prop: 'initial', nested: { count: 1 } }
        const frozen = deepFreeze(raw)

        expect(Object.isFrozen(frozen)).toBe(true)
        expect(Object.isFrozen(frozen.nested)).toBe(true)

        expect(() => {
            ;(frozen as any).prop = 'mutated'
        }).toThrow(TypeError)

        expect(() => {
            ;(frozen.nested as any).count = 2
        }).toThrow(TypeError)
    })

    it('validateEntity accepts valid possession and saves deep-frozen instance', async () => {
        const model = new SchemaModel()
        let callbackResult: any = null

        const validPossession = {
            schema_version: 1,
            id: 'item_silver_spoon',
            name: 'Silver Spoon',
            owner_id: 'char_bog',
            weight_class: 'WEIGHT',
            mass_g: 300,
            occupies_hands: 1,
            contested_by: [],
            linked_grievances: [],
        }

        const bal: any = {
            idx: 'test_val_possession',
            src: 'possession',
            dat: validPossession,
            slv: (res: any) => {
                callbackResult = res
            },
        }

        await validateEntity(model, bal, mockState)

        expect(bal.val).toBe(0)
        expect(model.validatedEntities['item_silver_spoon']).toBeDefined()
        expect(
            Object.isFrozen(model.validatedEntities['item_silver_spoon']),
        ).toBe(true)
        expect(callbackResult.schBit.val).toBe(0)
    })

    it('validateEntity fails closed on schema violations', async () => {
        const model = new SchemaModel()
        let callbackResult: any = null

        const invalidPossession = {
            schema_version: 1,
            id: 'item_broken',
            name: 'Broken Item',
            weight_class: 'INVALID_CLASS', // Illegal enum
        }

        const bal: any = {
            idx: 'test_val_fail',
            src: 'possession',
            dat: invalidPossession,
            slv: (res: any) => {
                callbackResult = res
            },
        }

        await validateEntity(model, bal, mockState)

        expect(bal.val).toBe(-1)
        expect(bal.lst.length).toBeGreaterThan(0)
        expect(callbackResult.schBit.val).toBe(-1)
        expect(callbackResult.schBit.lst[0]).toContain('weight_class')
    })

    it('solveSomaticSAT allows valid 2-arm, two 1-hand loadouts', async () => {
        const model = new SchemaModel()
        let callbackResult: any = null

        const bal: any = {
            idx: 'sat_check_pass',
            dat: {
                character_id: 'char_bog',
                arms_available: 2,
                impairment_penalties: 0,
                held_primary: { id: 'item_spoon', occupies_hands: 1 },
                held_secondary: { id: 'item_thimble', occupies_hands: 1 },
            },
            slv: (res: any) => {
                callbackResult = res
            },
        }

        await solveSomaticSAT(model, bal, mockState)

        expect(bal.val).toBe(0)
        expect(callbackResult.schBit.val).toBe(0)
    })

    it('solveSomaticSAT halts with [SOMATIC_OVERLOAD] when impaired arm exceeds capacity', async () => {
        const model = new SchemaModel()
        let callbackResult: any = null

        const bal: any = {
            idx: 'sat_check_fail',
            dat: {
                character_id: 'char_wart',
                arms_available: 2,
                impairment_penalties: 1, // 1 arm severed/impaired -> net = 1
                held_primary: { id: 'item_spoon', occupies_hands: 1 },
                held_secondary: { id: 'item_thimble', occupies_hands: 1 }, // demands 2 hands
            },
            slv: (res: any) => {
                callbackResult = res
            },
        }

        await solveSomaticSAT(model, bal, mockState)

        expect(bal.val).toBe(-1)
        expect(bal.lst[0]).toContain('[SOMATIC_OVERLOAD]')
        expect(callbackResult.schBit.val).toBe(-1)
    })
})
