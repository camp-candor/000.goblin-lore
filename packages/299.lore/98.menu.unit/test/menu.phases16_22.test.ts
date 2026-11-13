import { describe, it, expect, vi, afterEach } from 'vitest'
import {
    updateMenu,
    openStatusMenu,
    openPortMenu,
    openWorkerMenu,
    STATUS_MENU_LABEL,
    PORT_MENU_LABEL,
    WORKER_MENU_LABEL,
    EVALUATE_VOID_STATE_LABEL,
    VERIFY_CANON_PORT_SEAL_LABEL,
    AUDIT_EDGE_STAGING_BUFFER_LABEL,
    AUDIT_EDGE_SCHEMA_BUNDLE_LABEL,
    SIMULATE_HTTP_412_GATE_LABEL,
} from '../buz/00.menu.buzz.js'
import { MenuModel } from '../menu.model.js'

const createMockLibrary = (selectedChoice: string, logs: string[]) => ({
    hunt: vi.fn(async (action: string, payload: any) => {
        if (action === '[Grid action] Update Grid') {
            return { grdBit: { dat: { x: payload.x, y: payload.y } } }
        }
        if (action === '[Open action] Open Choice') {
            return { chcBit: { src: selectedChoice } }
        }
        if (action === '[Console action] Update Console') {
            logs.push(payload.src)
            return { cnsBit: { idx: payload.idx } }
        }
        return {}
    }),
})

describe('Phases 16-22 Submenu Wiring Regression', () => {
    afterEach(() => {
        delete (globalThis as any).LIBRARY
        delete (global as any).LIBRARY
    })

    it('exposes [STATUS MENU], [PORT MENU], and [WORKER MENU] in updateMenu', async () => {
        const model = new MenuModel()
        let lst: string[] = []
        await updateMenu(
            model,
            {
                idx: 'test-update-menu-16-22',
                slv: (res: any) => {
                    lst = res?.mnuBit?.lst || []
                },
            } as any,
            {} as any,
        )

        expect(lst).toContain(STATUS_MENU_LABEL)
        expect(lst).toContain(PORT_MENU_LABEL)
        expect(lst).toContain(WORKER_MENU_LABEL)
    })

    it('dispatches [2] EVALUATE COLD-BOOT VOID STATE from openStatusMenu', async () => {
        const logs: string[] = []
        ;(globalThis as any).LIBRARY = createMockLibrary(
            EVALUATE_VOID_STATE_LABEL,
            logs,
        )

        const model = new MenuModel()
        let resolved: any = null
        await openStatusMenu(model, {
            idx: 'test-status-void',
            slv: (res: any) => {
                resolved = res.mnuBit
            },
        } as any)

        expect(resolved?.idx).toBe('evaluate-void-state')
        expect(logs.some((l) => l.includes('[VOID:SCAN]'))).toBe(true)
    })

    it('dispatches [1] VERIFY READ-ONLY CANON PORT SEAL from openPortMenu', async () => {
        const logs: string[] = []
        ;(globalThis as any).LIBRARY = createMockLibrary(
            VERIFY_CANON_PORT_SEAL_LABEL,
            logs,
        )

        const model = new MenuModel()
        let resolved: any = null
        await openPortMenu(model, {
            idx: 'test-port-seal',
            slv: (res: any) => {
                resolved = res.mnuBit
            },
        } as any)

        expect(model.statusMessage).toBe('CANON_PORT_SEAL_VERIFIED')
        expect(resolved?.idx).toBe('verify-canon-port-seal')
        expect(logs.some((l) => l.includes('[PORT:SEAL_VERIFIED]'))).toBe(true)
    })

    it('dispatches [2] AUDIT EDGE STAGING QUARANTINE BUFFER from openPortMenu', async () => {
        const logs: string[] = []
        ;(globalThis as any).LIBRARY = createMockLibrary(
            AUDIT_EDGE_STAGING_BUFFER_LABEL,
            logs,
        )

        const model = new MenuModel()
        let resolved: any = null
        await openPortMenu(model, {
            idx: 'test-port-staging',
            slv: (res: any) => {
                resolved = res.mnuBit
            },
        } as any)

        expect(model.statusMessage).toBe('EDGE_STAGING_QUARANTINE_VERIFIED')
        expect(resolved?.idx).toBe('audit-edge-staging-buffer')
        expect(logs.some((l) => l.includes('[STAGING:QUARANTINE_OK]'))).toBe(
            true,
        )
    })

    it('dispatches [3] AUDIT EDGE PINNED SCHEMA BUNDLE from openPortMenu', async () => {
        const logs: string[] = []
        ;(globalThis as any).LIBRARY = createMockLibrary(
            AUDIT_EDGE_SCHEMA_BUNDLE_LABEL,
            logs,
        )

        const model = new MenuModel()
        let resolved: any = null
        await openPortMenu(model, {
            idx: 'test-port-schema-pin',
            slv: (res: any) => {
                resolved = res.mnuBit
            },
        } as any)

        expect(model.statusMessage).toBe('EDGE_SCHEMA_BUNDLE_VERIFIED')
        expect(resolved?.idx).toBe('audit-edge-schema-bundle')
        expect(logs.some((l) => l.includes('[SCHEMA_PIN:OK]'))).toBe(true)
    })

    it('dispatches [3] SIMULATE HTTP 412 DIRTY-SCENE GATE from openWorkerMenu', async () => {
        const logs: string[] = []
        ;(globalThis as any).LIBRARY = createMockLibrary(
            SIMULATE_HTTP_412_GATE_LABEL,
            logs,
        )

        const model = new MenuModel()
        let resolved: any = null
        await openWorkerMenu(model, {
            idx: 'test-worker-412',
            slv: (res: any) => {
                resolved = res.mnuBit
            },
        } as any)

        expect(model.statusMessage).toBe('HTTP_412_DIRTY_SCENE_GATE_VERIFIED')
        expect(resolved?.idx).toBe('simulate-http-412-gate')
        expect(logs.some((l) => l.includes('[HTTP_412:REJECTED]'))).toBe(true)
    })
})
