import { describe, it, expect } from 'vitest'
import {
    BasisPointSchema,
    sanitizeBasisPoints,
} from '../../38.types.unit/fce/capacityMetric.interface.js'
import {
    auditEntityCapacityPreFlight,
    validateCapacityAction,
} from '../buz/capacityStatValidator.buzz.js'
import {
    CombatAttributeStatsSchema,
    EntityCapacityConfigurationSchema,
} from '../val/capacityStat.val.js'

describe('299.lore - [Feature 2.2] Integer Basis Point Capacity & Stat Configuration', () => {
    it('enforces BasisPointSchema integer bounds [0, 10000] and rejects floats', () => {
        expect(BasisPointSchema.safeParse(5000).success).toBe(true)
        expect(BasisPointSchema.safeParse(0).success).toBe(true)
        expect(BasisPointSchema.safeParse(10000).success).toBe(true)

        const floatRes = BasisPointSchema.safeParse(5000.5)
        expect(floatRes.success).toBe(false)
        expect(floatRes.error?.issues[0].message).toContain('FLOAT_PROHIBITED')

        const overRes = BasisPointSchema.safeParse(10500)
        expect(overRes.success).toBe(false)
        expect(overRes.error?.issues[0].message).toContain('OUT_OF_BOUNDS')

        expect(() => sanitizeBasisPoints(5000.25)).toThrowError(
            /FLOAT_PROHIBITED/,
        )
    })

    it('validates 2d6 combat statistics within [1, 5] integer bounds', () => {
        const statsValid = CombatAttributeStatsSchema.safeParse({
            spite: 4,
            cunning: 5,
            vigor: 3,
            poise: 2,
        })
        expect(statsValid.success).toBe(true)

        const statsInvalid = CombatAttributeStatsSchema.safeParse({
            spite: 6,
            cunning: 2,
            vigor: 3,
            poise: 2,
        })
        expect(statsInvalid.success).toBe(false)
    })

    it('audits somatic limb capacity and flags anatomical capacity breaches', () => {
        const somatic = {
            arms_available_bps: 10000,
            locomotion_baseline: 'bipedal_standard' as const,
            banned_kinetic_verbs: [],
        }

        const stats = { spite: 3, cunning: 5, vigor: 4, poise: 5 }

        const validAudit = auditEntityCapacityPreFlight(
            somatic,
            [{ item_id: 'item_lasso_of_truth', occupies_hands_bps: 10000 }],
            stats,
        )
        expect(validAudit.valid).toBe(true)

        const invalidAudit = auditEntityCapacityPreFlight(
            somatic,
            [
                { item_id: 'item_lasso_of_truth', occupies_hands_bps: 10000 },
                { item_id: 'item_heavy_shield', occupies_hands_bps: 10000 },
            ],
            stats,
        )
        expect(invalidAudit.valid).toBe(false)
        expect(invalidAudit.errorCode).toBe('ANATOMICAL_CAPACITY_EXCEEDED')
        expect(invalidAudit.deficit_bps).toBe(10000)
    })

    it('rejects all decimal basis-point traps (5000.5, 0.25, 10000.01) and out-of-bounds 2d6 stats', () => {
        for (const badFloat of [5000.5, 0.25, 10000.01]) {
            expect(BasisPointSchema.safeParse(badFloat).success).toBe(false)
            expect(() => sanitizeBasisPoints(badFloat)).toThrowError(
                /FLOAT_PROHIBITED/,
            )
        }
        expect(() => sanitizeBasisPoints(-1)).toThrowError(/OUT_OF_BOUNDS/)
        expect(() => sanitizeBasisPoints(10001)).toThrowError(/OUT_OF_BOUNDS/)

        const floatHandAudit = auditEntityCapacityPreFlight(
            {
                arms_available_bps: 10000,
                locomotion_baseline: 'bipedal_standard',
                banned_kinetic_verbs: [],
            },
            [{ item_id: 'item_bad_float', occupies_hands_bps: 5000.5 }],
            { spite: 3, cunning: 3, vigor: 3, poise: 3 },
        )
        expect(floatHandAudit.valid).toBe(false)
        expect(floatHandAudit.errorCode).toBe('FLOAT_PROHIBITED')

        expect(
            CombatAttributeStatsSchema.safeParse({
                spite: 6,
                cunning: 3,
                vigor: 3,
                poise: 3,
            }).success,
        ).toBe(false)
        expect(
            CombatAttributeStatsSchema.safeParse({
                spite: 3,
                cunning: 3,
                vigor: 0,
                poise: 3,
            }).success,
        ).toBe(false)
        expect(
            CombatAttributeStatsSchema.safeParse({
                spite: 3,
                cunning: 3.5,
                vigor: 3,
                poise: 3,
            }).success,
        ).toBe(false)
    })

    it('enforces strict EntityCapacityConfigurationSchema prefixes and resolves validateCapacityAction', async () => {
        expect(
            EntityCapacityConfigurationSchema.safeParse({
                entity_id: 'char_hero_01',
                somatic_capacity: {
                    arms_available_bps: 10000,
                    locomotion_baseline: 'bipedal_standard',
                },
                combat_stats: { spite: 3, cunning: 4, vigor: 5, poise: 2 },
            }).success,
        ).toBe(true)

        expect(
            EntityCapacityConfigurationSchema.safeParse({
                entity_id: 'bad_prefix_01',
                somatic_capacity: {
                    arms_available_bps: 10000,
                    locomotion_baseline: 'bipedal_standard',
                },
                combat_stats: { spite: 3, cunning: 4, vigor: 5, poise: 2 },
            }).success,
        ).toBe(false)

        let receipt: any = null
        await validateCapacityAction(
            {},
            {
                idx: 'test_cap_action',
                dat: {
                    somatic: {
                        arms_available_bps: 10000,
                        locomotion_baseline: 'bipedal_standard',
                        banned_kinetic_verbs: [],
                    },
                    equippedItems: [
                        { item_id: 'item_a', occupies_hands_bps: 5000 },
                    ],
                    stats: { spite: 3, cunning: 3, vigor: 3, poise: 3 },
                },
                slv: (res: any) => {
                    receipt = res
                },
            },
        )
        expect(receipt?.entBit?.val).toBe(1)
        expect(receipt?.entBit?.dat?.valid).toBe(true)
    })
})
