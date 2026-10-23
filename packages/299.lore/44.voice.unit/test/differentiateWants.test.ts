import { describe, it, expect } from 'vitest'
import { differentiateWants } from '../buz/voice.buzz'
import { VoiceModel } from '../voice.model'
import { reducer } from '../voice.reduce'
import { DifferentiateWants } from '../voice.action'

describe('Dual-Objective Surface Versus Actual Want Differentiator', () => {
    const validMarkdown = `
## Wants (surface)
Replace the rusted copper boiler gasket before the second work shift begins.

## Wants (actual)
Prevent Mum Grissel from discovering that he cannot read the pressure gauges.

## Blind spot
Believes absolute adherence to protocol shields him from eviction.

## Voice notes
Staccato cadence, defensive redirects toward mechanical hardware.

## Few-shot lines
- "The gasket threading is stripped, not me."
- "Read it yourself if you don't trust the copper."
`

    it('passes when surface and actual wants have divergent subtext and valid sections', () => {
        let response: any = null
        const model = new VoiceModel()
        differentiateWants(
            model,
            {
                idx: 'char_spleen',
                src: validMarkdown,
                slv: (res: any) => {
                    response = res
                },
            },
            {} as any,
        )

        expect(response).not.toBeNull()
        expect(response.vceBit.val).toBe(1)
        expect(response.vceBit.dat.isValid).toBe(true)
        expect(response.vceBit.dat.overlapPercentageBps).toBeLessThan(6000)
        expect(response.vceBit.dat.contrastPass).toBe(true)
    })

    it('fails when surface want and actual want are identical', () => {
        const identicalWantsMarkdown = validMarkdown.replace(
            'Prevent Mum Grissel from discovering that he cannot read the pressure gauges.',
            'Replace the rusted copper boiler gasket before the second work shift begins.',
        )

        let response: any = null
        differentiateWants(
            new VoiceModel(),
            {
                idx: 'char_spleen',
                src: identicalWantsMarkdown,
                slv: (res: any) => {
                    response = res
                },
            },
            {} as any,
        )

        expect(response.vceBit.val).toBe(0)
        expect(response.vceBit.dat.isValid).toBe(false)
        expect(response.vceBit.dat.errorReason).toContain(
            'SUBTEXT_IDENTITY_BREACH',
        )
    })

    it('fails when lemma overlap exceeds 60.0% (6000 bps)', () => {
        const highOverlapMarkdown = `
## Wants (surface)
Fix the rusted pipe valve and save the fuel rations today.

## Wants (actual)
Fix the rusted pipe valve so we keep the fuel rations today.

## Blind spot
Believes safety is guaranteed.

## Voice notes
Monosyllabic.

## Few-shot lines
- "Touch the valve."
`

        let response: any = null
        differentiateWants(
            new VoiceModel(),
            {
                idx: 'char_bog',
                src: highOverlapMarkdown,
                slv: (res: any) => {
                    response = res
                },
            },
            {} as any,
        )

        expect(response.vceBit.val).toBe(0)
        expect(response.vceBit.dat.contrastPass).toBe(false)
        expect(response.vceBit.dat.errorReason).toContain(
            'SUBTEXT_CONTRAST_BREACH',
        )
    })

    it('fails when citation tags or unedited HTML comments are present', () => {
        const leakedMarkdown = validMarkdown + '\n[cite: 1]'

        let response: any = null
        differentiateWants(
            new VoiceModel(),
            {
                idx: 'char_spleen',
                src: leakedMarkdown,
                slv: (res: any) => {
                    response = res
                },
            },
            {} as any,
        )

        expect(response.vceBit.val).toBe(0)
        expect(response.vceBit.dat.cleanOfArtifacts).toBe(false)
        expect(response.vceBit.dat.errorReason).toContain('LEAKAGE_BREACH')
    })

    it('dispatches DifferentiateWants action via reducer cleanly', () => {
        let response: any = null
        const model = new VoiceModel()
        const action = new DifferentiateWants({
            idx: 'char_spleen',
            src: validMarkdown,
            slv: (res: any) => {
                response = res
            },
        })

        const nextModel = reducer(model, action, {} as any)
        expect(nextModel).toBeDefined()
        expect(response).not.toBeNull()
        expect(response.vceBit.idx).toBe('differentiate-wants')
        expect(response.vceBit.val).toBe(1)
    })
})
