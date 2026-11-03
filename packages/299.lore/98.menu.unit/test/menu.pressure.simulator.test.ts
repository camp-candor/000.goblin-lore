/**
 * packages/299.lore/98.menu.unit/test/menu.pressure.simulator.test.ts
 *
 * Vitest verification suite for the Phase 2 Pressure Meter Thermodynamic
 * Simulator journey: [Somatic DSP Modulation Hub] ->
 * [Pressure Meter Thermodynamic Simulator] -> char_wart -> SOMATIC_FATIGUE ->
 * +2500 bp -> +1500 bp, asserting exact cns00 telemetry per the ag-test
 * directive (Steps 4.2 - 4.4).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import State from '../../99.core/state'
import { MenuModel } from '../menu.model'
import { updateMenu } from '../buz/00.menu.buzz'
import { resetPressureSimulatorRegistry } from '../buz/06.pressure.simulator.buzz'

describe('98.menu.unit: Pressure Meter Thermodynamic Simulator journey', () => {
    let model: MenuModel

    beforeEach(() => {
        model = new MenuModel()
        resetPressureSimulatorRegistry()
    })

    afterEach(() => {
        delete (globalThis as any).LIBRARY
        delete (global as any).LIBRARY
        resetPressureSimulatorRegistry()
    })

    it('drives char_wart SOMATIC_FATIGUE +2500 then +1500 and streams exact cns00 telemetry', async () => {
        const consoleLogs: string[] = []
        const choiceQueue = [
            '[Somatic DSP Modulation Hub]',
            '[Pressure Meter Thermodynamic Simulator]',
            'char_wart',
            'SOMATIC_FATIGUE',
            '+2500 bp (Heavy Load Drag)',
            '+1500 bp (Combat Strain)',
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
        const bal: any = { idx: 'test_pressure_simulator_journey' }
        await updateMenu(model, bal, liveState)

        expect(observedChoiceLists[0]).toContain('[Somatic DSP Modulation Hub]')
        expect(observedChoiceLists[1]).toContain(
            '[Pressure Meter Thermodynamic Simulator]',
        )
        expect(observedChoiceLists[2]).toContain('char_wart')
        expect(observedChoiceLists[2]).toContain('char_bog')
        expect(observedChoiceLists[2]).toContain('char_spleen')
        expect(observedChoiceLists[3]).toContain('SOMATIC_FATIGUE')
        expect(observedChoiceLists[4]).toContain('+2500 bp (Heavy Load Drag)')
        expect(observedChoiceLists[5]).toContain('+1500 bp (Combat Strain)')

        expect(consoleLogs).toContain(
            '>> [THERMODYNAMIC_FLOW] SOMATIC_FATIGUE:mtr_wart_fatigue | 5000 -> 7000 bps | Dissipated: 500 bps [OK]',
        )
        expect(consoleLogs).toContain(
            '>> [BRIDGE] Checking Inter-Meter Bridges: Fatigue 7000 bps < 8000 bps (No reduction) [OK]',
        )
        expect(consoleLogs).toContain(
            '>> [THERMODYNAMIC_FLOW] SOMATIC_FATIGUE:mtr_wart_fatigue | 7000 -> 8500 bps | Dissipated: 0 bps [OK]',
        )
        expect(consoleLogs).toContain(
            '>> [THERMODYNAMIC_FLOW] :: ALERT: Threshold Limit (8000 bps) Breached by mtr_wart_fatigue',
        )
        expect(consoleLogs).toContain(
            '>> [BRIDGE] Systemic Exhaustion Active: char_wart Refusal Threshold reduced by 1600 bps (New Limit: 6400 bps) [OK]',
        )
    })

    it('returns cleanly when BACK is chosen at the entity step', async () => {
        const consoleLogs: string[] = []
        const choiceQueue = [
            '[Somatic DSP Modulation Hub]',
            '[Pressure Meter Thermodynamic Simulator]',
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
        const bal: any = { idx: 'test_pressure_simulator_back' }
        await updateMenu(model, bal, liveState)

        expect(
            consoleLogs.some((l) => l.includes('[THERMODYNAMIC_FLOW]')),
        ).toBe(false)
    })
})
