import { describe, it, expect } from 'vitest'
import {
    evaluateEntitySomaticSat,
    verifyEntityForeignKeys,
    runEntityPreFlightGate,
} from '../buz/preFlightGate.buzz.js'

describe('09.entity.unit :: Pre-Flight Somatic SAT Foreign-Key Gate', () => {
    it('computes integer basis-point hand capacities across limb statuses', () => {
        const twoArms = evaluateEntitySomaticSat(
            'char_bog',
            { left_arm: 'INTACT', right_arm: 'INTACT' },
            20000,
        )
        expect(twoArms.valid).toBe(true)
        expect(twoArms.availableHandsBps).toBe(20000)

        const oneArm = evaluateEntitySomaticSat(
            'char_wart',
            { left_arm: 'AMPUTATED', right_arm: 'INTACT' },
            10000,
        )
        expect(oneArm.valid).toBe(true)
        expect(oneArm.availableHandsBps).toBe(10000)

        const impairedArm = evaluateEntitySomaticSat(
            'char_grissel',
            { left_arm: 'IMPAIRED', right_arm: 'PARALYZED' },
            5000,
        )
        expect(impairedArm.valid).toBe(true)
        expect(impairedArm.availableHandsBps).toBe(5000)
    })

    it('halts with SOMATIC_SAT_BREACH when required hand capacity exceeds available limbs', () => {
        const breach = evaluateEntitySomaticSat(
            'char_wart',
            { left_arm: 'AMPUTATED', right_arm: 'INTACT' },
            20000,
        )
        expect(breach.valid).toBe(false)
        expect(breach.availableHandsBps).toBe(10000)
        expect(breach.errors[0]).toContain('[SOMATIC_SAT_BREACH]')
    })

    it('rejects floating-point basis-point values with FLOAT_PROHIBITED', () => {
        expect(() =>
            evaluateEntitySomaticSat(
                'char_wart',
                { available_arms_bps: 10000.5 },
                10000,
            ),
        ).toThrow(/FLOAT_PROHIBITED/)

        expect(() =>
            evaluateEntitySomaticSat(
                'char_wart',
                { available_arms_bps: 10000 },
                5000.25,
            ),
        ).toThrow(/FLOAT_PROHIBITED/)
    })

    it('traps dangling foreign keys and self-reflexive grievance pointers', () => {
        const catalog = ['char_wart', 'char_bog', 'loc_culvert_siphon']
        const fkReport = verifyEntityForeignKeys(
            'char_wart',
            {
                location_id: 'loc_missing_vault',
                possessions: ['item_ghost_lantern'],
                grievance_targets: ['char_wart', 'char_bog'],
            },
            catalog,
        )

        expect(fkReport.valid).toBe(false)
        expect(fkReport.danglingKeys).toContain('loc_missing_vault')
        expect(fkReport.danglingKeys).toContain('item_ghost_lantern')
        expect(
            fkReport.errors.some((e) => e.includes('[DANGLING_FOREIGN_KEY]')),
        ).toBe(true)
        expect(
            fkReport.errors.some((e) =>
                e.includes('[REFLEXIVE_POINTER_PROHIBITED]'),
            ),
        ).toBe(true)
    })

    it('certifies a valid entity dossier through runEntityPreFlightGate', () => {
        const catalog = [
            'char_wart',
            'char_bog',
            'loc_culvert_siphon',
            'item_tallow_tin',
        ]
        const report = runEntityPreFlightGate(
            'char_wart',
            {
                location_id: 'loc_culvert_siphon',
                possessions: ['item_tallow_tin'],
                grievance_targets: ['char_bog'],
                somatic: { left_arm: 'AMPUTATED', right_arm: 'INTACT' },
            },
            catalog,
            10000,
        )

        expect(report.passed).toBe(true)
        expect(report.errors).toHaveLength(0)
        expect(report.foreignKeys.checkedPointersCount).toBe(3)
    })
})
