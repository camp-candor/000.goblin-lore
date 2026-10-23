import { describe, it, expect } from 'vitest'
import { MenuModel } from '../menu.model.js'
import { reducer } from '../menu.reduce.js'
import * as Act from '../act/menu.action.js'
import {
    runFactScopeMenuAudit,
    runAuthorityLevelMenuAudit,
    runSequenceMenuAudit,
    runLiminalStatusMenuAudit,
    runCanonHashMenuAudit,
    runByteZeroMenuAudit,
    runPreWriteInterceptorMenuAudit,
    runFactRegistryMenuAudit,
    runFullNegativeControlGauntlet,
} from '../buz/menu.buzz.js'

describe('98.menu.unit: Interactive Fact Schema Submenu Hub', () => {
    it('POSITIVE: Executes all audit routines in headless mode without errors', () => {
        const logs: string[] = []
        const mockCns = { log: (msg: string) => logs.push(msg) }

        expect(() => runFactScopeMenuAudit(mockCns)).not.toThrow()
        expect(() => runAuthorityLevelMenuAudit(mockCns)).not.toThrow()
        expect(() => runSequenceMenuAudit(mockCns)).not.toThrow()
        expect(() => runLiminalStatusMenuAudit(mockCns)).not.toThrow()
        expect(() => runCanonHashMenuAudit(mockCns)).not.toThrow()
        expect(() => runByteZeroMenuAudit(mockCns)).not.toThrow()
        expect(() => runPreWriteInterceptorMenuAudit(mockCns)).not.toThrow()
        expect(() => runFactRegistryMenuAudit(mockCns)).not.toThrow()
        expect(() => runFullNegativeControlGauntlet(mockCns)).not.toThrow()

        expect(logs.length).toBeGreaterThan(25)
        expect(logs.some((l) => l.includes('4/4 SCOPES VERIFIED'))).toBe(true)
        expect(
            logs.some((l) => l.includes('AUTHORITY HIERARCHY VERIFIED')),
        ).toBe(true)
        expect(
            logs.some((l) => l.includes('SEQUENCE CONTIGUITY CERTIFIED')),
        ).toBe(true)
        expect(
            logs.some((l) =>
                l.includes('ZERO-CASCADE LIMINAL GUARANTEE CERTIFIED'),
            ),
        ).toBe(true)
        expect(
            logs.some((l) => l.includes('UNICODE NFC HASHING CERTIFIED')),
        ).toBe(true)
        expect(
            logs.some((l) =>
                l.includes('BYTE-ZERO INGESTION BOUNDARY CERTIFIED'),
            ),
        ).toBe(true)
        expect(
            logs.some((l) => l.includes('PRE-WRITE BARRIER CERTIFIED')),
        ).toBe(true)
        expect(
            logs.some((l) =>
                l.includes('DEEP-FROZEN REGISTRY STORE CERTIFIED'),
            ),
        ).toBe(true)
    })

    it('POSITIVE: Handles reducer state transitions gracefully', () => {
        const model = new MenuModel()
        const reduced = reducer(model, new Act.InitMenu({ idx: 'init-test' }))
        expect(reduced).toBeDefined()
        expect(reduced.idx).toBe('98.menu')
    })

    it('POSITIVE: Fallback execution when globalThis.LIBRARY is missing', async () => {
        const model = new MenuModel()
        let solvedResult: any = null

        const bale = {
            idx: 'test-bal',
            slv: (res: any) => {
                solvedResult = res
            },
        }

        const updated = await reducer(model, new Act.UpdateMenu(bale))
        expect(updated).toBeDefined()
        expect(solvedResult?.mnuBit?.src).toBe('HEADLESS_BYPASS')
    })
})
