/**
 * packages/299.lore/98.menu.unit/test/menu.acoustic.inspector.test.ts
 *
 * Vitest verification suite for the Phase 3 Acoustic Paranoia Clock
 * Inspector journey: [Somatic DSP Modulation Hub] ->
 * [Acoustic Paranoia Clock Inspector] -> char_bog -> evt_boiler_groan_01 ->
 * evt_pipe_rupture_02, asserting exact cns00 telemetry derived from the
 * audited 20.paranoia.unit transfer formula.
 *
 * Formula reference (acousticImpulse.buzz.ts):
 *   arrival = source - partitionLoss - debuff
 *   snr = arrival - floor; transfer = floor(snr * coupling / 10000)
 *   next = max(baseline, current - decay + transfer)
 * Step 1: arrival 8500, snr 7000, transfer 3500, next 5600.
 * Step 2: arrival 9500, snr 8000, transfer 4000, next 9300 (boil-over).
 * Flutter: hzBps = 40000 + floor(35000 * bps / 10000),
 *   depth = floor(250 * bps / 10000); 9300 -> 72550 / 7.25 Hz / 232 / 45 deg.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import State from '../../99.core/state'
import { MenuModel } from '../menu.model'
import { updateMenu } from '../buz/00.menu.buzz'
import { resetAcousticInspectorRegistry } from '../buz/07.acoustic.inspector.buzz'

describe('98.menu.unit: Acoustic Paranoia Clock Inspector journey', () => {
    let model: MenuModel

    beforeEach(() => {
        model = new MenuModel()
        resetAcousticInspectorRegistry()
    })

    afterEach(() => {
        delete (globalThis as any).LIBRARY
        delete (global as any).LIBRARY
        resetAcousticInspectorRegistry()
    })

    it('drives char_bog boiler groan then pipe rupture and streams exact cns00 telemetry', async () => {
        const consoleLogs: string[] = []
        const choiceQueue = [
            '[Somatic DSP Modulation Hub]',
            '[Acoustic Paranoia Clock Inspector]',
            'char_bog',
            'evt_boiler_groan_01 (11000 cdB source, 2500 cdB wall)',
            'evt_pipe_rupture_02 (12000 cdB source, 2500 cdB wall)',
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
        const bal: any = { idx: 'test_acoustic_inspector_journey' }
        await updateMenu(model, bal, liveState)

        expect(observedChoiceLists[0]).toContain('[Somatic DSP Modulation Hub]')
        expect(observedChoiceLists[1]).toContain(
            '[Acoustic Paranoia Clock Inspector]',
        )
        expect(observedChoiceLists[2]).toContain('char_bog')
        expect(observedChoiceLists[2]).toContain('char_wart')
        expect(observedChoiceLists[2]).toContain('char_spleen')
        expect(observedChoiceLists[3]).toContain(
            'evt_boiler_groan_01 (11000 cdB source, 2500 cdB wall)',
        )
        expect(observedChoiceLists[4]).toContain(
            'evt_pipe_rupture_02 (12000 cdB source, 2500 cdB wall)',
        )

        expect(consoleLogs).toContain(
            '>> [ACOUSTIC_IMPULSE] char_bog | Arrival: 8500 cdB | Next: 5600/8000 bps [OK]',
        )
        expect(consoleLogs).toContain(
            '>> [PITCH_FLUTTER] char_bog | Tremor: 5.96 Hz | Depth: 140 centitones | Vision Cone: 60 deg (Hypervigilant) [OK]',
        )
        expect(consoleLogs).toContain(
            '>> [ACOUSTIC_IMPULSE] char_bog | Arrival: 9500 cdB | Next: 9300/8000 bps [!] BOIL-OVER TRIPPED [OK]',
        )
        expect(consoleLogs).toContain(
            '>> [PITCH_FLUTTER] char_bog | Tremor: 7.25 Hz | Depth: 232 centitones | Vision Cone: 45 deg (Panic Locked) [OK]',
        )
    })

    it('returns cleanly when BACK is chosen at the entity step', async () => {
        const consoleLogs: string[] = []
        const choiceQueue = [
            '[Somatic DSP Modulation Hub]',
            '[Acoustic Paranoia Clock Inspector]',
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
        const bal: any = { idx: 'test_acoustic_inspector_back' }
        await updateMenu(model, bal, liveState)

        expect(consoleLogs.some((l) => l.includes('[ACOUSTIC_IMPULSE]'))).toBe(
            false,
        )
    })
})
