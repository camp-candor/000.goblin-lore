import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { MenuModel } from '../menu.model.js'
import { reducer } from '../menu.reduce.js'
import * as ActMnu from '../menu.action.js'
import {
    GENESIS_WIZARD_LABEL,
    ENTITY_SCAFFOLDER_LABEL,
    RETIRE_ENTITY_LABEL,
    CORPUS_HEALTH_LABEL,
    RECORD_ERRATA_LABEL,
    LIFECYCLE_MENU_OPTIONS,
    runSeriesGenesisMenu,
    runEntityScaffoldMenu,
    runEntityRetirementMenu,
    runCorpusHealthMenu,
    runErrataMenu,
} from '../menu.buzzer.js'

describe('Phase 10 Blessed Terminal Flight Deck Menu Integration Suite', () => {
    it('Task 10.1: registers all 5 lifecycle menu options in LIFECYCLE_MENU_OPTIONS', () => {
        expect(LIFECYCLE_MENU_OPTIONS).toEqual([
            '[G] UNIVERSAL SERIES GENESIS WIZARD',
            '[S] ATOMIC ENTITY SCAFFOLDER',
            '[R] RETIRE CANONICAL ENTITY',
            '[H] STATIC CORPUS HEALTH TELEMETRY',
            '[X] RECORD CANONICAL ERRATA ENTRY',
            '[T] SIMULATION CHRONOLOGY CLOCK',
        ])
    })

    it('Task 10.2: dispatches Interactive Series Genesis Menu and streams >> [GENESIS:OK]', async () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'menu-genesis-'))
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
        await runSeriesGenesisMenu(
            model,
            {
                idx: 'test-genesis',
                dat: {
                    seriesSlug: 'test-genesis-slug',
                    displayName: 'Test Genesis',
                    centralIrony:
                        'Scavengers guarding empty vaults beneath a flooded city.',
                    repoRoot: tempRoot,
                },
                slv: (res: any) => {
                    resolved = res
                },
            },
            mockSte,
        )

        expect(resolved?.mnuBit?.val).toBe(1)
        expect(model.lastLifecycleReceipt).toBe('[GENESIS:OK]')
        expect(consoleLines.some((l) => l.includes('>> [GENESIS:OK]'))).toBe(
            true,
        )
        fs.rmSync(tempRoot, { recursive: true, force: true })
    })

    it('Task 10.3: dispatches Interactive Entity Scaffolder Menu and streams >> [SCAFFOLD:OK]', async () => {
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
        await runEntityScaffoldMenu(
            model,
            {
                idx: 'test-scaffold',
                dat: {
                    seriesSlug: 'wiregrass-basin',
                    domain: 'characters',
                    entityId: 'char_johnny_walkman',
                },
                slv: (res: any) => {
                    resolved = res
                },
            },
            mockSte,
        )

        expect(resolved?.mnuBit?.val).toBe(1)
        expect(model.lastLifecycleReceipt).toBe('[SCAFFOLD:OK]')
        expect(consoleLines.some((l) => l.includes('>> [SCAFFOLD:OK]'))).toBe(
            true,
        )
    })

    it('Task 10.4: dispatches Interactive Entity Retirement Menu and streams >> [RETIRE:OK]', async () => {
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
        await runEntityRetirementMenu(
            model,
            {
                idx: 'test-retire',
                dat: {
                    seriesSlug: 'wiregrass-basin',
                    entityId: 'char_orbie_mayhaw',
                },
                slv: (res: any) => {
                    resolved = res
                },
            },
            mockSte,
        )

        expect(resolved?.mnuBit?.val).toBe(1)
        expect(model.lastLifecycleReceipt).toBe('[RETIRE:OK]')
        expect(consoleLines.some((l) => l.includes('>> [RETIRE:OK]'))).toBe(
            true,
        )
    })

    it('Task 10.5: renders 4-part Static Corpus Health card to cns00 in pure 7-bit ASCII', async () => {
        const consoleLines: string[] = []
        const mockSte: any = {
            hunt: async (type: string, bale: any) => {
                if (type === '[Console action] Update Console') {
                    consoleLines.push(bale.src)
                }
                if (bale?.slv) {
                    bale.slv({
                        stsBit: {
                            val: 1,
                            dat: {
                                dyadCoverageBps: 10000,
                                farceRatioBps: 0,
                                maxDagDepthDelta: 2,
                                giniCentralityBps: 2400,
                            },
                        },
                    })
                }
            },
        }

        const model = new MenuModel()
        let resolved: any = null
        await runCorpusHealthMenu(
            model,
            {
                idx: 'test-health',
                dat: { seriesSlug: 'wiregrass-basin' },
                slv: (res: any) => {
                    resolved = res
                },
            },
            mockSte,
        )

        expect(resolved?.mnuBit?.val).toBe(1)
        expect(model.lastLifecycleReceipt).toBe('[HEALTH:OK]')
        expect(consoleLines.some((l) => l.includes('[1. DYADIC MESH]'))).toBe(
            true,
        )
        expect(consoleLines.some((l) => l.includes('[2. FARCE RATIO]'))).toBe(
            true,
        )
        expect(consoleLines.some((l) => l.includes('[3. DAG DEPTH]'))).toBe(
            true,
        )
        expect(consoleLines.some((l) => l.includes('[4. GINI INDEX]'))).toBe(
            true,
        )

        for (const line of consoleLines) {
            // eslint-disable-next-line no-control-regex
            expect(line).not.toMatch(/[^\x00-\x7F]/)
        }
    })

    it('Task 10.6: dispatches Interactive Errata Menu and streams >> [ERRATA:SEALED]', async () => {
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
        await runErrataMenu(
            model,
            {
                idx: 'test-errata',
                dat: { seriesSlug: 'under-the-floorboards' },
                slv: (res: any) => {
                    resolved = res
                },
            },
            mockSte,
        )

        expect(resolved?.mnuBit?.val).toBe(1)
        expect(model.lastLifecycleReceipt).toBe('[ERRATA:SEALED]')
        expect(consoleLines.some((l) => l.includes('>> [ERRATA:SEALED]'))).toBe(
            true,
        )
    })

    it('Task 10.7: routes lifecycle actions through pure clone-deep reducer', async () => {
        const model = new MenuModel()
        model.activeSelection = 'INITIAL'
        let resolved: any = null
        const action = new ActMnu.OpenHealthMenu({
            idx: 'reducer-health',
            dat: { seriesSlug: 'wiregrass-basin' },
            slv: (res: any) => {
                resolved = res
            },
        })

        const nextModel = await reducer(model, action, {
            hunt: async (_t: string, b: any) => b?.slv && b.slv({ val: 1 }),
        } as any)

        expect(nextModel.activeSelection).toBe(CORPUS_HEALTH_LABEL)
        expect(model.activeSelection).toBe('INITIAL')
        expect(nextModel).not.toBe(model)
        expect(resolved?.mnuBit?.val).toBe(1)
    })
})
