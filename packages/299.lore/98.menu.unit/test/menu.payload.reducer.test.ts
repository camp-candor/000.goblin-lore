/**
 * packages/299.lore/98.menu.unit/test/menu.payload.reducer.test.ts
 *
 * Vitest verification suite for the Payload Serialization Reducer Console
 * journey: [Somatic DSP Modulation Hub] -> [Payload Serialization Reducer Console] ->
 * [Run Full Pipeline Dispatch] & [Inspect Model State], asserting exact cns00 telemetry.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import State from '../../99.core/state.js'
import { MenuModel } from '../menu.model.js'
import { updateMenu } from '../buz/00.menu.buzz.js'
import { REDUCER_BACK_LABEL } from '../buz/14.payload.reducer.buzz.js'

describe('98.menu.unit: Payload Serialization Reducer Console journey', () => {
    let model: MenuModel

    beforeEach(() => {
        model = new MenuModel()
    })

    afterEach(() => {
        delete (globalThis as any).LIBRARY
        delete (global as any).LIBRARY
    })

    it('navigates to Payload Serialization Reducer Console, dispatches full pipeline, and inspects model state', async () => {
        const consoleLogs: string[] = []
        const choiceQueue = [
            '[Somatic DSP Modulation Hub]',
            '[Payload Serialization Reducer Console]',
            '[Run Full Pipeline Dispatch]',
            '[Inspect Model State]',
            REDUCER_BACK_LABEL,
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
        const bal: any = { idx: 'test_payload_reducer_journey' }
        await updateMenu(model, bal, liveState)

        // Step 4.2 assertions: Submenu options present
        expect(observedChoiceLists[0]).toContain('[Somatic DSP Modulation Hub]')
        expect(observedChoiceLists[1]).toContain(
            '[Payload Serialization Reducer Console]',
        )
        expect(observedChoiceLists[2]).toContain('[Run Full Pipeline Dispatch]')
        expect(observedChoiceLists[2]).toContain('[Dispatch Validate]')
        expect(observedChoiceLists[2]).toContain('[Dispatch Feasibility]')
        expect(observedChoiceLists[2]).toContain('[Dispatch Staleness]')
        expect(observedChoiceLists[2]).toContain('[Dispatch Hash]')
        expect(observedChoiceLists[2]).toContain('[Inspect Model State]')

        // Step 4.3 assertions: Full pipeline execution telemetry
        const hasPayloadLog = consoleLogs.some((log) =>
            log.includes(
                '>> [PAYLOAD] Validated Ingress Request line_wart_001 (char_wart) | Facts: 2 [OK]',
            ),
        )
        expect(hasPayloadLog).toBe(true)

        const hasFeasibilityLog = consoleLogs.some((log) =>
            log.includes(
                '>> [FEASIBILITY] Vocal-motor feasibility certified for char_wart (Aphonic: false) [OK]',
            ),
        )
        expect(hasFeasibilityLog).toBe(true)

        const hasStalenessLog = consoleLogs.some((log) =>
            log.includes(
                '>> [STALENESS] Evaluated sc_culvert_siphon_01 -> [OK] CLEAN',
            ),
        )
        expect(hasStalenessLog).toBe(true)

        const hasHashLog = consoleLogs.some(
            (log) =>
                log.includes('>> [PAYLOAD_HASH] Line: line_wart_001') &&
                log.includes('[OK]'),
        )
        expect(hasHashLog).toBe(true)

        // Step 4.4 assertions: Model state inspection
        const hasModelStateLog = consoleLogs.some(
            (log) =>
                log.includes('totalValidatedCount: 1') &&
                log.includes('validatedPayloads') &&
                log.includes('feasibilityReceipts') &&
                log.includes('stalenessReceipts') &&
                log.includes('hashedPayloads') &&
                log.includes('[OK]'),
        )
        expect(hasModelStateLog).toBe(true)
    })
})
