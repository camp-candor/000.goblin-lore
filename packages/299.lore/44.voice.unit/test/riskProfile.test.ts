import { describe, it, expect } from 'vitest'
import { validateRiskProfile } from '../buz/voice.buzz'
import { VoiceModel } from '../voice.model'

describe('44.voice.unit: Character Risk Profile Schema Integration', () => {
    const validBogRiskProfile = {
        isExempt: false,
        frontmatter: {
            risk_aptitude: 4,
            risk_availability_bias_bps: 7000,
            risk_trigger_keywords: ['food', 'supplies', 'pantry', 'hoarding'],
            shares_pose_with: 'lying_tell',
        },
        sections: {
            disposition:
                'Bog does not think of himself as brave. He thinks of himself as the only one paying attention.',
            trigger_condition:
                'Bog acts specifically when a threat endangers food or supplies.',
            risked_for:
                'Protecting his own sense of being indispensable to the crawlspace.',
            failure_behavior:
                'Bog goes quiet and starts recounting inventory obsessively.',
            success_behavior:
                'Insufferable. Brings it up unprompted for cycles afterward.',
        },
    }

    it('validates a complete, compliant character risk profile at T0 ($0.00)', () => {
        let result: any = null
        const model = new VoiceModel()

        validateRiskProfile(
            model,
            {
                idx: 'char_bog',
                dat: validBogRiskProfile,
                slv: (res: any) => {
                    result = res
                },
            },
            {} as any,
        )

        expect(result).not.toBeNull()
        expect(result.vceBit.val).toBe(1)
        expect(result.vceBit.dat.isValid).toBe(true)
        expect(
            result.vceBit.dat.parsedProfile.frontmatter
                .risk_availability_bias_bps,
        ).toBe(7000)
    })

    it('accepts an explicit risk_profile_exempt declaration with an exemptionReason', () => {
        let result: any = null
        const model = new VoiceModel()

        validateRiskProfile(
            model,
            {
                idx: 'char_infant_goblin',
                dat: {
                    isExempt: true,
                    exemptionReason:
                        'Infant actor lacking tactical agency or mobility; cannot initiate mitigation actions.',
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
        expect(result.vceBit.dat.isExempt).toBe(true)
    })

    it('fails closed when an exempt character omits an exemption reason', () => {
        let result: any = null
        const model = new VoiceModel()

        validateRiskProfile(
            model,
            {
                idx: 'char_elder_goblin',
                dat: {
                    isExempt: true,
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
        expect(result.vceBit.dat.errorCode).toBe('EXEMPTION_REASON_MANDATORY')
    })

    it('fails closed on floating-point availability bias (rejecting IEEE-754 decimals)', () => {
        let result: any = null
        const model = new VoiceModel()

        const invalidFloatProfile = {
            ...validBogRiskProfile,
            frontmatter: {
                ...validBogRiskProfile.frontmatter,
                risk_availability_bias_bps: 0.7, // Must be 7000 integer bps!
            },
        }

        validateRiskProfile(
            model,
            {
                idx: 'char_bog',
                dat: invalidFloatProfile,
                slv: (res: any) => {
                    result = res
                },
            },
            {} as any,
        )

        expect(result).not.toBeNull()
        expect(result.vceBit.val).toBe(0)
        expect(result.vceBit.dat.isValid).toBe(false)
    })

    it('fails closed when uppercase characters are used in risk_trigger_keywords', () => {
        let result: any = null
        const model = new VoiceModel()

        const uppercaseKeywordsProfile = {
            ...validBogRiskProfile,
            frontmatter: {
                ...validBogRiskProfile.frontmatter,
                risk_trigger_keywords: ['Food', 'SUPPLIES'], // Must be lowercase!
            },
        }

        validateRiskProfile(
            model,
            {
                idx: 'char_bog',
                dat: uppercaseKeywordsProfile,
                slv: (res: any) => {
                    result = res
                },
            },
            {} as any,
        )

        expect(result).not.toBeNull()
        expect(result.vceBit.val).toBe(0)
        expect(result.vceBit.dat.isValid).toBe(false)
    })
})
