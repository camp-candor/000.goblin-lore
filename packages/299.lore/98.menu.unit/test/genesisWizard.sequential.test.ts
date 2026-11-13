import { describe, it, expect, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { MenuModel } from '../menu.model.js'
import { runSeriesGenesisMenu } from '../buz/genesisMenu.buzz.js'
import { SeriesConfigSchema } from '../../29.series.unit/fce/series.schema.js'
import {
    promptBlessedChoice,
    promptBlessedInput,
    sanitizeSeriesSlug,
} from '../buz/blessedModal.buzz.js'

describe('299.lore - [Feature 1.1] Sequential Four-Tuple Parameterization Wizard', () => {
    afterEach(() => {
        delete (globalThis as any).LIBRARY
        delete (global as any).LIBRARY
    })

    it('[Task 1.1.1] promptBlessedChoice anchors grid (0,4,4,8) and handles selection', async () => {
        const gridCalls: any[] = []
        ;(globalThis as any).LIBRARY = {
            hunt: async (action: string, payload: any) => {
                if (action === '[Grid action] Update Grid') {
                    gridCalls.push(payload)
                    return {
                        grdBit: {
                            dat: {
                                left: '0%',
                                top: '33%',
                                width: '33%',
                                height: '66%',
                            },
                        },
                    }
                }
                if (action === '[Open action] Open Choice') {
                    expect(payload.net).toBeDefined()
                    return {
                        chcBit: {
                            src: '[3] SUPERHERO URBAN VIGILANTE',
                            val: 2,
                        },
                    }
                }
                return {}
            },
        }

        const res = await promptBlessedChoice({
            promptHeader: 'Select Genre',
            choices: [
                '[1] LOW FANTASY FARCE (Default)',
                '[3] SUPERHERO URBAN VIGILANTE',
            ],
        })

        expect(res.cancelled).toBe(false)
        expect(res.value).toBe('[3] SUPERHERO URBAN VIGILANTE')
        expect(gridCalls[0]).toEqual({ x: 0, y: 4, xSpan: 4, ySpan: 8 })
    })

    it('[Task 1.1.3] promptBlessedInput captures and sanitizes series slug strings', async () => {
        ;(globalThis as any).LIBRARY = {
            hunt: async (action: string) => {
                if (action === '[Grid action] Update Grid') {
                    return {
                        grdBit: {
                            dat: {
                                left: '0%',
                                top: '33%',
                                width: '33%',
                                height: '33%',
                            },
                        },
                    }
                }
                if (action === '[Open action] Open Input') {
                    return {
                        putBit: { src: '  Gotham_Trinity Crisis!!  ', val: 0 },
                    }
                }
                return {}
            },
        }

        const res = await promptBlessedInput({
            promptLabel: 'Enter Slug',
            defaultValue: 'ashfall-basin',
            sanitizeSlug: true,
        })

        expect(res.cancelled).toBe(false)
        expect(res.value).toBe('gotham-trinity-crisis')
        expect(sanitizeSeriesSlug('')).toBe('ashfall-basin')
    })

    it('[Task 1.1.2] runSeriesGenesisMenu chains 6 sequential modals and dispatches 4-Tuple to 29.series.unit', async () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'genesis-seq-'))
        const inputQueue = [
            'gotham-trinity-crisis',
            'Two heroes enforce restraint while an anarchist weaponizes chaos.',
        ]
        const choiceQueue = [
            '[3] SUPERHERO URBAN VIGILANTE',
            '[2] URBAN CRISIS (6000 bp / Paranoia 8000 bp)',
            '[2] HEROIC KINETIC (FLY, GRAPNEL, LASSO_BIND, GLIDE, DEFLECT, DETONATE)',
            '[2] NOIR ACOUSTIC (Farce <= 1000 bp / Floor 2200 cdB)',
        ]
        const dispatchedActions: Array<{ type: string; bale: any }> = []

        ;(globalThis as any).LIBRARY = {
            hunt: async (action: string) => {
                if (action === '[Grid action] Update Grid') {
                    return {
                        grdBit: {
                            dat: {
                                left: '0%',
                                top: '33%',
                                width: '33%',
                                height: '66%',
                            },
                        },
                    }
                }
                if (action === '[Open action] Open Input') {
                    return { putBit: { src: inputQueue.shift() || '', val: 0 } }
                }
                if (action === '[Open action] Open Choice') {
                    return {
                        chcBit: { src: choiceQueue.shift() || '', val: 0 },
                    }
                }
                return {}
            },
        }

        const mockSte: any = {
            hunt: async (type: string, bale: any) => {
                dispatchedActions.push({ type, bale })
                return { seriesBit: { val: 1 } }
            },
        }

        const model = new MenuModel()
        let resolved: any = null
        await runSeriesGenesisMenu(
            model,
            {
                idx: 'test-seq-wizard',
                dat: { repoRoot: tempRoot },
                slv: (res: any) => {
                    resolved = res
                },
            },
            mockSte,
        )

        expect(resolved?.mnuBit?.val).toBe(1)
        expect(resolved?.mnuBit?.src).toBe('gotham-trinity-crisis')
        const scaffoldCall = dispatchedActions.find(
            (a) => a.type === '[Series action] Scaffold Series Tree',
        )
        expect(scaffoldCall).toBeDefined()
        expect(scaffoldCall?.bale?.dat?.config?.genre_tag).toBe(
            'SUPERHERO_URBAN_VIGILANTE',
        )
        expect(
            scaffoldCall?.bale?.dat?.config?.state_space?.scarcity_index_bp,
        ).toBe(6000)
        expect(
            scaffoldCall?.bale?.dat?.config?.action_vocabulary
                ?.permitted_kinetic_verbs,
        ).toContain('FLY')
        expect(
            scaffoldCall?.bale?.dat?.config?.invariant_rules
                ?.global_acoustic_floor_cdb,
        ).toBe(2200)
        expect(
            SeriesConfigSchema.safeParse(scaffoldCall?.bale?.dat?.config)
                .success,
        ).toBe(true)

        fs.rmSync(tempRoot, { recursive: true, force: true })
    })

    it('[Task 1.1.2] runSeriesGenesisMenu aborts cleanly without mutating disk when operator cancels', async () => {
        ;(globalThis as any).LIBRARY = {
            hunt: async (action: string) => {
                if (action === '[Open action] Open Input') {
                    return { putBit: { src: '', val: -1 } }
                }
                return {}
            },
        }

        const model = new MenuModel()
        let resolved: any = null
        await runSeriesGenesisMenu(
            model,
            {
                idx: 'test-cancel',
                slv: (res: any) => {
                    resolved = res
                },
            },
            { hunt: async () => ({}) } as any,
        )

        expect(resolved?.mnuBit?.val).toBe(0)
        expect(resolved?.mnuBit?.dat?.cancelled).toBe(true)
        expect(model.lastLifecycleReceipt).toBe('[GENESIS:CANCELLED]')
    })

    it('[Level 2 Trap] mid-wizard [CANCEL] at Step 4 emits [GENESIS:CANCELLED] and dispatches zero writes', async () => {
        const consoleMessages: string[] = []
        const dispatchedActions: string[] = []
        let choiceStep = 0
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
                                height: '66%',
                            },
                        },
                    }
                }
                if (action === '[Open action] Open Input') {
                    return { putBit: { src: 'gotham-trinity-crisis', val: 0 } }
                }
                if (action === '[Open action] Open Choice') {
                    choiceStep += 1
                    if (choiceStep === 1) {
                        return {
                            chcBit: {
                                src: '[3] SUPERHERO URBAN VIGILANTE',
                                val: 2,
                            },
                        }
                    }
                    if (choiceStep === 2) {
                        return {
                            chcBit: {
                                src: '[2] URBAN CRISIS (6000 bp / Paranoia 8000 bp)',
                                val: 1,
                            },
                        }
                    }
                    return { chcBit: { src: '[CANCEL]', val: 3 } }
                }
                return {}
            },
        }

        const mockSte: any = {
            hunt: async (type: string) => {
                dispatchedActions.push(type)
                return {}
            },
        }

        const model = new MenuModel()
        let resolved: any = null
        await runSeriesGenesisMenu(
            model,
            {
                idx: 'test-mid-cancel',
                slv: (res: any) => {
                    resolved = res
                },
            },
            mockSte,
        )

        expect(resolved?.mnuBit?.val).toBe(0)
        expect(resolved?.mnuBit?.dat?.cancelled).toBe(true)
        expect(model.lastLifecycleReceipt).toBe('[GENESIS:CANCELLED]')
        expect(
            consoleMessages.some((m) => m.includes('>> [GENESIS:CANCELLED]')),
        ).toBe(true)
        expect(dispatchedActions).toHaveLength(0)
    })

    it('[Level 2 Trap] headless fallback with LIBRARY undefined resolves cleanly without ReferenceError', async () => {
        delete (globalThis as any).LIBRARY
        delete (global as any).LIBRARY

        const tempRoot = fs.mkdtempSync(
            path.join(os.tmpdir(), 'genesis-headless-'),
        )
        const dispatchedActions: string[] = []
        const mockSte: any = {
            hunt: async (type: string) => {
                dispatchedActions.push(type)
                return { seriesBit: { val: 1 } }
            },
        }

        const model = new MenuModel()
        let resolved: any = null
        await runSeriesGenesisMenu(
            model,
            {
                idx: 'test-headless',
                dat: { repoRoot: tempRoot },
                slv: (res: any) => {
                    resolved = res
                },
            },
            mockSte,
        )

        expect(resolved?.mnuBit?.val).toBe(1)
        expect(resolved?.mnuBit?.src).toBe('ashfall-basin')
        expect(dispatchedActions).toContain(
            '[Series action] Scaffold Series Tree',
        )
        fs.rmSync(tempRoot, { recursive: true, force: true })
    })
})
