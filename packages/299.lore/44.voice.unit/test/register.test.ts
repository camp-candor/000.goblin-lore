import { describe, it, expect } from 'vitest'
import { validateComedicRegister } from '../buz/voice.buzz'
import {
    ComedicRegisterEnum,
    COMEDIC_REGISTER_REGISTRY,
} from '../val/register.val'
import { VoiceModel } from '../voice.model'
import { reducer } from '../voice.reduce'
import { ValidateComedicRegister } from '../voice.action'

describe('44.voice.unit: Comedic Register Instruction Tag Validator', () => {
    it('accepts all canonical comedic register enum literals', () => {
        const validRegisters = [
            'deadpan',
            'self_serious',
            'oblivious',
            'hyper_literal',
            'aggrieved_bureaucrat',
            'clinical_gravel',
            'defensive_deflector',
        ]

        for (const reg of validRegisters) {
            expect(ComedicRegisterEnum.parse(reg)).toBe(reg)
            expect(
                COMEDIC_REGISTER_REGISTRY[
                    reg as keyof typeof COMEDIC_REGISTER_REGISTRY
                ],
            ).toBeDefined()
        }
    })

    it('validates a correct register tag with clean 7-bit ASCII prose', () => {
        let result: any = null
        const model = new VoiceModel()

        validateComedicRegister(
            model,
            {
                idx: 'char_spleen',
                dat: {
                    register: 'hyper_literal',
                    prose: 'The gasket has three fractures. Hand me the copper wrench.',
                },
                slv: (res: any) => {
                    result = res
                },
            },
            {} as any,
        )

        expect(result).not.toBeNull()
        expect(result.vceBit.val).toBe(1)
        expect(result.vceBit.dat.isValid).toBe(true)
        expect(result.vceBit.dat.register).toBe('hyper_literal')
        expect(result.vceBit.dat.detectedSlopTokens).toHaveLength(0)
    })

    it('fails closed on unknown comedic register enum at T0 ($0.00)', () => {
        let result: any = null
        const model = new VoiceModel()

        validateComedicRegister(
            model,
            {
                idx: 'char_bog',
                dat: {
                    register: 'wacky_slapstick',
                    prose: 'A clean line of dialogue.',
                },
                slv: (res: any) => {
                    result = res
                },
            },
            {} as any,
        )

        expect(result).not.toBeNull()
        expect(result.vceBit.val).toBe(0)
        expect(result.vceBit.dat.isValid).toBe(false)
        expect(result.vceBit.dat.errorCode).toBe(
            'INVALID_COMEDIC_REGISTER_BREACH',
        )
    })

    it('detects and rejects banned Latinate slop tokens in Voice Rail prose', () => {
        const contaminatedProse =
            'Furthermore, this broken culvert stands as a testament to the palpable misery of our warren.'

        let result: any = null
        const model = new VoiceModel()

        validateComedicRegister(
            model,
            {
                idx: 'char_wart',
                dat: {
                    register: 'deadpan',
                    prose: contaminatedProse,
                },
                slv: (res: any) => {
                    result = res
                },
            },
            {} as any,
        )

        expect(result).not.toBeNull()
        expect(result.vceBit.val).toBe(0)
        expect(result.vceBit.dat.isValid).toBe(false)
        expect(result.vceBit.dat.errorCode).toBe('BANNED_LATINATE_SLOP_BREACH')
        expect(result.vceBit.dat.detectedSlopTokens).toContain('furthermore')
        expect(result.vceBit.dat.detectedSlopTokens).toContain('testament')
        expect(result.vceBit.dat.detectedSlopTokens).toContain('palpable')
    })

    it('dispatches ValidateComedicRegister action via reducer cleanly', () => {
        let result: any = null
        const model = new VoiceModel()
        const action = new ValidateComedicRegister({
            idx: 'char_spleen',
            dat: {
                register: 'hyper_literal',
                prose: 'Count the scrap wire yourself.',
            },
            slv: (res: any) => {
                result = res
            },
        })

        const nextModel = reducer(model, action, {} as any)
        expect(nextModel).toBeDefined()
        expect(result).not.toBeNull()
        expect(result.vceBit.idx).toBe('validate-comedic-register')
        expect(result.vceBit.val).toBe(1)
        expect(result.vceBit.dat.isValid).toBe(true)
    })
})
