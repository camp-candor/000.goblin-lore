/**
 * packages/299.lore/98.menu.unit/test/menu.genesis.seeds.audit.test.ts
 *
 * Vitest verification suite for the Phase 6 Genesis Seeds menu wiring:
 * submenu route exposure, real live-buzzer hermetic seed population,
 * byte-0 preamble verification, fail-closed negative probes, cns00
 * telemetry formatting, plus the full Level 4 TUI journey from the lore
 * dashboard through the schema submenu.
 */

import { describe, it, expect, afterEach } from 'vitest'
import { MenuModel } from '../menu.model'
import { updateMenu, openSchemaInvariantsMenu } from '../buz/00.menu.buzz'
import {
    GENESIS_SEEDS_MENU_LABEL,
    GENESIS_SEEDS_AUDIT_HEADER,
    GENESIS_SEEDS_INIT_LINE,
    GENESIS_SEEDS_CONDITIONS_LINE,
    GENESIS_SEEDS_ECONOMY_LINE,
    GENESIS_SEEDS_HUB_LINE,
    GENESIS_SEEDS_BYTE_ZERO_LINE,
    GENESIS_SEEDS_SEALED_FOOTER,
    runGenesisSeedsAudit,
    auditGenesisSeeds,
} from '../buz/19.genesis.seeds.audit.buzz'

const EXPECTED_BLOCK = [
    GENESIS_SEEDS_AUDIT_HEADER,
    GENESIS_SEEDS_INIT_LINE,
    GENESIS_SEEDS_CONDITIONS_LINE,
    GENESIS_SEEDS_ECONOMY_LINE,
    GENESIS_SEEDS_HUB_LINE,
    GENESIS_SEEDS_BYTE_ZERO_LINE,
    GENESIS_SEEDS_SEALED_FOOTER,
]

describe('299.lore - Genesis Seeds Menu Wiring Suite', () => {
    afterEach(() => {
        delete (globalThis as any).LIBRARY
        delete (global as any).LIBRARY
    })

    it('openSchemaInvariantsMenu -- exposes genesis seeds route among schema options headless', async () => {
        let resolved: any = null
        const bal = {
            idx: 'test-schema-menu-seeds',
            dat: { activeSeries: '001.goblin-lore' },
            slv: (res: any) => {
                resolved = res
            },
        }

        const model = new MenuModel()
        await openSchemaInvariantsMenu(model, bal as any, undefined as any)

        expect(resolved).toBeTruthy()
        expect(resolved.mnuBit.lst).toContain(GENESIS_SEEDS_MENU_LABEL)
        expect(resolved.mnuBit.lst).toContain('[ BACK ]')
    })

    it('auditGenesisSeeds -- seals the hermetic triad and traps every negative probe', async () => {
        const audit = await auditGenesisSeeds()

        expect(audit.valid).toBe(true)
        expect(audit.errors).toEqual([])
        expect(audit.initSealed).toBe(true)
        expect(audit.triadSealed).toBe(true)
        expect(audit.byteZeroSealed).toBe(true)
        expect(audit.probeTotal).toBe(4)
        expect(audit.probesTrapped).toBe(4)
    })

    it('runGenesisSeedsAudit -- streams the exact seven-line seed block', async () => {
        const lines = await runGenesisSeedsAudit()

        expect(lines).toEqual(EXPECTED_BLOCK)
        expect(lines[0]).toBe(
            '--- [299.LORE :: 27.SEED.UNIT :: SERIES GENESIS SEED POPULATION] ---',
        )
        expect(lines[lines.length - 1]).toBe(
            '--- [AUDIT COMPLETE: GENESIS SEED DOSSIERS SEALED AT T0 = $0.00] ---',
        )
    })

    it('runGenesisSeedsAudit -- emits pure 7-bit ASCII telemetry', async () => {
        const lines = await runGenesisSeedsAudit()

        expect(GENESIS_SEEDS_MENU_LABEL).toMatch(/^[\x20-\x7E]*$/)
        for (const line of lines) {
            expect(/^[\x20-\x7E]*$/.test(line)).toBe(true)
        }
    })

    it('Level 4 TUI journey -- lore dashboard routes seeds selection into cns00 telemetry', async () => {
        const consoleLogs: string[] = []
        const choiceQueue = [
            '[ 26. SCHEMA & INVARIANTS ]',
            GENESIS_SEEDS_MENU_LABEL,
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
        const bal: any = { idx: 'test-genesis-seeds-journey' }
        const mockState = {
            hunt: async (_act: string, _payload: any) => ({}),
        }

        await updateMenu(model, bal, mockState as any)

        expect(observedChoiceLists[0]).toContain('[ 26. SCHEMA & INVARIANTS ]')
        expect(observedChoiceLists[1]).toContain(GENESIS_SEEDS_MENU_LABEL)
        expect(consoleLogs).toContain(
            '>> [SEED:AUDIT] Populating hermetic genesis seed dossiers...',
        )
        for (const line of EXPECTED_BLOCK) {
            expect(consoleLogs).toContain(line)
        }
    })
})
