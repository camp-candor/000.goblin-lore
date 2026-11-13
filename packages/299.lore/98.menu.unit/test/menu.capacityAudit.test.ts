import { describe, it, expect, afterEach } from 'vitest'
import { CAPACITY_STAT_AUDIT_LABEL, updateMenu } from '../buz/00.menu.buzz.js'

describe('98.menu.unit: [Feature 2.2] Capacity & Stat Audit Menu Wiring', () => {
    afterEach(() => {
        delete (globalThis as any).LIBRARY
        delete (global as any).LIBRARY
    })

    it('exposes CAPACITY_STAT_AUDIT_LABEL and streams [CAPACITY:AUDIT] [OK] & breach telemetry on dispatch', async () => {
        const capturedChoices: string[][] = []
        const consoleLogs: string[] = []
        ;(globalThis as any).LIBRARY = {
            hunt: async (event: string, payload: any) => {
                if (event === '[Open action] Open Choice') {
                    capturedChoices.push(payload?.lst ?? [])
                    return { chcBit: { src: CAPACITY_STAT_AUDIT_LABEL } }
                }
                if (event === '[Grid action] Update Grid') {
                    return { grdBit: { dat: { x: 0, y: 0 } } }
                }
                if (event === '[Console action] Update Console') {
                    consoleLogs.push(payload?.src ?? '')
                }
                return {}
            },
        }

        await updateMenu({} as any, { idx: 'test_capacity_audit_menu' }, {
            hunt: (globalThis as any).LIBRARY.hunt,
        } as any)

        expect(capturedChoices.length).toBeGreaterThan(0)
        expect(capturedChoices[0]).toContain(CAPACITY_STAT_AUDIT_LABEL)
        expect(
            consoleLogs.some(
                (l) =>
                    l.includes('[CAPACITY:AUDIT] [OK]') &&
                    l.includes('Integer basis-point [0, 10000] (PASS)'),
            ),
        ).toBe(true)
        expect(
            consoleLogs.some(
                (l) =>
                    l.includes('[CAPACITY:AUDIT] [OK]') &&
                    l.includes('breach=ANATOMICAL_CAPACITY_EXCEEDED') &&
                    l.includes('deficit=10000'),
            ),
        ).toBe(true)
    })
})
