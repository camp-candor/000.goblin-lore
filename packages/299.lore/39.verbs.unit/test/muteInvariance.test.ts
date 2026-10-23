import { describe, it, expect, vi } from 'vitest'
import {
    isCharacterAphonic,
    extractSpokenDialogueUtterances,
    verifyMuteVocalInvariance,
} from '../buz/muteInvariance.buzz'

describe('39.verbs.unit - Behavioral Invariance Mute Character Verifier', () => {
    it('correctly classifies aphonic status from explicit flag and somatic conditions', () => {
        expect(isCharacterAphonic(false, [])).toBe(true)
        expect(isCharacterAphonic(true, ['MUTE'])).toBe(true)
        expect(isCharacterAphonic(true, ['CRUSHED_LARYNX'])).toBe(true)
        expect(isCharacterAphonic(true, ['SEVERED_TRACHEA'])).toBe(true)
        expect(isCharacterAphonic(true, ['VOW_OF_SILENCE'])).toBe(true)
        expect(isCharacterAphonic(true, ['FRACTURED_ARM'])).toBe(false)
    })

    it('passes when an aphonic character has zero few-shot lines and zero spoken dialogue', async () => {
        const res = await verifyMuteVocalInvariance({
            entityId: 'char_kael',
            canSpeak: false,
            activeConditions: ['VOW_OF_SILENCE'],
            voiceRailFewShotLines: [],
            candidateDialogueBlocks: [],
        })

        expect(res.allowed).toBe(true)
        expect(res.breachCount).toBe(0)
        expect(res.breaches).toHaveLength(0)
        expect(res.remediationDirective).toBeNull()
    })

    it('fails at T_0 when an aphonic character has spoken few-shot lines or quoted dialogue', async () => {
        const mockHunt = vi.fn().mockResolvedValue({})
        const mockState = { hunt: mockHunt } as any

        const res = await verifyMuteVocalInvariance(
            {
                entityId: 'char_kael',
                canSpeak: false,
                activeConditions: ['MUTE'],
                voiceRailFewShotLines: [
                    '"I will not yield the valve."',
                    'Leave this place!',
                ],
                candidateDialogueBlocks: [],
            },
            mockState,
        )

        expect(res.allowed).toBe(false)
        expect(res.breachCount).toBe(2)
        expect(res.breaches[0].rawText).toBe('I will not yield the valve.')
        expect(res.breaches[0].isQuoted).toBe(true)
        expect(res.breaches[1].rawText).toBe('Leave this place!')
        expect(res.remediationDirective).toContain(
            'Replace spoken dialogue with physical gesture',
        )

        expect(mockHunt).toHaveBeenCalledWith(
            '[Console action] Update Console',
            expect.objectContaining({
                idx: 'cns00',
                src: expect.stringContaining(
                    '>> [MUTE_VOCAL_INVARIANCE_BREACH] Actor char_kael has 2 illegal spoken line(s)',
                ),
            }),
        )
    })

    it('allows normal speaking characters to have quoted few-shot dialogue without errors', async () => {
        const res = await verifyMuteVocalInvariance({
            entityId: 'char_bog',
            canSpeak: true,
            activeConditions: [],
            voiceRailFewShotLines: [
                '"Tallow stays with the elder."',
                '"Check the latch."',
            ],
            candidateDialogueBlocks: ['"Keep your voice low."'],
        })

        expect(res.allowed).toBe(true)
        expect(res.breachCount).toBe(0)
    })

    it('ignores stage direction parentheticals and markdown comments during extraction', () => {
        const lines = [
            '(stares directly without blinking)',
            '<!-- author note: silent glare -->',
            '// non-vocal action',
            '"Spoken words here"',
        ]
        const utterances = extractSpokenDialogueUtterances(lines)
        expect(utterances).toHaveLength(1)
        expect(utterances[0].rawText).toBe('Spoken words here')
        expect(utterances[0].isQuoted).toBe(true)
    })
})
