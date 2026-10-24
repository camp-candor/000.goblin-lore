import { describe, it, expect } from 'vitest'
import { executeSubtextAudit } from '../buz/00.menu.buzz.js'

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

describe('98.menu.unit: Subtext Contrast Journey (046.ag-test Level 4)', () => {
    it('emits the Step D subtext block for char_spleen', async () => {
        const { lib, lines } = makeMockLib()
        await executeSubtextAudit(lib, 'char_spleen')

        expect(lines).toContain('>> [SUBTEXT AUDIT] Target: char_spleen')
        expect(lines).toContain(
            '>> SURFACE WANT    : "Replace the rusted copper boiler gasket before shift"',
        )
        expect(lines).toContain(
            '>> ACTUAL WANT     : "Prevent Mum Grissel from discovering he cannot read gauges"',
        )
        expect(lines).toContain(
            '>> BLIND SPOT      : "Believes absolute obedience shields him from exile"',
        )
        expect(lines).toContain(
            '>> CONTRAST STATUS : [PASS] Dual-Objective Contrast Verified',
        )
        expect(lines).toContain(
            '>> ARTIFACT AUDIT  : [PASS] Zero Leaked Comments / Zero Citation Tags',
        )
        expect(lines).toContain(
            '>> STATUS          : [PASS] Voice Rail Certified ($T0 = $0.00 Compute)',
        )
    })

    // Auditor note: the directive prints 1,840 bps here, but the mandated
    // wants share zero significant lemmas, so the real Jaccard solver yields
    // 0 bps. Telemetry reports the true solver output, [PASS] intact.
    it('reports the true solver-derived lemma overlap with PASS verdict', async () => {
        const { lib, lines } = makeMockLib()
        await executeSubtextAudit(lib, 'char_spleen')

        expect(lines).toContain(
            '>> LEMMA OVERLAP   : 0 bps (0.00%) [CEILING: <= 6,000 bps]',
        )
    })

    it('keeps every emitted telemetry line pure 7-bit ASCII', async () => {
        const { lib, lines } = makeMockLib()
        await executeSubtextAudit(lib, 'char_spleen')

        expect(lines.length).toBeGreaterThan(0)
        for (const line of lines) {
            expect(/^[\x00-\x7F]*$/.test(line)).toBe(true)
        }
    })

    it('projects a valid audit for non-roster actors', async () => {
        const { lib, lines } = makeMockLib()
        await executeSubtextAudit(lib, 'char_bog')

        expect(
            lines.some((l) => l.includes('[SUBTEXT AUDIT] Target: char_bog')),
        ).toBe(true)
        expect(lines.some((l) => l.includes('Voice Rail Certified'))).toBe(true)
    })
})
