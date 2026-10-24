import { describe, it, expect } from 'vitest'
import { validateRefusalTuple } from '../buz/refusal.buzz'
import { RefusalModel } from '../refusal.model'

describe('45.refusal.unit: Three-Stage Refusal Vector Tuple Validator', () => {
    const validRule = {
        refusal_id: 'ref_never_admit_gauge_blindness',
        character_id: 'char_spleen',
        trigger:
            'Direct demand from Mum Grissel to read boiler pressure dials.',
        mandatory_refusal:
            'Refuses to look at the brass gauge needles or state a numerical reading.',
        unavoidable_cost:
            'Accused of insolence; suffers 1500 bps refusal strain penalty and forfeits tallow ration.',
        strain_threshold_bps: 7500,
        post_break_state:
            'Drops wrench, covers face with soot-stained apron, and screams in high-pitched panic.',
    }

    it('validates a single compliant refusal vector triad at T0 ($0.00)', () => {
        let result: any = null
        const model = new RefusalModel()

        validateRefusalTuple(
            model,
            {
                idx: 'char_spleen',
                dat: validRule,
                slv: (res: any) => {
                    result = res
                },
            },
            {} as any,
        )

        expect(result).not.toBeNull()
        expect(result.rflBit.val).toBe(1)
        expect(result.rflBit.dat.isValid).toBe(true)
        expect(result.rflBit.dat.refusalCount).toBe(1)
        expect(result.rflBit.dat.validatedRules[0].strain_threshold_bps).toBe(
            7500,
        )
    })

    it('validates a collection of character refusal rules', () => {
        let result: any = null
        const model = new RefusalModel()

        validateRefusalTuple(
            model,
            {
                idx: 'char_spleen',
                dat: {
                    character_id: 'char_spleen',
                    refusals: [
                        validRule,
                        {
                            refusal_id: 'ref_no_culvert_entry',
                            character_id: 'char_spleen',
                            trigger:
                                'Ordered to crawl into unbraced drainage pipe during heavy rain.',
                            mandatory_refusal:
                                'Refuses to enter pipe diameter smaller than 3 feet.',
                            unavoidable_cost:
                                'Forced to sleep outside the warm crawlspace perimeter.',
                            strain_threshold_bps: 8500,
                            post_break_state:
                                'Freezes catatonic at the pipe mouth, unresponsive to physical shoving.',
                        },
                    ],
                },
                slv: (res: any) => {
                    result = res
                },
            },
            {} as any,
        )

        expect(result).not.toBeNull()
        expect(result.rflBit.val).toBe(1)
        expect(result.rflBit.dat.isValid).toBe(true)
        expect(result.rflBit.dat.refusalCount).toBe(2)
    })

    it('fails closed when mandatory triad elements are missing or empty', () => {
        let result: any = null
        const model = new RefusalModel()

        const brokenTriad = {
            ...validRule,
            unavoidable_cost: '', // Empty cost breaks the mandatory triad!
        }

        validateRefusalTuple(
            model,
            {
                idx: 'char_spleen',
                dat: brokenTriad,
                slv: (res: any) => {
                    result = res
                },
            },
            {} as any,
        )

        expect(result).not.toBeNull()
        expect(result.rflBit.val).toBe(0)
        expect(result.rflBit.dat.isValid).toBe(false)
        expect(result.rflBit.dat.errorCode).toBe('INVALID_REFUSAL_TUPLE_BREACH')
    })

    it('fails closed on floating-point strain threshold metrics', () => {
        let result: any = null
        const model = new RefusalModel()

        const floatStrainRule = {
            ...validRule,
            strain_threshold_bps: 0.75, // Must be 7500 integer basis points!
        }

        validateRefusalTuple(
            model,
            {
                idx: 'char_spleen',
                dat: floatStrainRule,
                slv: (res: any) => {
                    result = res
                },
            },
            {} as any,
        )

        expect(result).not.toBeNull()
        expect(result.rflBit.val).toBe(0)
        expect(result.rflBit.dat.isValid).toBe(false)
    })

    it('fails closed on malformed refusal ID format', () => {
        let result: any = null
        const model = new RefusalModel()

        const badIdRule = {
            ...validRule,
            refusal_id: 'INVALID_REFUSAL_ID', // Must start with ref_ and be lowercase!
        }

        validateRefusalTuple(
            model,
            {
                idx: 'char_spleen',
                dat: badIdRule,
                slv: (res: any) => {
                    result = res
                },
            },
            {} as any,
        )

        expect(result).not.toBeNull()
        expect(result.rflBit.val).toBe(0)
        expect(result.rflBit.dat.isValid).toBe(false)
    })
})
