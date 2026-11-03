/**
 * packages/299.lore/98.menu.unit/test/menu.postbreak.trigger.test.ts
 *
 * Vitest verification suite for the Phase 5 Post-Break Finality
 * Trigger journey: [Somatic DSP Modulation Hub] ->
 * [Post-Break Finality Trigger] -> char_spleen -> REFUSAL_STRAIN ->
 * Force Breach -> [Inspect Somatic Status], asserting exact cns00
 * telemetry derived from the audited 35.threshold.unit engine.
 *
 * Reference (35.threshold.unit): 10000 >= 8000 trips the 5-step
 * atomic sequence; breached value preserved (never reset); taboo
 * tokens excised; acoustic deltas sealed; climax directive emitted.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import State from '../../99.core/state'
import { MenuModel } from '../menu.model'
import { updateMenu } from '../buz/00.menu.buzz'
import {
    TRIGGER_FORCE_BREACH_LABEL,
    TRIGGER_INSPECT_STATUS_LABEL,
    resetPostBreakTriggerRegistry,
} from '../buz/09.postbreak.trigger.buzz'

describe('98.menu.unit: Post-Break Finality Trigger journey', () => {
    let model: MenuModel

    beforeEach(() => {
        model = new MenuModel()
        resetPostBreakTriggerRegistry()
    })

    afterEach(() => {
        delete (globalThis as any).LIBRARY
        delete (global as any).LIBRARY
        resetPostBreakTriggerRegistry()
    })

    it('drives char_spleen refusal breach then status view and streams exact cns00 telemetry', async () => {
        const consoleLogs: string[] = []
        const choiceQueue = [
            '[Somatic DSP Modulation Hub]',
            '[Post-Break Finality Trigger]',
            'char_spleen',
            'REFUSAL_STRAIN',
            TRIGGER_FORCE_BREACH_LABEL,
            TRIGGER_INSPECT_STATUS_LABEL,
            '[<] BACK',
        ]
        const observedChoiceLists: string[][] = []

        const mockLibrary = {
            hunt: async (action: string, payload: any) => {
                if (action === '[Open action] Open Choice') {
                    observedChoiceLists.push(payload.lst || [])
                    if (payload.net == null) {
                        throw new Error(
                            '[NET_MISSING] Choice opened without grid net binding',
                        )
                    }
                    const nextChoice = choiceQueue.shift() || 'ROOT MENU'
                    return { chcBit: { src: nextChoice } }
                }
                if (action === '[Grid action] Update Grid') {
                    return {
                        grdBit: { dat: { x: 0, y: 4, xSpan: 4, ySpan: 8 } },
                    }
                }
                if (action === '[Console action] Update Console') {
                    consoleLogs.push(payload.src)
                    return {}
                }
                return {}
            },
        }

        ;(globalThis as any).LIBRARY = mockLibrary

        const liveState = new State()
        const bal: any = { idx: 'test_postbreak_trigger_journey' }
        await updateMenu(model, bal, liveState)

        expect(observedChoiceLists[0]).toContain('[Somatic DSP Modulation Hub]')
        expect(observedChoiceLists[1]).toContain(
            '[Post-Break Finality Trigger]',
        )
        expect(observedChoiceLists[2]).toContain('char_spleen')
        expect(observedChoiceLists[2]).toContain('char_wart')
        expect(observedChoiceLists[2]).toContain('char_bog')
        expect(observedChoiceLists[3]).toContain('REFUSAL_STRAIN')
        expect(observedChoiceLists[3]).toContain('SOMATIC_FATIGUE')
        expect(observedChoiceLists[4]).toContain(TRIGGER_FORCE_BREACH_LABEL)
        expect(observedChoiceLists[4]).toContain(TRIGGER_INSPECT_STATUS_LABEL)

        expect(consoleLogs).toContain(
            '>> [POST_BREAK] char_spleen breached threshold on REFUSAL_STRAIN (10000/8000 bps) [!] HALT ENGAGED [OK]',
        )
        expect(consoleLogs).toContain(
            '>> [FINALITY] Mutated refusal ref_never_admit_gauge_blindness | Added Condition: SUBSERVIENT [OK]',
        )
        expect(consoleLogs).toContain(
            '>> [FINALITY] Lifted taboo tokens: [boiler_dial, pressure_blindness] [OK]',
        )
        expect(consoleLogs).toContain(
            '>> [FINALITY] Acoustic Baseline Sealed: Pitch -150ct | Formant 8500 bps | Fry +3000 bps [OK]',
        )
        expect(consoleLogs).toContain(
            '>> [CLIMAX_DIRECTIVE] SCENE_CLIMAX_MANDATORY: Spleen confesses fraud directly to Mum Grissel. [OK]',
        )
        expect(consoleLogs).toContain(
            '>> [POST_BREAK] char_spleen REFUSAL_STRAIN remains clamped at 10000 bps (broken state, never resets to 0) [OK]',
        )
    })

    it('reports unbroken meters without a clamp when no breach was forced', async () => {
        const consoleLogs: string[] = []
        const choiceQueue = [
            '[Somatic DSP Modulation Hub]',
            '[Post-Break Finality Trigger]',
            'char_wart',
            'PHYSICAL_PAIN',
            TRIGGER_INSPECT_STATUS_LABEL,
            '[<] BACK',
        ]

        const mockLibrary = {
            hunt: async (action: string, payload: any) => {
                if (action === '[Open action] Open Choice') {
                    const nextChoice = choiceQueue.shift() || 'ROOT MENU'
                    return { chcBit: { src: nextChoice } }
                }
                if (action === '[Grid action] Update Grid') {
                    return {
                        grdBit: { dat: { x: 0, y: 4, xSpan: 4, ySpan: 8 } },
                    }
                }
                if (action === '[Console action] Update Console') {
                    consoleLogs.push(payload.src)
                    return {}
                }
                return {}
            },
        }

        ;(globalThis as any).LIBRARY = mockLibrary

        const liveState = new State()
        const bal: any = { idx: 'test_postbreak_trigger_unbroken' }
        await updateMenu(model, bal, liveState)

        expect(consoleLogs).toContain(
            ':: [POST_BREAK] char_wart PHYSICAL_PAIN: no break recorded (unbroken).',
        )
        expect(consoleLogs.some((l) => l.includes('[FINALITY]'))).toBe(false)
    })

    it('returns cleanly when BACK is chosen at the entity step', async () => {
        const consoleLogs: string[] = []
        const choiceQueue = [
            '[Somatic DSP Modulation Hub]',
            '[Post-Break Finality Trigger]',
            '[<] BACK',
        ]

        const mockLibrary = {
            hunt: async (action: string, payload: any) => {
                if (action === '[Open action] Open Choice') {
                    const nextChoice = choiceQueue.shift() || 'ROOT MENU'
                    return { chcBit: { src: nextChoice } }
                }
                if (action === '[Grid action] Update Grid') {
                    return {
                        grdBit: { dat: { x: 0, y: 4, xSpan: 4, ySpan: 8 } },
                    }
                }
                if (action === '[Console action] Update Console') {
                    consoleLogs.push(payload.src)
                    return {}
                }
                return {}
            },
        }

        ;(globalThis as any).LIBRARY = mockLibrary

        const liveState = new State()
        const bal: any = { idx: 'test_postbreak_trigger_back' }
        await updateMenu(model, bal, liveState)

        expect(consoleLogs.some((l) => l.includes('[POST_BREAK]'))).toBe(false)
        expect(consoleLogs.some((l) => l.includes('[FINALITY]'))).toBe(false)
    })
})
