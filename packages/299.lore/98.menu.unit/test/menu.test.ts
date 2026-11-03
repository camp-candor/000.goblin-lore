/**
 * packages/299.lore/98.menu.unit/test/menu.test.ts
 *
 * Vitest verification suite for 98.menu.unit.
 * Asserts headless fallback, interactive choice dispatch, and cns00 telemetry streaming.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import State from '../../99.core/state'
import { MenuModel } from '../menu.model'
import { initMenu, updateMenu } from '../buz/00.menu.buzz'

describe('98.menu.unit: Blessed Terminal Menu Integration', () => {
    let model: MenuModel

    beforeEach(() => {
        model = new MenuModel()
    })

    afterEach(() => {
        delete (globalThis as any).LIBRARY
        delete (global as any).LIBRARY
    })

    it('initMenu initializes MenuModel with code 0', () => {
        let receipt: any = null
        const bal: any = {
            idx: 'test_init',
            slv: (res: any) => {
                receipt = res
            },
        }

        const res = initMenu(model, bal, {} as any)
        expect(res.idx).toBe('98.menu')
        expect(receipt.mnuBit.val).toBe(0)
    })

    it('updateMenu executes safely in headless environments without global.LIBRARY', async () => {
        let receipt: any = null
        const bal: any = {
            idx: 'test_headless',
            slv: (res: any) => {
                receipt = res
            },
        }

        await updateMenu(model, bal, {} as any)
        expect(receipt.mnuBit.idx).toBe('update-menu-headless')
        expect(receipt.mnuBit.val).toBe(0)
    })

    it('dispatches RUN SOMATIC SAT SOLVER choice and streams output to cns00', async () => {
        const consoleLogs: string[] = []
        const mockLibrary = {
            hunt: async (action: string, payload: any) => {
                if (action === '[Open action] Open Choice') {
                    return { chcBit: { src: '2. RUN SOMATIC SAT SOLVER' } }
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

        const bal: any = { idx: 'test_sat_choice' }
        const mockState = {
            hunt: async (_act: string, _payload: any) => {
                return {
                    schBit: {
                        val: -1,
                        lst: [
                            '[SOMATIC_OVERLOAD]: Character demanded 2 hands on 1 arm',
                        ],
                    },
                }
            },
        }

        await updateMenu(model, bal, mockState as any)

        expect(model.activeSelection).toBe('2. RUN SOMATIC SAT SOLVER')
        expect(consoleLogs.some((log) => log.includes('[SAT_HALT]'))).toBe(true)
        expect(consoleLogs.some((log) => log.includes('[SAT_PASS]'))).toBe(true)
    })

    it('dispatches AUDIT KINETIC MOTOR MASKS choice and logs MOTOR_PASS', async () => {
        const consoleLogs: string[] = []
        const mockLibrary = {
            hunt: async (action: string, payload: any) => {
                if (action === '[Open action] Open Choice') {
                    return { chcBit: { src: '3. AUDIT KINETIC MOTOR MASKS' } }
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

        const bal: any = { idx: 'test_motor_choice' }
        const mockState = {
            hunt: async (_act: string, _payload: any) => {
                return {
                    schBit: {
                        val: -1,
                        lst: [
                            '[SOMATIC_MOTOR_BREACH]: Character attempted SPRINT',
                        ],
                    },
                }
            },
        }

        await updateMenu(model, bal, mockState as any)

        expect(model.activeSelection).toBe('3. AUDIT KINETIC MOTOR MASKS')
        expect(consoleLogs.some((log) => log.includes('[MOTOR_HALT]'))).toBe(
            true,
        )
        expect(consoleLogs.some((log) => log.includes('[MOTOR_PASS]'))).toBe(
            true,
        )
    })

    it('initMenu cascades into the interactive loop and releases at ROOT MENU', async () => {
        const seen: string[] = []
        const mockLibrary = {
            hunt: async (action: string, _payload: any) => {
                seen.push(action)
                if (action === '[Open action] Open Choice') {
                    return { chcBit: { src: 'ROOT MENU' } }
                }
                if (action === '[Grid action] Update Grid') {
                    return {
                        grdBit: { dat: { x: 0, y: 4, xSpan: 4, ySpan: 8 } },
                    }
                }
                return {}
            },
        }

        ;(globalThis as any).LIBRARY = mockLibrary

        let receipt: any = null
        const bal: any = {
            idx: 'test_init_cascade',
            slv: (res: any) => {
                receipt = res
            },
        }
        const mockState = {
            hunt: async (_act: string, _payload: any) => ({}),
        }

        const res = initMenu(model, bal, mockState as any)
        expect(res.idx).toBe('98.menu')
        expect(bal.val).toBe(0)
        // Resolver is held while the submenu is live...
        expect(receipt).toBeNull()

        await new Promise((r) => setTimeout(r, 100))

        // ...and released with a root-menu receipt once ROOT MENU is chosen.
        expect(receipt.mnuBit.idx).toBe('root-menu')
        expect(receipt.mnuBit.val).toBe(0)
        expect(seen).toContain('[Grid action] Update Grid')
        expect(seen).toContain('[Open action] Open Choice')
        expect(seen).toContain('[Layout action] Clear Terminal')
    })

    it('navigates [Somatic DSP Modulation Hub] -> [Extract Somatic Ledger] -> under-the-floorboards -> char_wart.md and logs exact cns00 telemetry', async () => {
        const consoleLogs: string[] = []
        const choiceQueue = [
            '[Somatic DSP Modulation Hub]',
            '[Extract Somatic Ledger]',
            'under-the-floorboards',
            'char_wart.md',
        ]
        const observedChoiceLists: string[][] = []

        const mockLibrary = {
            hunt: async (action: string, payload: any) => {
                if (action === '[Open action] Open Choice') {
                    observedChoiceLists.push(payload.lst || [])
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
        const bal: any = { idx: 'test_somatic_hub_journey' }
        await updateMenu(model, bal, liveState)

        expect(observedChoiceLists[0]).toContain('[Somatic DSP Modulation Hub]')
        expect(observedChoiceLists[1]).toContain('[Extract Somatic Ledger]')
        expect(observedChoiceLists[2]).toContain('under-the-floorboards')
        expect(observedChoiceLists[2]).toContain('wiregrass-basin')
        expect(observedChoiceLists[3]).toContain('char_wart.md')

        expect(consoleLogs).toContain(
            '>> [SOMATIC_LEDGER] Parsing Byte-0 dossier: series/under-the-floorboards/characters/wart.md',
        )
        expect(consoleLogs).toContain(
            '>> [SOMATIC_LEDGER] Verified SHA-256: 032f7... [OK]',
        )
        expect(consoleLogs).toContain(
            '>> [TRAUMA] Ingested Condition: cnd_severed_left_arm (Arm Penalty: 10,000 bps)',
        )
        expect(consoleLogs).toContain(
            '>> [TRAUMA] Ingested Condition: cnd_crushed_larynx (Pain Floor: 4,000 bps | Formant Warping: 7,000 bps)',
        )
        expect(consoleLogs).toContain(
            '>> [SQLITE] Materialized entities_somatic_live record for char_wart [OK]',
        )
    })
})
