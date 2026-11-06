/**
 * packages/299.lore/98.menu.unit/test/menu.vocal.feasibility.test.ts
 *
 * Vitest verification suite for the Vocal-Motor Feasibility Gate Inspector
 * journey: [Somatic DSP Modulation Hub] -> [Vocal-Motor Feasibility Gate Inspector] ->
 * char_bog / char_wart, asserting exact cns00 telemetry.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import State from '../../99.core/state.js'
import { MenuModel } from '../menu.model.js'
import { updateMenu } from '../buz/00.menu.buzz.js'
import {
    FEASIBILITY_CHARACTER_OPTIONS,
    FEASIBILITY_BACK_LABEL,
} from '../buz/11.vocal.feasibility.buzz.js'

describe('98.menu.unit: Vocal-Motor Feasibility Gate Inspector journey', () => {
    let model: MenuModel

    beforeEach(() => {
        model = new MenuModel()
    })

    afterEach(() => {
        delete (globalThis as any).LIBRARY
        delete (global as any).LIBRARY
    })

    it('navigates to Vocal-Motor Feasibility Gate Inspector and audits char_bog and char_wart', async () => {
        const consoleLogs: string[] = []
        const choiceQueue = [
            '[Somatic DSP Modulation Hub]',
            '[Vocal-Motor Feasibility Gate Inspector]',
            'char_bog',
            'Move the lever now.',
            'char_wart',
            'I can still whisper.',
            FEASIBILITY_BACK_LABEL,
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
        const bal: any = { idx: 'test_vocal_feasibility_journey' }
        await updateMenu(model, bal, liveState)

        expect(observedChoiceLists[0]).toContain('[Somatic DSP Modulation Hub]')
        expect(observedChoiceLists[1]).toContain(
            '[Vocal-Motor Feasibility Gate Inspector]',
        )
        expect(observedChoiceLists[2]).toContain('char_bog')
        expect(observedChoiceLists[2]).toContain('char_wart')
        expect(observedChoiceLists[2]).toContain('char_spleen')

        expect(consoleLogs).toContain(
            '>> [FEASIBILITY] Vocal-motor feasibility certified for char_bog (Aphonic: false) [OK]',
        )
        expect(consoleLogs).toContain(
            ':: [FEASIBILITY FAIL] VOCAL_DELIVERY_BREACH: Character [char_wart] is physically aphonic (CONDITIONS:[cnd_crushed_larynx]) but verbal text was directed',
        )
    })
})
