import { describe, it, expect } from 'vitest'
import { PossessionSchema, WeightClassEnum } from '../fce/possession.schema.js'

describe('15.item.unit - Possession Weight Classification', () => {
    it('parses a valid prop and rejects an invalid weight class', () => {
        const validItem = {
            schema_version: 1,
            id: 'item_good_silver_spoon',
            name: 'Good Silver Spoon',
            owner_id: 'char_bog',
            weight_class: 'WEIGHT',
            mass_g: 320,
            occupies_hands: 1,
            contested_by: ['char_wart'],
            linked_grievances: ['grv_spoon_credit_dispute'],
        }

        expect(PossessionSchema.safeParse(validItem).success).toBe(true)

        const invalidWeight = {
            ...validItem,
            weight_class: 'HEAVY_BURDEN',
        }
        expect(PossessionSchema.safeParse(invalidWeight).success).toBe(false)
    })

    it('enforces the closed weight class vocabulary', () => {
        for (const cls of ['SCRAP', 'SHINE', 'WEIGHT']) {
            expect(WeightClassEnum.safeParse(cls).success).toBe(true)
        }
        expect(WeightClassEnum.safeParse('HEAVY_BURDEN').success).toBe(false)
    })

    it('validates hand occupancy parameters as integers in 0-2', () => {
        const base = {
            schema_version: 1,
            id: 'item_flint_scraper',
            name: 'Flint Scraper',
            weight_class: 'SCRAP',
        }
        expect(
            PossessionSchema.safeParse({ ...base, occupies_hands: 0 }).success,
        ).toBe(true)
        expect(
            PossessionSchema.safeParse({ ...base, occupies_hands: 2 }).success,
        ).toBe(true)
        expect(
            PossessionSchema.safeParse({ ...base, occupies_hands: 3 }).success,
        ).toBe(false)
        expect(
            PossessionSchema.safeParse({ ...base, occupies_hands: -1 }).success,
        ).toBe(false)
        expect(
            PossessionSchema.safeParse({ ...base, occupies_hands: 1.5 })
                .success,
        ).toBe(false)
    })
})
