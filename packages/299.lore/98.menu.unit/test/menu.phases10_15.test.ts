import { describe, it, expect, vi, afterEach } from 'vitest'
import {
    updateMenu,
    openEntityMenu,
    openLocationMenu,
    openLogisticMenu,
    openCanonMenu,
    ENTITY_MENU_LABEL,
    LOCATION_MENU_LABEL,
    LOGISTIC_MENU_LABEL,
    ASSEMBLE_BYTE_ZERO_DOSSIER_LABEL,
    RUN_ENTITY_PREFLIGHT_GATE_LABEL,
    RECONCILE_SPATIAL_PORTALS_LABEL,
    AUDIT_EQUIPMENT_CONSERVATION_LABEL,
    SIMULATE_MATTER_CONSERVATION_LABEL,
    SWEEP_ACTIVE_DEPENDENCIES_LABEL,
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

describe('Phases 10-15 Submenu Wiring Regression', () => {
    afterEach(() => {
        delete (globalThis as any).LIBRARY
        delete (global as any).LIBRARY
    })

    it('exposes [ENTITY MENU], [LOCATION MENU], and [LOGISTIC MENU] in updateMenu', async () => {
        const model = new MenuModel()
        let lst: string[] = []
        await updateMenu(
            model,
            {
                idx: 'test-update-menu',
                slv: (res: any) => {
                    lst = res?.mnuBit?.lst || []
                },
            } as any,
            {} as any,
        )

        expect(lst).toContain(ENTITY_MENU_LABEL)
        expect(lst).toContain(LOCATION_MENU_LABEL)
        expect(lst).toContain(LOGISTIC_MENU_LABEL)
    })

    it('dispatches [1] ASSEMBLE BYTE-ZERO DUAL-RAIL DOSSIER from openEntityMenu', async () => {
        const logs: string[] = []
        ;(globalThis as any).LIBRARY = createMockLibrary(
            ASSEMBLE_BYTE_ZERO_DOSSIER_LABEL,
            logs,
        )

        const model = new MenuModel()
        let resolved: any = null
        await openEntityMenu(model, {
            idx: 'test-entity-assemble',
            slv: (res: any) => {
                resolved = res.mnuBit
            },
        } as any)

        expect(model.statusMessage).toBe('BYTE_ZERO_DOSSIER_ASSEMBLED')
        expect(resolved?.idx).toBe('assemble-byte-zero-dossier')
        expect(logs.some((l) => l.includes('[BYTE0:OK]'))).toBe(true)
    })

    it('dispatches [2] RUN SOMATIC SAT FOREIGN-KEY GATE from openEntityMenu', async () => {
        const logs: string[] = []
        ;(globalThis as any).LIBRARY = createMockLibrary(
            RUN_ENTITY_PREFLIGHT_GATE_LABEL,
            logs,
        )

        const model = new MenuModel()
        let resolved: any = null
        await openEntityMenu(model, {
            idx: 'test-entity-preflight',
            slv: (res: any) => {
                resolved = res.mnuBit
            },
        } as any)

        expect(model.statusMessage).toBe('PREFLIGHT_GATE_PASSED')
        expect(resolved?.idx).toBe('run-entity-preflight-gate')
        expect(logs.some((l) => l.includes('[PREFLIGHT:PASS]'))).toBe(true)
    })

    it('dispatches [1] RECONCILE RECIPROCAL SPATIAL PORTALS from openLocationMenu', async () => {
        const logs: string[] = []
        ;(globalThis as any).LIBRARY = createMockLibrary(
            RECONCILE_SPATIAL_PORTALS_LABEL,
            logs,
        )

        const model = new MenuModel()
        let resolved: any = null
        await openLocationMenu(model, {
            idx: 'test-location-reconcile',
            slv: (res: any) => {
                resolved = res.mnuBit
            },
        } as any)

        expect(resolved?.idx).toBe('reconcile-spatial-portals')
        expect(logs.some((l) => l.includes('[PORTAL:SCAN]'))).toBe(true)
    })

    it('dispatches [1] AUDIT FOUR-TIER EQUIPMENT CONSERVATION from openLogisticMenu', async () => {
        const logs: string[] = []
        ;(globalThis as any).LIBRARY = createMockLibrary(
            AUDIT_EQUIPMENT_CONSERVATION_LABEL,
            logs,
        )

        const model = new MenuModel()
        let resolved: any = null
        await openLogisticMenu(model, {
            idx: 'test-logistic-audit',
            slv: (res: any) => {
                resolved = res.mnuBit
            },
        } as any)

        expect(model.statusMessage).toBe('LOGISTIC_CONSERVATION_VERIFIED')
        expect(resolved?.idx).toBe('audit-equipment-conservation')
        expect(logs.some((l) => l.includes('[SAT GATE]'))).toBe(true)
        expect(logs.some((l) => l.includes('[CONSERVATION]'))).toBe(true)
    })

    it('dispatches [3] SIMULATE MATTER CONSERVATION GATE from openLogisticMenu', async () => {
        const logs: string[] = []
        ;(globalThis as any).LIBRARY = createMockLibrary(
            SIMULATE_MATTER_CONSERVATION_LABEL,
            logs,
        )

        const model = new MenuModel()
        let resolved: any = null
        await openLogisticMenu(model, {
            idx: 'test-matter-conservation',
            slv: (res: any) => {
                resolved = res.mnuBit
            },
        } as any)

        expect(model.statusMessage).toBe('MATTER_CONSERVATION_VERIFIED')
        expect(resolved?.idx).toBe('simulate-matter-conservation')
        expect(logs.some((l) => l.includes('[CUSTODY:OK]'))).toBe(true)
    })

    it('dispatches [4] SWEEP ACTIVE DEPENDENCY REFERENCES from openCanonMenu', async () => {
        const logs: string[] = []
        ;(globalThis as any).LIBRARY = createMockLibrary(
            SWEEP_ACTIVE_DEPENDENCIES_LABEL,
            logs,
        )

        const model = new MenuModel()
        let resolved: any = null
        await openCanonMenu(model, {
            idx: 'test-canon-sweep',
            slv: (res: any) => {
                resolved = res.mnuBit
            },
        } as any)

        expect(model.statusMessage).toBe('DEPENDENCY_SWEEP_COMPLETE')
        expect(resolved?.idx).toBe('sweep-active-dependencies')
        expect(logs.some((l) => l.includes('[REF_LOCK]'))).toBe(true)
        expect(logs.some((l) => l.includes('[RETIRE_READY]'))).toBe(true)
    })
})
