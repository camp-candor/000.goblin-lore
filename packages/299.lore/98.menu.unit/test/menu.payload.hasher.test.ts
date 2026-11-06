/**
 * packages/299.lore/98.menu.unit/test/menu.payload.hasher.test.ts
 *
 * Vitest verification suite for the Deterministic Payload Hasher
 * journey: [Somatic DSP Modulation Hub] -> [Deterministic Payload Hasher] ->
 * line_wart_001 & [Inject Hash Parity Audit], asserting exact cns00 telemetry.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import State from '../../99.core/state.js'
import { MenuModel } from '../menu.model.js'
import { updateMenu } from '../buz/00.menu.buzz.js'
import {
    HASHER_BACK_LABEL,
    HASHER_AUDIT_LABEL,
} from '../buz/13.payload.hasher.buzz.js'

describe('98.menu.unit: Deterministic Payload Hasher journey', () => {
    let model: MenuModel

    beforeEach(() => {
        model = new MenuModel()
    })

    afterEach(() => {
        delete (globalThis as any).LIBRARY
        delete (global as any).LIBRARY
    })

    it('navigates to Deterministic Payload Hasher, hashes line_wart_001, and audits parity breach', async () => {
        const consoleLogs: string[] = []
        const choiceQueue = [
            '[Somatic DSP Modulation Hub]',
            '[Deterministic Payload Hasher]',
            'line_wart_001',
            HASHER_AUDIT_LABEL,
            HASHER_BACK_LABEL,
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
        const bal: any = { idx: 'test_payload_hasher_journey' }
        await updateMenu(model, bal, liveState)

        expect(observedChoiceLists[0]).toContain('[Somatic DSP Modulation Hub]')
        expect(observedChoiceLists[1]).toContain(
            '[Deterministic Payload Hasher]',
        )
        expect(observedChoiceLists[2]).toContain('line_wart_001')
        expect(observedChoiceLists[2]).toContain('line_bog_002')
        expect(observedChoiceLists[2]).toContain(HASHER_AUDIT_LABEL)

        // Step 4.3 assertions
        const hasHashLog = consoleLogs.some(
            (log) =>
                log.includes('>> [PAYLOAD_HASH] Line: line_wart_001') &&
                log.includes('[OK]'),
        )
        expect(hasHashLog).toBe(true)

        const hasParityOkLog = consoleLogs.some(
            (log) =>
                log.includes(
                    '>> [PARITY_OK] Payload digest matches expected:',
                ) && log.includes('[OK]'),
        )
        expect(hasParityOkLog).toBe(true)

        // Step 4.4 assertions
        const hasParityFailLog = consoleLogs.some(
            (log) =>
                log.includes(':: [PARITY_FAIL] Digest divergence:') &&
                log.includes('expected 00000000'),
        )
        expect(hasParityFailLog).toBe(true)

        const hasBreachLog = consoleLogs.some((log) =>
            log.includes('[PAYLOAD_HASH_PARITY_BREACH]'),
        )
        expect(hasBreachLog).toBe(true)
    })
})
