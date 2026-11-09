/**
 * packages/299.lore/98.menu.unit/test/menu.series.tree.audit.test.ts
 *
 * Vitest verification suite for the Phase 5 Series Tree Scaffolding menu
 * wiring: submenu route exposure, real live-buzzer hermetic scaffolding,
 * fail-closed collision re-probe, cns00 telemetry formatting, plus the
 * full Level 4 TUI journey from the lore dashboard through the schema
 * submenu.
 */

import { describe, it, expect, afterEach } from 'vitest'
import { MenuModel } from '../menu.model'
import { updateMenu, openSchemaInvariantsMenu } from '../buz/00.menu.buzz'
import {
    SERIES_TREE_MENU_LABEL,
    SERIES_TREE_AUDIT_HEADER,
    SERIES_TREE_INPUT_LINE,
    SERIES_TREE_CHECK_LINE,
    SERIES_TREE_SCAFFOLD_LINE,
    SERIES_TREE_INIT_LINE,
    SERIES_TREE_CONFIG_LINE,
    SERIES_TREE_SEALED_FOOTER,
    runSeriesTreeScaffoldAudit,
    auditSeriesTreeScaffold,
} from '../buz/18.series.tree.audit.buzz'

const EXPECTED_BLOCK = [
    SERIES_TREE_AUDIT_HEADER,
    SERIES_TREE_INPUT_LINE,
    SERIES_TREE_CHECK_LINE,
    SERIES_TREE_SCAFFOLD_LINE,
    SERIES_TREE_INIT_LINE,
    SERIES_TREE_CONFIG_LINE,
    SERIES_TREE_SEALED_FOOTER,
]

describe('299.lore - Series Tree Scaffolding Menu Wiring Suite', () => {
    afterEach(() => {
        delete (globalThis as any).LIBRARY
        delete (global as any).LIBRARY
    })

    it('openSchemaInvariantsMenu -- exposes scaffolding route among schema options headless', async () => {
        let resolved: any = null
        const bal = {
            idx: 'test-schema-menu-tree',
            dat: { activeSeries: '001.goblin-lore' },
            slv: (res: any) => {
                resolved = res
            },
        }

        const model = new MenuModel()
        await openSchemaInvariantsMenu(model, bal as any, undefined as any)

        expect(resolved).toBeTruthy()
        expect(resolved.mnuBit.lst).toContain(SERIES_TREE_MENU_LABEL)
        expect(resolved.mnuBit.lst).toContain('[ BACK ]')
    })

    it('auditSeriesTreeScaffold -- seals every hermetic stage and traps the collision re-probe', async () => {
        const audit = await auditSeriesTreeScaffold()

        expect(audit.valid).toBe(true)
        expect(audit.errors).toEqual([])
        expect(audit.inputSealed).toBe(true)
        expect(audit.vacancyConfirmed).toBe(true)
        expect(audit.scaffoldSealed).toBe(true)
        expect(audit.initSealed).toBe(true)
        expect(audit.configSealed).toBe(true)
        expect(audit.collisionTrapped).toBe(true)
    })

    it('runSeriesTreeScaffoldAudit -- streams the exact seven-line scaffolding block', async () => {
        const lines = await runSeriesTreeScaffoldAudit()

        expect(lines).toEqual(EXPECTED_BLOCK)
        expect(lines[0]).toBe(
            '--- [299.LORE :: 29.SERIES.UNIT :: SERIES TREE DIRECTORY SCAFFOLDING] ---',
        )
        expect(lines[lines.length - 1]).toBe(
            '--- [AUDIT COMPLETE: SERIES WORKSPACE SEALED AT T0 = $0.00] ---',
        )
    })

    it('runSeriesTreeScaffoldAudit -- emits pure 7-bit ASCII telemetry', async () => {
        const lines = await runSeriesTreeScaffoldAudit()

        expect(SERIES_TREE_MENU_LABEL).toMatch(/^[\x20-\x7E]*$/)
        for (const line of lines) {
            expect(/^[\x20-\x7E]*$/.test(line)).toBe(true)
        }
    })

    it('Level 4 TUI journey -- lore dashboard routes scaffolding selection into cns00 telemetry', async () => {
        const consoleLogs: string[] = []
        const choiceQueue = [
            '[ 26. SCHEMA & INVARIANTS ]',
            SERIES_TREE_MENU_LABEL,
        ]
        const observedChoiceLists: string[][] = []

        const mockLibrary = {
            hunt: async (action: string, payload: any) => {
                if (action === '[Open action] Open Choice') {
                    observedChoiceLists.push(payload.lst || [])
                    const nextChoice = choiceQueue.shift() || 'ROOT MENU'
                    if (payload.dat?.cb) {
                        await payload.dat.cb(nextChoice)
                    }
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

        const model = new MenuModel()
        const bal: any = { idx: 'test-series-tree-journey' }
        const mockState = {
            hunt: async (_act: string, _payload: any) => ({}),
        }

        await updateMenu(model, bal, mockState as any)

        expect(observedChoiceLists[0]).toContain('[ 26. SCHEMA & INVARIANTS ]')
        expect(observedChoiceLists[1]).toContain(SERIES_TREE_MENU_LABEL)
        expect(consoleLogs).toContain(
            '>> [TREE:AUDIT] Scaffolding hermetic series workspace...',
        )
        for (const line of EXPECTED_BLOCK) {
            expect(consoleLogs).toContain(line)
        }
    })
})
