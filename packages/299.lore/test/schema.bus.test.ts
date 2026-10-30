/**
 * packages/299.lore/test/schema.bus.test.ts
 *
 * Integration test verifying that 26.schema.unit is properly registered in BEE.ts,
 * that its reducer is bound to the 'schema' state slice, and that action envelopes
 * dispatch cleanly across the state bus.
 */

import { describe, it, expect } from 'vitest'
import BEE, { list, reducer } from '../BEE'
import SchemaUnit from '../26.schema.unit/schema.unit'
import { SchemaModel } from '../26.schema.unit/schema.model'
import * as Act from '../26.schema.unit/schema.action'

describe('299.lore - Task 9.2 Unit Event Bus Registration', () => {
    it('registers SchemaUnit in the BEE execution list', () => {
        expect(list).toContain(SchemaUnit)
    })

    it('mounts the schema reducer under the schema key in the reducer table', () => {
        expect(reducer.schema).toBeDefined()
        expect(typeof reducer.schema).toBe('function')
    })

    it('processes actions dispatched through the mounted schema reducer slice', () => {
        const initialModel = new SchemaModel()
        const action = new Act.ValidateEntity({
            idx: 'test-bus-registration',
            src: 'possession',
            dat: {
                item_id: 'item_copper_nail',
                title: 'Bent Copper Nail',
                weight_class: 'SCRAP',
                occupies_hands: 1,
            },
        })

        const nextState = reducer.schema(initialModel, action)

        expect(action.bale.val).toBe(0)
        expect(nextState.validatedEntities['item_copper_nail']).toBeDefined()
        expect(nextState.lastValidationReport?.status).toBe(0)
    })

    it('instantiates SchemaUnit with state context without throwing', () => {
        const mockState: any = {
            hunt: async () => ({}),
            dispatch: () => {},
        }

        expect(() => new SchemaUnit(mockState)).not.toThrow()
    })
})
