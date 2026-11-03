/**
 * packages/299.lore/98.menu.unit/test/menu.algebraic.inspector.test.ts
 *
 * Vitest verification suite for the Phase 4 Algebraic DSP Matrix
 * Inspector journey: [Somatic DSP Modulation Hub] ->
 * [Algebraic DSP Matrix Inspector] -> char_wart -> Pilot Case ->
 * Motor Collapse Conflict, asserting exact cns00 telemetry derived
 * from the audited 14.intensity.unit composition engine.
 *
 * Formula reference (14.intensity.unit):
 *   pacing = 10000 - divRoundHalfEven(3000 * 8200, 10000) = 7540
 *   pause = divRoundHalfEven(10000 * (10000 + 9414), 10000) = 19414
 *   fry = max(8500 floor, 4100 + 3000) = 8500; hold = 18 frames
 *   motor gate: fatigue 8200 > 8000 + 'RUN' -> CANON_BREACH
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import State from '../../99.core/state'
import { MenuModel } from '../menu.model'
import { updateMenu } from '../buz/00.menu.buzz'
import {
    MATRIX_PILOT_SCENARIO_LABEL,
    MATRIX_CONFLICT_SCENARIO_LABEL,
} from '../buz/08.algebraic.inspector.buzz'

describe('98.menu.unit: Algebraic DSP Matrix Inspector journey', () => {
    let model: MenuModel

    beforeEach(() => {
        model = new MenuModel()
    })

    afterEach(() => {
        delete (globalThis as any).LIBRARY
        delete (global as any).LIBRARY
    })

    it('drives char_wart pilot case then motor conflict and streams exact cns00 telemetry', async () => {
        const consoleLogs: string[] = []
        const choiceQueue = [
            '[Somatic DSP Modulation Hub]',
            '[Algebraic DSP Matrix Inspector]',
            'char_wart',
            MATRIX_PILOT_SCENARIO_LABEL,
            MATRIX_CONFLICT_SCENARIO_LABEL,
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
        const bal: any = { idx: 'test_algebraic_inspector_journey' }
        await updateMenu(model, bal, liveState)

        expect(observedChoiceLists[0]).toContain('[Somatic DSP Modulation Hub]')
        expect(observedChoiceLists[1]).toContain(
            '[Algebraic DSP Matrix Inspector]',
        )
        expect(observedChoiceLists[2]).toContain('char_wart')
        expect(observedChoiceLists[2]).toContain('char_bog')
        expect(observedChoiceLists[2]).toContain('char_spleen')
        expect(observedChoiceLists[3]).toContain(MATRIX_PILOT_SCENARIO_LABEL)
        expect(observedChoiceLists[4]).toContain(MATRIX_CONFLICT_SCENARIO_LABEL)

        expect(consoleLogs).toContain(
            '>> [ALGEBRAIC_DSP] Composed DSP Matrix for char_wart | Pacing: 7540 bps | Pause: 19414 bps | Fry: 8500 bps [OK]',
        )
        expect(consoleLogs).toContain(
            '>> [ALGEBRAIC_DSP] :: Exhaustion Strained: Pause Frequency Multiplier locked to 28000 bps (2.8x) [OK]',
        )
        expect(consoleLogs).toContain(
            '>> [ALGEBRAIC_DSP] :: Visceral Hold Active: 18 frames injected for physicalPain >= 7000 bps [OK]',
        )
        expect(consoleLogs).toContain(
            ":: [ALGEBRAIC_DSP FAIL] CANON_BREACH: Motor collapse - character fatigue 8200 bps prohibits kinetic verb 'RUN'",
        )
    })

    it('returns cleanly when BACK is chosen at the entity step', async () => {
        const consoleLogs: string[] = []
        const choiceQueue = [
            '[Somatic DSP Modulation Hub]',
            '[Algebraic DSP Matrix Inspector]',
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
        const bal: any = { idx: 'test_algebraic_inspector_back' }
        await updateMenu(model, bal, liveState)

        expect(consoleLogs.some((l) => l.includes('[ALGEBRAIC_DSP]'))).toBe(
            false,
        )
    })
})
