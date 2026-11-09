/**
 * packages/299.lore/98.menu.unit/test/menu.four.tuple.audit.test.ts
 *
 * Vitest verification suite for the Phase 4 Universal Narrative Four-Tuple
 * menu wiring: submenu route exposure, real live-schema contract auditing,
 * fail-closed negative probes, cns00 telemetry formatting, plus the full
 * Level 4 TUI journey from the lore dashboard through the schema submenu.
 */

import { describe, it, expect, afterEach } from 'vitest'
import { MenuModel } from '../menu.model'
import { updateMenu, openSchemaInvariantsMenu } from '../buz/00.menu.buzz'
import {
    FOUR_TUPLE_MENU_LABEL,
    FOUR_TUPLE_AUDIT_HEADER,
    FOUR_TUPLE_STATE_SPACE_LINE,
    FOUR_TUPLE_ACTION_VOCAB_LINE,
    FOUR_TUPLE_INVARIANTS_LINE,
    FOUR_TUPLE_PROJECTIONS_LINE,
    FOUR_TUPLE_SEALED_FOOTER,
    runFourTupleContractAudit,
    auditFourTupleContract,
} from '../buz/17.four.tuple.audit.buzz'

const EXPECTED_BLOCK = [
    FOUR_TUPLE_AUDIT_HEADER,
    FOUR_TUPLE_STATE_SPACE_LINE,
    FOUR_TUPLE_ACTION_VOCAB_LINE,
    FOUR_TUPLE_INVARIANTS_LINE,
    FOUR_TUPLE_PROJECTIONS_LINE,
    FOUR_TUPLE_SEALED_FOOTER,
]

describe('299.lore - Universal Narrative Four-Tuple Menu Wiring Suite', () => {
    afterEach(() => {
        delete (globalThis as any).LIBRARY
        delete (global as any).LIBRARY
    })

    it('openSchemaInvariantsMenu -- exposes manifest, solver, registry, errata, four-tuple, back options headless', async () => {
        let resolved: any = null
        const bal = {
            idx: 'test-schema-menu-tuple',
            dat: { activeSeries: '001.goblin-lore' },
            slv: (res: any) => {
                resolved = res
            },
        }

        const model = new MenuModel()
        await openSchemaInvariantsMenu(model, bal as any, undefined as any)

        expect(resolved).toBeTruthy()
        expect(resolved.mnuBit.lst).toContain(
            '[ 1. VALIDATE ENTITY MANIFESTS ]',
        )
        expect(resolved.mnuBit.lst).toContain('[ 2. RUN SOMATIC SAT SOLVER ]')
        expect(resolved.mnuBit.lst).toContain(
            '[ 3. CONSTITUTIONAL RULE REGISTRY ]',
        )
        expect(resolved.mnuBit.lst).toContain(
            '[ 4. CRYPTOGRAPHIC ERRATA LEDGER ]',
        )
        expect(resolved.mnuBit.lst).toContain(FOUR_TUPLE_MENU_LABEL)
        expect(resolved.mnuBit.lst).toContain('[ BACK ]')
    })

    it('auditFourTupleContract -- seals canonical config, traps every negative probe', () => {
        const audit = auditFourTupleContract()

        expect(audit.valid).toBe(true)
        expect(audit.errors).toEqual([])
        expect(audit.canonicalSealed).toBe(true)
        expect(audit.probeTotal).toBe(7)
        expect(audit.probesTrapped).toBe(7)
    })

    it('runFourTupleContractAudit -- streams the exact six-line contract block', async () => {
        const lines = await runFourTupleContractAudit()

        expect(lines).toEqual(EXPECTED_BLOCK)
        expect(lines[0]).toBe(
            '--- [299.LORE :: 29.SERIES.UNIT :: UNIVERSAL FOUR-TUPLE CONTRACT AUDIT] ---',
        )
        expect(lines[lines.length - 1]).toBe(
            '--- [AUDIT COMPLETE: UNIVERSAL NARRATIVE FOUR-TUPLE SEALED AT T0 = $0.00] ---',
        )
    })

    it('runFourTupleContractAudit -- emits pure 7-bit ASCII telemetry', async () => {
        const lines = await runFourTupleContractAudit()

        expect(FOUR_TUPLE_MENU_LABEL).toMatch(/^[\x20-\x7E]*$/)
        for (const line of lines) {
            expect(/^[\x20-\x7E]*$/.test(line)).toBe(true)
        }
    })

    it('Level 4 TUI journey -- lore dashboard routes four-tuple selection into cns00 telemetry', async () => {
        const consoleLogs: string[] = []
        const choiceQueue = [
            '[ 26. SCHEMA & INVARIANTS ]',
            FOUR_TUPLE_MENU_LABEL,
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
        const bal: any = { idx: 'test-four-tuple-journey' }
        const mockState = {
            hunt: async (_act: string, _payload: any) => ({}),
        }

        await updateMenu(model, bal, mockState as any)

        expect(observedChoiceLists[0]).toContain('[ 26. SCHEMA & INVARIANTS ]')
        expect(observedChoiceLists[1]).toContain(FOUR_TUPLE_MENU_LABEL)
        expect(consoleLogs).toContain(
            '>> [TUPLE:AUDIT] Validating Universal Narrative Four-Tuple contract...',
        )
        for (const line of EXPECTED_BLOCK) {
            expect(consoleLogs).toContain(line)
        }
    })
})
