import { describe, it, expect } from 'vitest'
import { clampRefusalStrain } from '../buz/strainClamper.buzz'
import { clampBasisPoints } from '../val/strain.val'
import { RefusalModel } from '../refusal.model'

describe('45.refusal.unit: Refusal Strain Capacity Basis-Point Clamper', () => {
    it('correctly clamps basis points to lower (0) and upper (10000) bounds', () => {
        expect(clampBasisPoints(5000, 2000)).toBe(7000)
        expect(clampBasisPoints(9000, 2500)).toBe(10000)
        expect(clampBasisPoints(2000, -3000)).toBe(0)
        expect(clampBasisPoints(0, 0)).toBe(0)
    })

    it('evaluates clean strain accumulation beneath threshold', () => {
        let result: any = null
        const model = new RefusalModel()

        clampRefusalStrain(
            model,
            {
                idx: 'char_spleen',
                dat: {
                    character_id: 'char_spleen',
                    refusal_id: 'ref_never_admit_gauge_blindness',
                    current_strain_bps: 4500,
                    delta_strain_bps: 1500,
                    strain_threshold_bps: 7500,
                    post_break_state:
                        'Drops wrench and covers face with soot apron',
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
        expect(result.rflBit.dat.clamped_strain_bps).toBe(6000)
        expect(result.rflBit.dat.threshold_breached).toBe(false)
        expect(result.rflBit.dat.is_fractured).toBe(false)
        expect(result.rflBit.dat.active_state).toBe('INTACT')
    })

    it('triggers post-break fracture state when threshold is crossed', () => {
        let result: any = null
        const model = new RefusalModel()

        clampRefusalStrain(
            model,
            {
                idx: 'char_spleen',
                dat: {
                    character_id: 'char_spleen',
                    refusal_id: 'ref_never_admit_gauge_blindness',
                    current_strain_bps: 6500,
                    delta_strain_bps: 1500,
                    strain_threshold_bps: 7500,
                    post_break_state:
                        'Drops wrench and covers face with soot apron',
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
        expect(result.rflBit.dat.clamped_strain_bps).toBe(8000)
        expect(result.rflBit.dat.threshold_breached).toBe(true)
        expect(result.rflBit.dat.is_fractured).toBe(true)
        expect(result.rflBit.dat.active_state).toBe(
            'Drops wrench and covers face with soot apron',
        )
    })

    it('fails closed on floating-point values in strain metrics', () => {
        let result: any = null
        const model = new RefusalModel()

        clampRefusalStrain(
            model,
            {
                idx: 'char_bog',
                dat: {
                    character_id: 'char_bog',
                    refusal_id: 'ref_deny_tallow_theft',
                    current_strain_bps: 5000.5, // Float prohibited!
                    delta_strain_bps: 1000,
                    strain_threshold_bps: 8000,
                    post_break_state:
                        'Confesses to hoarding grease under floorboards',
                },
                slv: (res: any) => {
                    result = res
                },
            },
            {} as any,
        )

        expect(result).not.toBeNull()
        expect(result.rflBit.val).toBe(0)
        expect(result.rflBit.dat.isValid).toBe(false)
        expect(result.rflBit.dat.errorCode).toBe('FLOAT_PROHIBITED_BREACH')
    })

    it('fails closed when delta is out of allowable basis point bounds', () => {
        let result: any = null
        const model = new RefusalModel()

        clampRefusalStrain(
            model,
            {
                idx: 'char_bog',
                dat: {
                    character_id: 'char_bog',
                    refusal_id: 'ref_deny_tallow_theft',
                    current_strain_bps: 5000,
                    delta_strain_bps: 15000, // Exceeds +10000 bps delta limit!
                    strain_threshold_bps: 8000,
                    post_break_state: 'Confesses to hoarding grease',
                },
                slv: (res: any) => {
                    result = res
                },
            },
            {} as any,
        )

        expect(result).not.toBeNull()
        expect(result.rflBit.val).toBe(0)
        expect(result.rflBit.dat.isValid).toBe(false)
        expect(result.rflBit.dat.errorCode).toBe(
            'INVALID_STRAIN_PAYLOAD_BREACH',
        )
    })
})
