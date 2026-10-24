import { describe, it, expect } from 'vitest'
import { executeSomaticSatAudit } from '../buz/00.menu.buzz.js'

const UPDATE_CONSOLE = '[Console action] Update Console'

const makeMockLib = () => {
    const lines: string[] = []
    const lib = {
        hunt: async (typ: string, obj: any) => {
            if (typ === UPDATE_CONSOLE && typeof obj?.src === 'string') {
                lines.push(obj.src)
            }
            return {}
        },
    }
    return { lib, lines }
}

describe('98.menu.unit: Somatic SAT Inspection Journey (028.ag-test Level 4)', () => {
    it('emits the exact Step 4.2 SOMATIC:SAT_INSPECT block for char_wart', async () => {
        const { lib, lines } = makeMockLib()
        await executeSomaticSatAudit(lib, 'char_wart', 'act_bimanual_valve')

        expect(lines).toContain(
            '>> [SOMATIC:SAT_INSPECT] Actor: char_wart (Baseline: limping)',
        )
        expect(lines).toContain(
            '>> AVAILABLE LIMBS : Left: 0 bps (AMPUTATED) | Right: 10,000 bps (INTACT)',
        )
        expect(lines).toContain(
            '>> TOTAL SUPPLY    : 10,000 bps (1.0 Arm Available)',
        )
        expect(lines).toContain(
            '>> BANNED VERBS    : ["sprint", "vault", "bimanual_lift"]',
        )
        expect(lines).toContain(
            '>> SATISFIABILITY  : [OK] Single-Handed Right Arm Maneuvers Only',
        )
    })

    it('emits the exact Step 4.3 PREFLIGHT_SAT_FAIL block for act_bimanual_valve', async () => {
        const { lib, lines } = makeMockLib()
        await executeSomaticSatAudit(lib, 'char_wart', 'act_bimanual_valve')

        expect(lines).toContain(
            ':: [PREFLIGHT_SAT_FAIL] Actor char_wart: HAND_CAPACITY_BREACH',
        )
        expect(lines).toContain(
            ':: Demanded 20,000 bps hands but actor only possesses 10,000 bps capacity.',
        )
        expect(lines).toContain(
            ':: Clause CLAUSE_BIMANUAL_DUAL_ARM_REQUIREMENT: Unsatisfied.',
        )
        expect(lines).toContain(
            ':: Transaction aborted in RAM. Zero disk corruption. Compute spend: $0.00.',
        )
    })

    it('keeps every emitted telemetry line pure 7-bit ASCII', async () => {
        const { lib, lines } = makeMockLib()
        await executeSomaticSatAudit(lib, 'char_wart', 'act_bimanual_valve')

        expect(lines.length).toBeGreaterThan(0)
        for (const line of lines) {
            expect(/^[\x00-\x7F]*$/.test(line)).toBe(true)
        }
    })

    it('passes a bimanual action for a fully intact actor', async () => {
        const { lib, lines } = makeMockLib()
        await executeSomaticSatAudit(lib, 'char_bog', 'act_bimanual_valve')

        expect(lines.some((l) => l.includes('[PREFLIGHT_SAT_PASS]'))).toBe(true)
        expect(lines.some((l) => l.includes('[PREFLIGHT_SAT_FAIL]'))).toBe(
            false,
        )
    })
})
