import { describe, it, expect, afterEach } from 'vitest'
import { MenuModel } from '../menu.model.js'
import { promptLocomotionChoice } from '../buz/locomotionMenu.buzz.js'
import { LOCOMOTION_PROFILES } from '../../19.locomotion.unit/val/locomotion.val.js'

describe('98.menu.unit :: [Feature 1.4] Somatic Locomotion Profile Selector', () => {
    afterEach(() => {
        delete (globalThis as any).LIBRARY
        delete (global as any).LIBRARY
    })

    it('anchors left pane (0,4,4,11) with net, displays 9 gaits + CANCEL, and emits cns00 telemetry', async () => {
        const gridCalls: any[] = []
        const consoleMessages: string[] = []
        let observedChoices: string[] = []

        ;(globalThis as any).LIBRARY = {
            hunt: async (action: string, payload: any) => {
                if (action === '[Console action] Update Console') {
                    consoleMessages.push(payload?.src || '')
                    return {}
                }
                if (action === '[Grid action] Update Grid') {
                    gridCalls.push(payload)
                    return {
                        grdBit: {
                            dat: {
                                left: '0%',
                                top: '33%',
                                width: '33%',
                                height: '91%',
                            },
                        },
                    }
                }
                if (action === '[Open action] Open Choice') {
                    expect(payload.net).toBeDefined()
                    observedChoices = payload.lst
                    return {
                        chcBit: {
                            src: LOCOMOTION_PROFILES.neuropathy_shuffle.label,
                            val: 7,
                        },
                    }
                }
                return {}
            },
        }

        const model = new MenuModel()
        let resolved: any = null
        await promptLocomotionChoice(model, {
            idx: 'test-locomotion',
            slv: (res: any) => {
                resolved = res
            },
        })

        expect(gridCalls[0]).toEqual({ x: 0, y: 4, xSpan: 4, ySpan: 11 })
        expect(observedChoices).toHaveLength(10)
        expect(observedChoices[9]).toBe('CANCEL')
        expect(resolved?.mnuBit?.val).toBe(1)
        expect(resolved?.mnuBit?.src).toBe('neuropathy_shuffle')
        expect(consoleMessages).toContain(
            '>> [LOCOMOTION UNIT] Baseline selected: neuropathy_shuffle',
        )
        expect(consoleMessages).toContain(
            '>> [VELOCITY CAP] Max velocity: 4,000 bps',
        )
        expect(consoleMessages).toContain(
            '>> [NEGATIVE MASK] Banned: ["sprint","vault","leap","rapid_stairs","dive"]',
        )
        expect(consoleMessages).toContain(
            '>> [STATUS] Stage T_0 Physical Bounds Locked [OK]',
        )
    })

    it('[Level 2 Trap] emits 0-arm clamp telemetry for sessile baseline', async () => {
        const consoleMessages: string[] = []
        ;(globalThis as any).LIBRARY = {
            hunt: async (action: string, payload: any) => {
                if (action === '[Console action] Update Console') {
                    consoleMessages.push(payload?.src || '')
                    return {}
                }
                if (action === '[Grid action] Update Grid') {
                    return {
                        grdBit: {
                            dat: {
                                left: '0%',
                                top: '33%',
                                width: '33%',
                                height: '91%',
                            },
                        },
                    }
                }
                if (action === '[Open action] Open Choice') {
                    return {
                        chcBit: {
                            src: LOCOMOTION_PROFILES.sessile.label,
                            val: 5,
                        },
                    }
                }
                return {}
            },
        }

        let resolved: any = null
        await promptLocomotionChoice(new MenuModel(), {
            idx: 'test-sessile',
            slv: (res: any) => {
                resolved = res
            },
        })

        expect(resolved?.mnuBit?.dat?.profile?.default_arms_bps).toBe(0)
        expect(
            consoleMessages.some((m) => m.includes('availableArmsBps: 0')),
        ).toBe(true)
    })

    it('[Level 2 Trap] aborts cleanly on CANCEL or Escape (val=-1) without mutating disk', async () => {
        ;(globalThis as any).LIBRARY = {
            hunt: async (action: string) => {
                if (action === '[Grid action] Update Grid') {
                    return {
                        grdBit: {
                            dat: {
                                left: '0%',
                                top: '33%',
                                width: '33%',
                                height: '91%',
                            },
                        },
                    }
                }
                if (action === '[Open action] Open Choice') {
                    return { chcBit: { src: '', val: -1 } }
                }
                return {}
            },
        }

        let resolvedEsc: any = null
        await promptLocomotionChoice(new MenuModel(), {
            idx: 'test-esc',
            slv: (res: any) => {
                resolvedEsc = res
            },
        })
        expect(resolvedEsc?.mnuBit?.val).toBe(0)
        expect(resolvedEsc?.mnuBit?.idx).toBe('prompt-locomotion-cancel')
    })

    it('[Level 2 Trap] resolves deterministically headless when LIBRARY is undefined', async () => {
        delete (globalThis as any).LIBRARY
        delete (global as any).LIBRARY

        let resolved: any = null
        await promptLocomotionChoice(new MenuModel(), {
            idx: 'test-headless',
            slv: (res: any) => {
                resolved = res
            },
        })
        expect(resolved?.mnuBit?.val).toBe(1)
        expect(resolved?.mnuBit?.src).toBe('bipedal_standard')
    })
})
