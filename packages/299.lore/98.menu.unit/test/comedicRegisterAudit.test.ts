import { describe, it, expect } from 'vitest'
import { executeComedicRegisterAudit } from '../buz/00.menu.buzz.js'

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

describe('98.menu.unit: Comedic Register Audit Journey (048.ag-test Level 4)', () => {
    it('emits the Step D audit block for char_spleen', async () => {
        const { lib, lines } = makeMockLib()
        await executeComedicRegisterAudit(lib, 'char_spleen')

        expect(lines).toContain(
            '>> [COMEDIC REGISTER AUDIT] Target: char_spleen',
        )
        expect(lines).toContain('>> REGISTER TAG    : hyper_literal [PASS]')
        expect(lines).toContain(
            '>> DIRECTIVE       : "Interpret all idioms, metaphors, and casual banter as exact mechanical or legalistic statements of fact."',
        )
        expect(lines).toContain(
            '>> SLOP SCANNER    : 0 Banned Latinate Tokens Detected [OK]',
        )
        expect(lines).toContain(
            '>> DELIVERY BOUNDS : Precise lexical pronunciation, pedantic numerical corrections.',
        )
        expect(lines).toContain(
            '>> STATUS          : [PASS] Comedic Register Validated ($T0 = $0.00 Compute)',
        )
    })

    it('keeps every emitted telemetry line pure 7-bit ASCII', async () => {
        const { lib, lines } = makeMockLib()
        await executeComedicRegisterAudit(lib, 'char_spleen')

        expect(lines.length).toBeGreaterThan(0)
        for (const line of lines) {
            expect(/^[\x00-\x7F]*$/.test(line)).toBe(true)
        }
    })

    it('projects a valid audit for non-roster actors', async () => {
        const { lib, lines } = makeMockLib()
        await executeComedicRegisterAudit(lib, 'char_bog')

        expect(
            lines.some((l) =>
                l.includes('[COMEDIC REGISTER AUDIT] Target: char_bog'),
            ),
        ).toBe(true)
        expect(
            lines.some((l) => l.includes('Comedic Register Validated')),
        ).toBe(true)
    })
})
