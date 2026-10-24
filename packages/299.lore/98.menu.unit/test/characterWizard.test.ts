import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
    promptLocomotionChoice,
    CANONICAL_LOCOMOTION_CHOICES,
} from '../buz/characterWizard.buzz.js'
import { MenuModel } from '../menu.model.js'
import { reducer } from '../menu.reduce.js'
import * as Act from '../act/menu.action.js'

describe('98.menu.unit - Character Wizard Locomotion Choice Prompt', () => {
    let originalLibrary: any

    beforeEach(() => {
        originalLibrary = (globalThis as any).LIBRARY
        delete (globalThis as any).LIBRARY
    })

    afterEach(() => {
        if (originalLibrary !== undefined) {
            ;(globalThis as any).LIBRARY = originalLibrary
        } else {
            delete (globalThis as any).LIBRARY
        }
    })

    it('exposes exactly 10 canonical menu entries including CANCEL', () => {
        expect(CANONICAL_LOCOMOTION_CHOICES).toHaveLength(10)
        expect(CANONICAL_LOCOMOTION_CHOICES).toContain(
            'bipedal_hunched (8,000 bps | 0.80x)',
        )
        expect(CANONICAL_LOCOMOTION_CHOICES).toContain(
            'limping (5,000 bps | 0.50x)',
        )
        expect(CANONICAL_LOCOMOTION_CHOICES).toContain('CANCEL')
    })

    it('bypasses cleanly in headless environments without TTY', async () => {
        const model = new MenuModel()
        const slv = vi.fn()
        const result = await promptLocomotionChoice(
            model,
            { idx: 'test', slv } as any,
            {} as any,
        )

        expect(result.cancelled).toBe(false)
        expect(result.baseline).toBe('bipedal_hunched')
        expect(result.maxVelocityBps).toBe(8000)
        expect(slv).toHaveBeenCalledWith(
            expect.objectContaining({
                mnuBit: expect.objectContaining({
                    idx: 'locomotion-choice-headless',
                }),
            }),
        )
    })

    it('reducer handles PROMPT_LOCOMOTION_CHOICE action', async () => {
        const model = new MenuModel()
        const slv = vi.fn()
        const action = new Act.PromptLocomotionChoice({
            idx: 'reducer-test',
            slv,
        } as any)

        const result = reducer(model, action)
        await result

        expect(slv).toHaveBeenCalledWith(
            expect.objectContaining({
                mnuBit: expect.objectContaining({
                    idx: 'locomotion-choice-headless',
                }),
            }),
        )
    })

    it('mounts onto 12x12 grid and streams telemetry to cns00 for neuropathy_shuffle', async () => {
        const libraryCalls: { action: string; dat: any }[] = []
        ;(globalThis as any).LIBRARY = {
            hunt: async (action: string, dat: any) => {
                libraryCalls.push({ action, dat })
                if (action === '[Grid action] Update Grid') {
                    return { grdBit: { dat: 'grid-net-wizard' } }
                }
                if (action === '[Open action] Open Choice') {
                    return {
                        chcBit: {
                            src: 'neuropathy_shuffle (4,000 bps | 0.40x)',
                        },
                    }
                }
                return {}
            },
        }

        const stateDispatches: { action: string; dat: any }[] = []
        const mockSte = {
            hunt: async (action: any, dat: any) => {
                stateDispatches.push({ action, dat })
                if (action === '[Locomotion action] Validate Locomotion') {
                    return {
                        locomotionBit: {
                            dat: {
                                profile: {
                                    baseline: 'neuropathy_shuffle',
                                    max_velocity_bps: 4000,
                                    default_arms_bps: 20000,
                                    default_banned_verbs: [
                                        'dive',
                                        'leap',
                                        'rapid_stairs',
                                        'sprint',
                                        'vault',
                                    ],
                                },
                            },
                        },
                    }
                }
                return {}
            },
        }

        const model = new MenuModel()
        const slv = vi.fn()
        const result = await promptLocomotionChoice(
            model,
            { idx: 'test-neuropathy', slv } as any,
            mockSte,
        )

        expect(result.cancelled).toBe(false)
        expect(result.baseline).toBe('neuropathy_shuffle')
        expect(result.maxVelocityBps).toBe(4000)
        expect(result.bannedVerbs).toContain('sprint')

        // Verify Grid placement at x: 0, y: 4, xSpan: 4, ySpan: 11
        const gridCall = libraryCalls.find(
            (c) => c.action === '[Grid action] Update Grid',
        )
        expect(gridCall?.dat).toEqual({
            x: 0,
            y: 4,
            xSpan: 4,
            ySpan: 11,
        })

        // Verify Inter-unit validation dispatch
        const valDispatch = stateDispatches.find(
            (d) => d.action === '[Locomotion action] Validate Locomotion',
        )
        expect(valDispatch?.dat.dat.baseline).toBe('neuropathy_shuffle')

        // Verify telemetry output in cns00
        const consoleCalls = libraryCalls
            .filter((c) => c.action === '[Console action] Update Console')
            .map((c) => c.dat.src)

        expect(
            consoleCalls.some((l) =>
                l.includes(
                    '>> [LOCOMOTION UNIT] Baseline selected: neuropathy_shuffle',
                ),
            ),
        ).toBe(true)
        expect(
            consoleCalls.some((l) =>
                l.includes('>> [VELOCITY CAP] Max velocity: 4,000 bps'),
            ),
        ).toBe(true)
        expect(
            consoleCalls.some((l) => l.includes('>> [NEGATIVE MASK] Banned:')),
        ).toBe(true)
        expect(
            consoleCalls.some((l) =>
                l.includes('>> [STATUS] Stage T_0 Physical Bounds Locked [OK]'),
            ),
        ).toBe(true)
    })

    it('clamps availableArmsBps to 0 for sessile and slithering', async () => {
        const libraryCalls: { action: string; dat: any }[] = []
        ;(globalThis as any).LIBRARY = {
            hunt: async (action: string, dat: any) => {
                libraryCalls.push({ action, dat })
                if (action === '[Grid action] Update Grid') {
                    return { grdBit: { dat: 'grid-net-sessile' } }
                }
                if (action === '[Open action] Open Choice') {
                    return {
                        chcBit: { src: 'sessile (0 bps | 0.00x)' },
                    }
                }
                return {}
            },
        }

        const model = new MenuModel()
        const result = await promptLocomotionChoice(
            model,
            { idx: 'test-sessile' } as any,
            { hunt: async () => ({}) },
        )

        expect(result.baseline).toBe('sessile')
        expect(result.availableArmsBps).toBe(0)

        const consoleCalls = libraryCalls
            .filter((c) => c.action === '[Console action] Update Console')
            .map((c) => c.dat.src)

        expect(
            consoleCalls.some((l) =>
                l.includes(
                    '>> [ANATOMICAL CLAMP] Limb capacity clamped to 0 bps',
                ),
            ),
        ).toBe(true)
    })

    it('returns cancelled: true when CANCEL is selected', async () => {
        ;(globalThis as any).LIBRARY = {
            hunt: async (action: string) => {
                if (action === '[Open action] Open Choice') {
                    return { chcBit: { src: 'CANCEL' } }
                }
                return {}
            },
        }

        const model = new MenuModel()
        const result = await promptLocomotionChoice(
            model,
            { idx: 'test-cancel' } as any,
            {} as any,
        )

        expect(result.cancelled).toBe(true)
    })
})
