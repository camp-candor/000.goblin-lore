import { describe, it, expect } from 'vitest'
import State from '../../99.core/state.js'
import { MenuModel } from '../menu.model.js'
import { updateMenu } from '../buz/00.menu.buzz.js'
import * as ActMnu from '../menu.action.js'
import { reducer } from '../menu.reduce.js'
import {
    runHygieneMenu,
    sweepMountedUnits,
    discoverMountedUnits,
    HYGIENE_LABEL,
    HYGIENE_SWEEP_LABEL,
    HYGIENE_BACK_LABEL,
} from '../menu.buzzer.js'
import { resolveLorePackageRoot } from '../menu.buzzer.js'

describe('Phase 1 Hygiene Flight Deck Menu Integration Suite', () => {
    it('Task H.1: resolves the canonical package root and exactly 47 mounted units', () => {
        const root = resolveLorePackageRoot()
        expect(root).not.toBeNull()
        const units = discoverMountedUnits(root || '')
        expect(units.length).toBe(47)
        expect(units[0]).toBe('00.lore.unit')
        expect(units).toContain('98.menu.unit')
        expect(units).toContain('99.bus.unit')
    })

    it('Task H.2: ping sweep streams deterministic 7-bit ASCII telemetry receipt', () => {
        const lines = sweepMountedUnits()
        expect(lines[0]).toBe(
            '>> [HYGIENE:SWEEP] Inspecting 47 mounted units...',
        )
        const receipt = lines[lines.length - 1]
        expect(receipt).toBe(
            '>> [HYGIENE:OK] 47/47 units resolved synchronously at T_0. Clean 7-bit ASCII verified.',
        )
        for (const line of lines) {
            for (const ch of line) {
                expect(ch.charCodeAt(0)).toBeLessThan(128)
            }
        }
    })

    it('Task H.3: runHygieneMenu streams sweep into cns00 and seals [HYGIENE:OK] receipt', async () => {
        const consoleLines: string[] = []
        const mockSte: any = {
            hunt: async (type: string, bale: any) => {
                if (type === '[Console action] Update Console') {
                    consoleLines.push(bale.src)
                }
                if (bale?.slv) {
                    bale.slv({ val: 1 })
                }
            },
        }

        const model = new MenuModel()
        let resolved: any = null
        runHygieneMenu(
            model,
            {
                idx: 'test-hygiene',
                slv: (res: any) => {
                    resolved = res
                },
            } as any,
            mockSte,
        )

        expect(resolved?.mnuBit?.val).toBe(1)
        expect(model.lastLifecycleReceipt).toBe('[HYGIENE:OK]')
        expect(consoleLines).toContain(
            '>> [HYGIENE:SWEEP] Inspecting 47 mounted units...',
        )
        expect(consoleLines).toContain(
            '>> [HYGIENE:OK] 47/47 units resolved synchronously at T_0. Clean 7-bit ASCII verified.',
        )
    })

    it('Task H.4: OpenHygieneMenu action reduces into ping sweep selection receipt', async () => {
        const consoleLines: string[] = []
        const mockSte: any = {
            hunt: async (type: string, bale: any) => {
                if (type === '[Console action] Update Console') {
                    consoleLines.push(bale.src)
                }
                if (bale?.slv) {
                    bale.slv({ val: 1 })
                }
            },
        }

        const model = new MenuModel()
        const next = await reducer(
            model,
            new ActMnu.OpenHygieneMenu({ idx: 'test-hygiene-reduce' } as any),
            mockSte,
        )

        expect(next.lastLifecycleReceipt).toBe('[HYGIENE:OK]')
        expect(consoleLines.some((l) => l.includes('>> [HYGIENE:SWEEP]'))).toBe(
            true,
        )
    })

    it('Task H.5: hygiene menu labels are pure 7-bit ASCII', () => {
        for (const label of [
            HYGIENE_LABEL,
            HYGIENE_SWEEP_LABEL,
            HYGIENE_BACK_LABEL,
        ]) {
            for (const ch of label) {
                expect(ch.charCodeAt(0)).toBeLessThan(128)
            }
        }
        expect(HYGIENE_LABEL).toBe('[HYGIENE]')
        expect(HYGIENE_SWEEP_LABEL).toBe('[1] RUN UNIT BUZZER PING SWEEP')
    })

    it('Task H.6: executes Level 4 TUI journey: [HYGIENE] -> [1] RUN UNIT BUZZER PING SWEEP -> [ BACK ]', async () => {
        const consoleLogs: string[] = []
        const choiceQueue: string[] = ['[HYGIENE]', HYGIENE_SWEEP_LABEL]
        const observedChoiceLists: string[][] = []

        const mockLibrary = {
            hunt: async (action: string, payload: any) => {
                if (action === '[Open action] Open Choice') {
                    observedChoiceLists.push(payload.lst || [])
                    const focused = choiceQueue[0] || HYGIENE_SWEEP_LABEL
                    if (payload.dat?.cb) {
                        await payload.dat.cb(focused)
                    }
                    const nextChoice = choiceQueue.shift() || HYGIENE_BACK_LABEL
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
        ;(global as any).LIBRARY = mockLibrary

        const liveState = new State()
        const journeyModel = new MenuModel()
        const bal: any = { idx: 'test_hygiene_tui_journey' }
        await updateMenu(journeyModel, bal, liveState)

        expect(observedChoiceLists[0]).toContain('[HYGIENE]')
        expect(observedChoiceLists[1]).toContain(HYGIENE_SWEEP_LABEL)
        expect(observedChoiceLists[1]).toContain('[ BACK ]')

        expect(consoleLogs).toContain(
            ':: Open the hygiene flight deck to ping every mounted unit buzzer.',
        )
        expect(consoleLogs).toContain(
            ':: Ping every mounted 299.lore unit buzzer synchronously and verify 7-bit ASCII hygiene.',
        )
        expect(consoleLogs).toContain(
            '>> [HYGIENE:DISPATCH] Launching unit buzzer ping sweep...',
        )
        expect(consoleLogs).toContain(
            '>> [HYGIENE:SWEEP] Inspecting 47 mounted units...',
        )
        expect(consoleLogs).toContain(
            '>> [HYGIENE:OK] 47/47 units resolved synchronously at T_0. Clean 7-bit ASCII verified.',
        )
        expect(journeyModel.lastLifecycleReceipt).toBe('[HYGIENE:OK]')

        await new Promise((r) => setTimeout(r, 500))
    })
})
