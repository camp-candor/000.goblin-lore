import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { MenuModel } from '../menu.model.js'
import { SWITCH_SERIES_LABEL, updateMenu } from '../buz/00.menu.buzz.js'
import { promptSeriesSelectionModal } from '../buz/seriesSelectionMenu.buzz.js'

describe('98.menu.unit: [Feature 1.1] Series Selection Modal & Menu Wiring', () => {
    let model: MenuModel
    let tempDirs: string[]
    const origCwd = process.cwd()

    beforeEach(() => {
        model = new MenuModel()
        tempDirs = []
    })

    afterEach(() => {
        process.chdir(origCwd)
        delete (globalThis as any).LIBRARY
        delete (global as any).LIBRARY
        for (const dir of tempDirs) {
            if (fs.existsSync(dir)) {
                fs.rmSync(dir, { recursive: true, force: true })
            }
        }
    })

    const createTempSeriesRoot = (slugs: string[]): string => {
        const root = fs.mkdtempSync(path.join(os.tmpdir(), 'menu-series-sel-'))
        tempDirs.push(root)
        for (const slug of slugs) {
            const dir = path.join(root, 'series', slug)
            fs.mkdirSync(dir, { recursive: true })
            fs.writeFileSync(
                path.join(dir, 'series.config.json'),
                JSON.stringify({ series_slug: slug, schema_version: '1.0.0' }),
                'utf-8',
            )
        }
        return root
    }

    it('updateMenu exposes SWITCH_SERIES_LABEL in OPEN_CHOICE lst', async () => {
        const capturedChoices: string[][] = []
        ;(globalThis as any).LIBRARY = {
            hunt: async (event: string, payload: any) => {
                if (event === '[Open action] Open Choice') {
                    capturedChoices.push(payload?.lst ?? [])
                    return { chcBit: { src: '[<] QUIT' } }
                }
                if (event === '[Grid action] Update Grid') {
                    return { grdBit: { dat: { x: 0, y: 0 } } }
                }
                return {}
            },
        }

        let receipt: any = null
        await updateMenu(
            model,
            {
                idx: 'test_menu_switch',
                slv: (res: any) => {
                    receipt = res
                },
            },
            { hunt: (globalThis as any).LIBRARY.hunt } as any,
        )

        expect(capturedChoices.length).toBeGreaterThan(0)
        expect(capturedChoices[0]).toContain(SWITCH_SERIES_LABEL)
        expect(SWITCH_SERIES_LABEL).toBe('[S] SWITCH ACTIVE SERIES')
        expect(receipt).toBeTruthy()
    })

    it('promptSeriesSelectionModal binds cpy.activeSeries and emits discovery & active telemetry', async () => {
        const tempRoot = createTempSeriesRoot([
            'alpha-chronicle',
            'beta-chronicle',
        ])
        process.chdir(tempRoot)

        const logs: string[] = []
        let openChoicePayload: any = null
        ;(globalThis as any).LIBRARY = {
            hunt: async (event: string, payload: any) => {
                if (event === '[Grid action] Update Grid') {
                    return {
                        grdBit: { dat: { x: 0, y: 4, xSpan: 4, ySpan: 10 } },
                    }
                }
                if (event === '[Open action] Open Choice') {
                    openChoicePayload = payload
                    return { chcBit: { src: '[2] beta-chronicle' } }
                }
                if (event === '[Console action] Update Console') {
                    logs.push(payload?.src ?? '')
                }
                return {}
            },
        }

        let receipt: any = null
        const ste: any = {
            hunt: (globalThis as any).LIBRARY.hunt,
        }

        await promptSeriesSelectionModal(
            model,
            {
                idx: 'test_select',
                slv: (res: any) => {
                    receipt = res
                },
            },
            ste,
        )

        expect(openChoicePayload).toBeTruthy()
        expect(openChoicePayload.src).toBe('VERTICAL')
        expect(openChoicePayload.net).toEqual({
            x: 0,
            y: 4,
            xSpan: 4,
            ySpan: 10,
        })
        expect(openChoicePayload.lst).toEqual([
            '[1] alpha-chronicle',
            '[2] beta-chronicle',
            '[<] RETURN TO LORE MENU',
        ])
        expect(model.activeSeries).toBe('beta-chronicle')
        expect(receipt?.mnuBit?.idx).toBe('series-discovery-success')
        expect(receipt?.mnuBit?.src).toBe('beta-chronicle')
        expect(receipt?.mnuBit?.val).toBe(1)
        expect(receipt?.mnuBit?.dat?.activeSlug).toBe('beta-chronicle')
        expect(
            logs.some((l) =>
                l.includes(
                    '>> [SERIES:DISCOVERY] Discovered 2 series namespace(s) on disk.',
                ),
            ),
        ).toBe(true)
        expect(
            logs.some((l) =>
                l.includes(
                    '>> [SERIES:ACTIVE] Bound active series namespace to: beta-chronicle [OK]',
                ),
            ),
        ).toBe(true)
    })

    it('promptSeriesSelectionModal handles void state without opening choice modal', async () => {
        const tempRoot = createTempSeriesRoot([])
        process.chdir(tempRoot)

        const logs: string[] = []
        let choiceOpened = false
        ;(globalThis as any).LIBRARY = {
            hunt: async (event: string, payload: any) => {
                if (event === '[Open action] Open Choice') {
                    choiceOpened = true
                }
                if (event === '[Console action] Update Console') {
                    logs.push(payload?.src ?? '')
                }
                return {}
            },
        }

        let receipt: any = null
        await promptSeriesSelectionModal(
            model,
            {
                idx: 'test_void',
                slv: (res: any) => {
                    receipt = res
                },
            },
            { hunt: (globalThis as any).LIBRARY.hunt } as any,
        )

        expect(choiceOpened).toBe(false)
        expect(receipt?.mnuBit?.idx).toBe('series-discovery-void')
        expect(receipt?.mnuBit?.val).toBe(0)
        expect(logs.some((l) => l.includes('Void state detected'))).toBe(true)
    })

    it('promptSeriesSelectionModal handles operator cancellation via [<] RETURN TO LORE MENU', async () => {
        const tempRoot = createTempSeriesRoot(['alpha-chronicle'])
        process.chdir(tempRoot)
        model.activeSeries = 'existing-series'

        const logs: string[] = []
        ;(globalThis as any).LIBRARY = {
            hunt: async (event: string, payload: any) => {
                if (event === '[Grid action] Update Grid') {
                    return {
                        grdBit: { dat: { x: 0, y: 4, xSpan: 4, ySpan: 10 } },
                    }
                }
                if (event === '[Open action] Open Choice') {
                    return { chcBit: { src: '[<] RETURN TO LORE MENU' } }
                }
                if (event === '[Console action] Update Console') {
                    logs.push(payload?.src ?? '')
                }
                return {}
            },
        }

        let receipt: any = null
        await promptSeriesSelectionModal(
            model,
            {
                idx: 'test_cancel',
                slv: (res: any) => {
                    receipt = res
                },
            },
            { hunt: (globalThis as any).LIBRARY.hunt } as any,
        )

        expect(model.activeSeries).toBe('existing-series')
        expect(receipt).toEqual({
            mnuBit: { idx: 'series-discovery-cancel', val: 0 },
        })
        expect(logs.some((l) => l.includes('Series selection cancelled'))).toBe(
            true,
        )
    })
})
