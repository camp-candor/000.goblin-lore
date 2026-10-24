import { describe, it, expect, vi } from 'vitest'
import {
    streamSomaticMaskTelemetry,
    streamVerbPolarityTelemetry,
    streamRetirementTelemetry,
    runCharacterAuditTelemetry,
} from '../buz/characterTelemetry.buzz.js'
import { MenuModel } from '../menu.model.js'
import { reducer } from '../menu.reduce.js'
import * as Act from '../act/menu.action.js'

describe('98.menu.unit - Character Audit Telemetry Streamer', () => {
    it('streams somatic mask receipts in pure 7-bit ASCII without throwing', async () => {
        await expect(
            streamSomaticMaskTelemetry({
                characterId: 'char_bog',
                locomotionBaseline: 'bipedal_hunched',
                availableArmsBps: 10000,
                conditions: ['cnd_severed_left_arm'],
                bannedVerbs: ['bimanual_lift', 'sprint'],
                opticalState: 'NORMAL',
                blindConeDegrees: 0,
                canSpeak: true,
            }),
        ).resolves.not.toThrow()
    })

    it('streams clean polarity pass receipt when 0 violations detected', async () => {
        await expect(
            streamVerbPolarityTelemetry('under-the-floorboards', [], 4),
        ).resolves.not.toThrow()
    })

    it('streams fatal polarity breach receipt when violations are present', async () => {
        await expect(
            streamVerbPolarityTelemetry(
                'under-the-floorboards',
                [
                    {
                        characterId: 'char_spleen',
                        lineNumber: 42,
                        lineText: 'Spleen sprinted across the pipe.',
                        verbLemma: 'sprint',
                    },
                ],
                4,
            ),
        ).resolves.not.toThrow()
    })

    it('streams retirement receipts cleanly', async () => {
        await expect(
            streamRetirementTelemetry(
                'char_retiree',
                'under-the-floorboards',
                true,
            ),
        ).resolves.not.toThrow()
    })

    it('resolves cleanly in headless environments when dispatched via action', async () => {
        const model = new MenuModel()
        const slv = vi.fn()
        await runCharacterAuditTelemetry(
            model,
            { idx: 'test-audit', dat: { auditType: 'SOMATIC' }, slv } as any,
            {} as any,
        )

        expect(slv).toHaveBeenCalledWith(
            expect.objectContaining({
                mnuBit: expect.objectContaining({
                    idx: 'character-audit-telemetry-streamed',
                }),
            }),
        )
    })

    it('reducer handles RUN_CHARACTER_AUDIT_TELEMETRY action', async () => {
        const model = new MenuModel()
        const slv = vi.fn()
        const action = new Act.RunCharacterAuditTelemetry({
            idx: 'reducer-audit-test',
            dat: { auditType: 'POLARITY' },
            slv,
        } as any)

        const result = reducer(model, action)
        await result

        expect(slv).toHaveBeenCalledWith(
            expect.objectContaining({
                mnuBit: expect.objectContaining({
                    idx: 'character-audit-telemetry-streamed',
                }),
            }),
        )
    })
})
