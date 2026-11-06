/**
 * packages/299.lore/98.menu.unit/test/menu.payload.validator.test.ts
 *
 * Vitest verification suite for the Synthesis Ingress Payload Validator
 * journey: [Somatic DSP Modulation Hub] -> [Synthesis Ingress Payload Validator] ->
 * line_wart_001 / line_aphonic_test, asserting exact cns00 telemetry.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import State from '../../99.core/state.js'
import { MenuModel } from '../menu.model.js'
import { updateMenu } from '../buz/00.menu.buzz.js'
import {
    VALIDATOR_LINE_OPTIONS,
    VALIDATOR_BACK_LABEL,
} from '../buz/10.payload.validator.buzz.js'

describe('98.menu.unit: Synthesis Ingress Payload Validator journey', () => {
    let model: MenuModel

    beforeEach(() => {
        model = new MenuModel()
    })

    afterEach(() => {
        delete (globalThis as any).LIBRARY
        delete (global as any).LIBRARY
    })

    it('navigates to Synthesis Ingress Payload Validator and validates line_wart_001 and line_aphonic_test', async () => {
        const consoleLogs: string[] = []
        const choiceQueue = [
            '[Somatic DSP Modulation Hub]',
            '[Synthesis Ingress Payload Validator]',
            'line_wart_001',
            'line_aphonic_test',
            VALIDATOR_BACK_LABEL,
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
        const bal: any = { idx: 'test_payload_validator_journey' }
        await updateMenu(model, bal, liveState)

        expect(observedChoiceLists[0]).toContain('[Somatic DSP Modulation Hub]')
        expect(observedChoiceLists[1]).toContain(
            '[Synthesis Ingress Payload Validator]',
        )
        expect(observedChoiceLists[2]).toContain('line_wart_001')
        expect(observedChoiceLists[2]).toContain('line_bog_002')
        expect(observedChoiceLists[2]).toContain('line_aphonic_test')

        expect(consoleLogs).toContain(
            '>> [PAYLOAD] Validated Ingress Request line_wart_001 (char_wart) | Facts: 2 [OK]',
        )
        expect(consoleLogs).toContain(
            '>> [RATIO] Silence-to-Speech Ratio Verified: Interleaved [BEAT] present at index 2 [OK]',
        )
        expect(consoleLogs).toContain(
            ':: [PAYLOAD FAIL] Schema breach: VOCAL_DELIVERY_BREACH: Aphonic character cannot phonate verbal dialogue',
        )
    })
})
