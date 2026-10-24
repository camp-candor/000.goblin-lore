import { describe, it, expect } from 'vitest'
import {
    executeLeverageGraphAudit,
    executeLeverageSpendProbe,
} from '../buz/00.menu.buzz.js'

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

describe('98.menu.unit: Leverage Strings Journey (035.ag-test Level 5)', () => {
    it('emits the exact Step 5.2 LEVERAGE:INDEX block', async () => {
        const { lib, lines } = makeMockLib()
        await executeLeverageGraphAudit(lib)

        expect(lines).toContain(
            '>> [LEVERAGE:INDEX] Auditing Directed Social Debt Graph...',
        )
        expect(lines).toContain(
            '>> SCAN PATTERN    : series/<slug>/characters/*.md',
        )
        expect(lines).toContain(
            '>> ANTI-REFLEXIVITY: [OK] Zero self-referential debt edges detected',
        )
        expect(lines).toContain(
            '>> FOREIGN KEYS    : [OK] All debtor targets resolved to active canonical dossiers',
        )
        expect(lines).toContain(
            '>> SOLVENCY GATE   : [OK] In-memory deduction solver verified at T0 = $0.00',
        )
    })

    it('emits the exact Step 5.3 LEVERAGE:SPEND_FAIL block for a wart->bog overdraft', async () => {
        const { lib, lines } = makeMockLib()
        await executeLeverageSpendProbe(lib, 'char_wart', 'char_bog', 1)

        expect(lines).toContain(
            ':: [LEVERAGE:SPEND_FAIL] char_wart->char_bog: INSUFFICIENT_STRINGS_BREACH',
        )
        expect(lines).toContain(
            ':: Entity char_wart attempted to spend 1 strings over char_bog, but holds 0.',
        )
        expect(lines).toContain(
            ':: Solvency gate failed. Zero state mutation. Transaction aborted at T0 = $0.00.',
        )
    })

    it('keeps every emitted telemetry line pure 7-bit ASCII', async () => {
        const { lib, lines } = makeMockLib()
        await executeLeverageGraphAudit(lib)
        await executeLeverageSpendProbe(lib, 'char_wart', 'char_bog', 1)

        expect(lines.length).toBeGreaterThan(0)
        for (const line of lines) {
            expect(/^[\x00-\x7F]*$/.test(line)).toBe(true)
        }
    })

    it('passes a solvent spend and reports the remaining balance', async () => {
        const { lib, lines } = makeMockLib()
        await executeLeverageSpendProbe(lib, 'char_bog', 'char_wart', 1)

        expect(lines.some((l) => l.includes('[LEVERAGE:SPEND_PASS]'))).toBe(
            true,
        )
        expect(lines.some((l) => l.includes('Balance: 1 [OK]'))).toBe(true)
    })

    it('reports self-spend attempts with the reflexivity-specific receipt', async () => {
        const { lib, lines } = makeMockLib()
        await executeLeverageSpendProbe(lib, 'char_bog', 'char_bog', 1)

        expect(lines).toContain(
            ':: [LEVERAGE:SPEND_FAIL] char_bog->char_bog: ANTI_REFLEXIVITY_BREACH',
        )
        expect(lines.some((l) => l.includes('Self-debt prohibited.'))).toBe(
            true,
        )
    })
})
