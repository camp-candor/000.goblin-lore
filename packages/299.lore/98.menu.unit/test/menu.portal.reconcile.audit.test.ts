/**
 * packages/299.lore/98.menu.unit/test/menu.portal.reconcile.audit.test.ts
 *
 * Vitest verification suite for the Phase 6 Portal Reconcile menu wiring:
 * submenu route exposure, real live-buzzer hermetic portal reconciliation,
 * byte-0 preservation, damping symmetry, fail-closed negative probes, cns00
 * telemetry formatting, plus the full Level 4 TUI journey from the lore
 * dashboard through the schema submenu.
 */

import { describe, it, expect, afterEach } from 'vitest'
import { MenuModel } from '../menu.model'
import { updateMenu, openSchemaInvariantsMenu } from '../buz/00.menu.buzz'
import {
    PORTAL_RECONCILE_MENU_LABEL,
    PORTAL_RECONCILE_AUDIT_HEADER,
    PORTAL_RECONCILE_SCAN_LINE,
    PORTAL_RECONCILE_LINK_LINE,
    PORTAL_RECONCILE_BYTE_ZERO_LINE,
    PORTAL_RECONCILE_SYMMETRY_LINE,
    PORTAL_RECONCILE_SEALED_FOOTER,
    runPortalReconcileAudit,
    auditPortalReconcile,
} from '../buz/20.portal.reconcile.audit.buzz'

const EXPECTED_BLOCK = [
    PORTAL_RECONCILE_AUDIT_HEADER,
    PORTAL_RECONCILE_SCAN_LINE,
    PORTAL_RECONCILE_LINK_LINE,
    PORTAL_RECONCILE_BYTE_ZERO_LINE,
    PORTAL_RECONCILE_SYMMETRY_LINE,
    PORTAL_RECONCILE_SEALED_FOOTER,
]

describe('299.lore - Portal Reconcile Menu Wiring Suite', () => {
    afterEach(() => {
        delete (globalThis as any).LIBRARY
        delete (global as any).LIBRARY
    })

    it('openSchemaInvariantsMenu -- exposes portal reconcile route among schema options headless', async () => {
        let resolved: any = null
        const bal = {
            idx: 'test-schema-menu-portal',
            dat: { activeSeries: '001.goblin-lore' },
            slv: (res: any) => {
                resolved = res
            },
        }

        const model = new MenuModel()
        await openSchemaInvariantsMenu(model, bal as any, undefined as any)

        expect(resolved).toBeTruthy()
        expect(resolved.mnuBit.lst).toContain(PORTAL_RECONCILE_MENU_LABEL)
        expect(resolved.mnuBit.lst).toContain('[ BACK ]')
    })

    it('auditPortalReconcile -- seals the hermetic graph and traps the dangling probe', async () => {
        const audit = await auditPortalReconcile()

        expect(audit.valid).toBe(true)
        expect(audit.errors).toEqual([])
        expect(audit.scanSealed).toBe(true)
        expect(audit.linkSealed).toBe(true)
        expect(audit.byteZeroSealed).toBe(true)
        expect(audit.symmetrySealed).toBe(true)
        expect(audit.probeTotal).toBe(1)
        expect(audit.probesTrapped).toBe(1)
    })

    it('runPortalReconcileAudit -- streams the exact six-line reconcile block', async () => {
        const lines = await runPortalReconcileAudit()

        expect(lines).toEqual(EXPECTED_BLOCK)
        expect(lines[0]).toBe(
            '--- [299.LORE :: 01.LOCATION.UNIT :: RECIPROCAL PORTAL RECONCILIATION] ---',
        )
        expect(lines[lines.length - 1]).toBe(
            '--- [AUDIT COMPLETE: SPATIAL GRAPH RECIPROCITY SEALED AT T0 = $0.00] ---',
        )
    })

    it('runPortalReconcileAudit -- emits pure 7-bit ASCII telemetry', async () => {
        const lines = await runPortalReconcileAudit()

        expect(PORTAL_RECONCILE_MENU_LABEL).toMatch(/^[\x20-\x7E]*$/)
        for (const line of lines) {
            expect(/^[\x20-\x7E]*$/.test(line)).toBe(true)
        }
    })

    it('Level 4 TUI journey -- lore dashboard routes portal selection into cns00 telemetry', async () => {
        const consoleLogs: string[] = []
        const choiceQueue = [
            '[ 26. SCHEMA & INVARIANTS ]',
            PORTAL_RECONCILE_MENU_LABEL,
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
        const bal: any = { idx: 'test-portal-reconcile-journey' }
        const mockState = {
            hunt: async (_act: string, _payload: any) => ({}),
        }

        await updateMenu(model, bal, mockState as any)

        expect(observedChoiceLists[0]).toContain('[ 26. SCHEMA & INVARIANTS ]')
        expect(observedChoiceLists[1]).toContain(PORTAL_RECONCILE_MENU_LABEL)
        expect(consoleLogs).toContain(
            '>> [PORTAL:AUDIT] Reconciling hermetic spatial portal graph...',
        )
        for (const line of EXPECTED_BLOCK) {
            expect(consoleLogs).toContain(line)
        }
    })
})
