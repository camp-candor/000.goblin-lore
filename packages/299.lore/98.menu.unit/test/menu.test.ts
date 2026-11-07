/**
 * packages/299.lore/98.menu.unit/test/menu.test.ts
 *
 * Vitest verification suite for 98.menu.unit.
 * Asserts headless fallback, interactive choice dispatch, and cns00 telemetry streaming.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import State from '../../99.core/state.js'
import { MenuModel } from '../menu.model.js'
import { initMenu, updateMenu } from '../buz/00.menu.buzz.js'
import { reducer } from '../menu.reduce.js'
import * as Act from '../menu.action.js'
import {
    SOMATIC_MENU_CHOICES,
    getSomaticChoiceList,
    getChoiceById,
    dispatchSomaticChoice,
} from '../buz/somaticMenu.buzz.js'

describe('98.menu.unit: Blessed Terminal Menu Integration', () => {
    let model: MenuModel

    beforeEach(() => {
        model = new MenuModel()
    })

    afterEach(() => {
        delete (globalThis as any).LIBRARY
        delete (global as any).LIBRARY
    })

    it('initMenu initializes MenuModel with headless code 1', () => {
        let receipt: any = null
        const bal: any = {
            idx: 'test_init',
            slv: (res: any) => {
                receipt = res
            },
        }

        const res = initMenu(model, bal, {} as any)
        expect(res.idx).toBe('98.menu')
        expect(receipt.mnuBit.val).toBe(1)
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
        expect(receipt.mnuBit.val).toBe(1)
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
        expect(
            consoleLogs.some((l) =>
                /^>> \[SOMATIC_LEDGER\] Verified SHA-256: [0-9a-f]{5}\.\.\. \[OK\]$/.test(
                    l,
                ),
            ),
        ).toBe(true)
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

    it('executes Level 4 TUI journey: [Somatic DSP Modulation Hub] -> tooltip -> [9] RUN FULL SOMATIC DSP VERIFICATION SWEEP -> [0] ROOT MENU', async () => {
        const consoleLogs: string[] = []
        const choiceQueue = [
            '[Somatic DSP Modulation Hub]',
            '[9] RUN FULL SOMATIC DSP VERIFICATION SWEEP',
        ]
        const observedChoiceLists: string[][] = []

        const mockLibrary = {
            hunt: async (action: string, payload: any) => {
                if (action === '[Open action] Open Choice') {
                    observedChoiceLists.push(payload.lst || [])
                    if (payload.dat?.cb) {
                        await payload.dat.cb(
                            '[9] RUN FULL SOMATIC DSP VERIFICATION SWEEP',
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
        const bal: any = { idx: 'test_somatic_hub_gauntlet_journey' }
        await updateMenu(model, bal, liveState)

        expect(observedChoiceLists[0]).toContain('[Somatic DSP Modulation Hub]')
        expect(observedChoiceLists[1]).toContain(
            '[9] RUN FULL SOMATIC DSP VERIFICATION SWEEP',
        )
        expect(observedChoiceLists[1]).toContain('[0] ROOT MENU')

        expect(consoleLogs).toContain(
            ':: [TOOLTIP] [9] RUN FULL SOMATIC DSP VERIFICATION SWEEP -> Execute end-to-end integration pass across all 5 somatic units with zero cloud spend at T0 = $0.00.',
        )
        expect(consoleLogs).toContain(
            '>> [DISPATCH] Executing: [9] RUN FULL SOMATIC DSP VERIFICATION SWEEP',
        )
        expect(consoleLogs).toContain(
            '>> [STAGE_1] Float Metric Trap -> [OK] TRAPPED',
        )
        expect(consoleLogs).toContain(
            '>> [STAGE_2] Strict Key Closure Trap -> [OK] TRAPPED',
        )
        expect(consoleLogs).toContain(
            '>> [STAGE_3] Aphonia Delivery Trap -> [OK] TRAPPED',
        )
        expect(consoleLogs).toContain(
            '>> [STAGE_4] Monotonic Regression Trap -> [OK] TRAPPED',
        )
        expect(consoleLogs).toContain(
            '>> [STAGE_5] Hash Parity Sentinel Trap -> [OK] TRAPPED',
        )
        expect(consoleLogs).toContain(
            '>> [RECEIPT] [GAUNTLET_PASS: 5/5 TRAPS VERIFIED AT T0 = $0.00] Finished [OK]',
        )
    })
})

describe('98.menu.unit: Phase 7 Somatic DSP Contracts', () => {
    afterEach(() => {
        delete (globalThis as any).LIBRARY
        delete (global as any).LIBRARY
    })

    it('exposes a frozen 10-choice Somatic DSP catalog with pure ASCII labels', () => {
        expect(SOMATIC_MENU_CHOICES).toHaveLength(10)
        expect(Object.isFrozen(SOMATIC_MENU_CHOICES)).toBe(true)
        expect(getSomaticChoiceList()).toHaveLength(10)
        expect(getChoiceById('CHOICE_ROOT_RETURN')?.label).toBe('[0] ROOT MENU')
        expect(getSomaticChoiceList().join('\n')).toMatch(/^[\x00-\x7F\n]*$/)
    })

    it('dispatches the first four canonical Somatic DSP choices headlessly', async () => {
        const ste = new State() as any
        ste.hunt = async () => ({})

        const thermo = await dispatchSomaticChoice(
            'CHOICE_THERMODYNAMIC_SIM',
            ste,
        )
        const paranoia = await dispatchSomaticChoice(
            'CHOICE_PARANOIA_CLOCK',
            ste,
        )
        const dsp = await dispatchSomaticChoice('CHOICE_ALGEBRAIC_DSP', ste)
        const postBreak = await dispatchSomaticChoice('CHOICE_POST_BREAK', ste)

        expect(thermo.receiptTag).toBe('[THERMODYNAMIC_FLOW:OK]')
        expect(paranoia.receiptTag).toBe('[ACOUSTIC_IMPULSE:OK]')
        expect(dsp.receiptTag).toBe('[ALGEBRAIC_DSP:OK]')
        expect(postBreak.receiptTag).toBe('[POST_BREAK:OK]')
    })

    it('keeps reducer state isolated under clone-deep for INIT_MENU', () => {
        const original = new MenuModel()
        original.activeSelection = 'SENTINEL_STATE'
        const action = new Act.InitMenu({
            idx: 'immutability-check',
            slv: () => {},
        })

        const result = reducer(original, action, {} as any)

        expect(original.activeSelection).toBe('SENTINEL_STATE')
        expect(result).toBe(original)
    })

    it('streams canonical focus tooltips and dispatch receipts for Somatic choices', async () => {
        const streamedLog: string[] = []
        const consoleWrites: any[] = []
        const choiceOpens: any[] = []
        const library = {
            hunt: async (type: string, payload: any) => {
                if (type === '[Grid action] Update Grid') {
                    return { grdBit: { dat: { net: 'grid-net' } } }
                }
                if (type === '[Console action] Update Console') {
                    consoleWrites.push(payload)
                    if (payload?.src) streamedLog.push(payload.src)
                    return {}
                }
                if (type === '[Open action] Open Choice') {
                    choiceOpens.push(payload)
                    await payload.dat.cb(SOMATIC_MENU_CHOICES[0].label)
                    return {
                        chcBit: {
                            src: SOMATIC_MENU_CHOICES[0].label,
                            dat: payload,
                        },
                    }
                }
                return {}
            },
        }
        ;(globalThis as any).LIBRARY = library
        ;(global as any).LIBRARY = library

        const ste = new State() as any
        ste.hunt = async () => ({})
        const model = new MenuModel()
        const bal: any = { idx: 'tooltip-test', slv: () => {} }

        await updateMenu(model, bal, ste)

        expect(choiceOpens).toHaveLength(1)
        expect(choiceOpens[0].dat.cb).toBeTypeOf('function')
        expect(streamedLog).toContain(
            `:: [TOOLTIP] ${SOMATIC_MENU_CHOICES[0].label} -> ${SOMATIC_MENU_CHOICES[0].tooltip}`,
        )
        expect(model.activeSelection).toBe(SOMATIC_MENU_CHOICES[0].label)
        expect(model.totalInteractions).toBe(1)
        expect(model.lastSomaticReceipt).toBe('[THERMODYNAMIC_FLOW:OK]')
        expect(
            consoleWrites.some((w) => w.src?.includes('>> [DISPATCH]')),
        ).toBe(true)
        expect(consoleWrites.some((w) => w.src?.includes('>> [RECEIPT]'))).toBe(
            true,
        )
    })
})
