/**
 * packages/299.lore/98.menu.unit/test/menu.fact.staleness.test.ts
 *
 * Vitest verification suite for the Monotonic Fact Staleness Checker
 * journey: [Somatic DSP Modulation Hub] -> [Monotonic Fact Staleness Checker] ->
 * sc_culvert_siphon_02 (clean & dirty), asserting exact cns00 telemetry.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import State from '../../99.core/state.js'
import { MenuModel } from '../menu.model.js'
import { updateMenu } from '../buz/00.menu.buzz.js'
import {
    STALENESS_SCENE_OPTIONS,
    STALENESS_BACK_LABEL,
    SCENARIO_CLEAN_LABEL,
    SCENARIO_MUTATED_LABEL,
} from '../buz/12.fact.staleness.buzz.js'

describe('98.menu.unit: Monotonic Fact Staleness Checker journey', () => {
    let model: MenuModel

    beforeEach(() => {
        model = new MenuModel()
    })

    afterEach(() => {
        delete (globalThis as any).LIBRARY
        delete (global as any).LIBRARY
    })

    it('navigates to Monotonic Fact Staleness Checker and audits sc_culvert_siphon_02 clean and dirty', async () => {
        const consoleLogs: string[] = []
        const choiceQueue = [
            '[Somatic DSP Modulation Hub]',
            '[Monotonic Fact Staleness Checker]',
            'sc_culvert_siphon_02',
            SCENARIO_CLEAN_LABEL,
            'sc_culvert_siphon_02',
            SCENARIO_MUTATED_LABEL,
            STALENESS_BACK_LABEL,
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
        const bal: any = { idx: 'test_fact_staleness_journey' }
        await updateMenu(model, bal, liveState)

        expect(observedChoiceLists[0]).toContain('[Somatic DSP Modulation Hub]')
        expect(observedChoiceLists[1]).toContain(
            '[Monotonic Fact Staleness Checker]',
        )
        expect(observedChoiceLists[2]).toContain('sc_culvert_siphon_02')
        expect(observedChoiceLists[2]).toContain('sc_boiler_flue_01')

        expect(consoleLogs).toContain(
            '>> [STALENESS] Evaluated sc_culvert_siphon_02 -> [OK] CLEAN',
        )
        expect(consoleLogs).toContain(
            '>> [STALENESS] Evaluated sc_culvert_siphon_02 -> [!] DIRTY (1 mutated facts)',
        )
        expect(consoleLogs).toContain(
            '>> [VERSION_BUMP] Upstream fact mutated: fact_wart_arm_severed (v2 -> v3) | Old: [Wart severed left arm below elbow.] -> New: [Wart left arm amputated at shoulder joint.]',
        )
    })
})
