import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
    promptEquipmentSlots,
    loadSeriesPossessionsCatalog,
} from '../buz/characterTypeahead.buzz.js'
import { MenuModel } from '../menu.model.js'
import { reducer } from '../menu.reduce.js'
import * as Act from '../act/menu.action.js'
import { resolveRepoRoot } from '../../00.lore.unit/buz/lore.buzz.js'

describe('98.menu.unit - Character Typeahead Equipment Prompt', () => {
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

    it('safely sweeps possessions on disk without throwing', () => {
        const catalog = loadSeriesPossessionsCatalog('under-the-floorboards')
        expect(Array.isArray(catalog)).toBe(true)
    })

    it('bypasses cleanly in headless environments without TTY', async () => {
        const model = new MenuModel()
        const slv = vi.fn()
        const result = await promptEquipmentSlots(
            model,
            { idx: 'test-typeahead', src: 'under-the-floorboards', slv } as any,
            {} as any,
        )

        expect(result.cancelled).toBe(false)
        expect(result.held).toEqual([])
        expect(result.worn).toEqual([])
        expect(slv).toHaveBeenCalledWith(
            expect.objectContaining({
                mnuBit: expect.objectContaining({
                    idx: 'equipment-typeahead-headless',
                }),
            }),
        )
    })

    it('reducer handles PROMPT_EQUIPMENT_SLOTS action in headless mode', async () => {
        const model = new MenuModel()
        const slv = vi.fn()
        const action = new Act.PromptEquipmentSlots({
            idx: 'reducer-typeahead-test',
            src: 'under-the-floorboards',
            slv,
        } as any)

        const result = reducer(model, action)
        await result

        expect(slv).toHaveBeenCalledWith(
            expect.objectContaining({
                mnuBit: expect.objectContaining({
                    idx: 'equipment-typeahead-headless',
                }),
            }),
        )
    })

    it('mounts onto 12x12 grid and renders valid allocation with SAT approval', async () => {
        const libraryCalls: { action: string; dat: any }[] = []
        ;(globalThis as any).LIBRARY = {
            hunt: async (action: string, dat: any) => {
                libraryCalls.push({ action, dat })
                if (action === '[Grid action] Update Grid') {
                    return { grdBit: { dat: 'grid-net-typeahead' } }
                }
                if (action === '[Open action] Open Choice') {
                    return {
                        chcBit: {
                            src: 'item_knife (Bone Knife | 10,000 bps hands)',
                        },
                    }
                }
                return {}
            },
        }

        // Create temporary test possession item in repoRoot
        const repoRoot = resolveRepoRoot()
        const testDir = path.resolve(
            repoRoot,
            'series',
            'test-series-typeahead',
            'possessions',
        )
        fs.mkdirSync(testDir, { recursive: true })
        fs.writeFileSync(
            path.join(testDir, 'knife.md'),
            `---
id: item_knife
name: Bone Knife
hands_required_bps: 10000
mass_grams: 150
slot_category: held
---
A sharp bone knife.
`,
        )

        try {
            const model = new MenuModel()
            const slv = vi.fn()
            const result = await promptEquipmentSlots(
                model,
                {
                    idx: 'test-slot',
                    src: 'test-series-typeahead',
                    dat: { availableArmsBps: 10000 },
                    slv,
                } as any,
                {},
            )

            expect(result.cancelled).toBe(false)
            expect(result.held).toContain('item_knife')

            // Verify Grid placement at x: 0, y: 4, xSpan: 4, ySpan: 11
            const gridCall = libraryCalls.find(
                (c) => c.action === '[Grid action] Update Grid',
            )
            expect(gridCall?.dat).toEqual({
                x: 0,
                y: 4,
                w: 4,
                h: 11,
            })

            // Verify telemetry stream tags
            const consoleCalls = libraryCalls
                .filter((c) => c.action === '[Console action] Update Console')
                .map((c) => c.dat.src)

            expect(
                consoleCalls.some((l) => l.includes('>> [GEAR:RESOLVE]')),
            ).toBe(true)
            expect(consoleCalls.some((l) => l.includes('>> [SAT GATE]'))).toBe(
                true,
            )
            expect(
                consoleCalls.some((l) =>
                    l.includes(
                        '>> [STATUS] Hand Capacity Invariant Satisfied [OK]',
                    ),
                ),
            ).toBe(true)
        } finally {
            fs.rmSync(
                path.resolve(repoRoot, 'series', 'test-series-typeahead'),
                {
                    recursive: true,
                    force: true,
                },
            )
        }
    })

    it('rejects allocation when item exceeds arm capacity [DISABLED: EXCEEDS_ARM_CAPACITY]', async () => {
        const libraryCalls: { action: string; dat: any }[] = []
        ;(globalThis as any).LIBRARY = {
            hunt: async (action: string, dat: any) => {
                libraryCalls.push({ action, dat })
                if (action === '[Grid action] Update Grid') {
                    return { grdBit: { dat: 'grid-net-cleaver' } }
                }
                if (action === '[Open action] Open Choice') {
                    return {
                        chcBit: {
                            src: 'item_cleaver (Heavy Cleaver | 20,000 bps hands) [DISABLED: EXCEEDS_ARM_CAPACITY]',
                        },
                    }
                }
                return {}
            },
        }

        const repoRoot = resolveRepoRoot()
        const testDir = path.resolve(
            repoRoot,
            'series',
            'test-series-disabled',
            'possessions',
        )
        fs.mkdirSync(testDir, { recursive: true })
        fs.writeFileSync(
            path.join(testDir, 'cleaver.md'),
            `---
id: item_cleaver
name: Heavy Cleaver
hands_required_bps: 20000
mass_grams: 1200
slot_category: held
---
A heavy two-handed iron cleaver.
`,
        )

        try {
            const model = new MenuModel()
            const result = await promptEquipmentSlots(
                model,
                {
                    idx: 'test-disabled',
                    src: 'test-series-disabled',
                    dat: { availableArmsBps: 10000 },
                } as any,
                {},
            )

            // Over-allocation must be rolled back in RAM
            expect(result.held).toEqual([])

            const consoleCalls = libraryCalls
                .filter((c) => c.action === '[Console action] Update Console')
                .map((c) => c.dat.src)

            expect(
                consoleCalls.some((l) =>
                    l.includes(':: [BREACH:HALT] HAND_CAPACITY_BREACH'),
                ),
            ).toBe(true)
        } finally {
            fs.rmSync(
                path.resolve(repoRoot, 'series', 'test-series-disabled'),
                {
                    recursive: true,
                    force: true,
                },
            )
        }
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
        const result = await promptEquipmentSlots(
            model,
            { idx: 'test-cancel' } as any,
            {},
        )

        expect(result.cancelled).toBe(true)
    })
})
