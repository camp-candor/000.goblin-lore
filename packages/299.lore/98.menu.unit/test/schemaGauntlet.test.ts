import { describe, it, expect } from 'vitest'
import { executeNegativeControlSchemaGauntlet } from '../buz/schemaGauntlet.buzz.js'

describe('98.menu.unit: Negative-Control Schema Gauntlet Runner', () => {
    it('POSITIVE: Executes all five negative-control traps and certifies 5/5 pass', async () => {
        const logs: string[] = []
        const mockLogger = (msg: string) => {
            logs.push(msg)
        }

        const result = await executeNegativeControlSchemaGauntlet(mockLogger)

        expect(result.totalTraps).toBe(5)
        expect(result.passedTraps).toBe(5)
        expect(result.failedTraps).toBe(0)
        expect(result.allPassed).toBe(true)

        // Verify all 5 individual trap IDs are recorded as passed
        expect(
            result.trapResults.find((t) => t.trapId === 'TRAP_1_UNSCHEMAED_KEY')
                ?.passed,
        ).toBe(true)
        expect(
            result.trapResults.find((t) => t.trapId === 'TRAP_2_FLOAT_EPOCH')
                ?.passed,
        ).toBe(true)
        expect(
            result.trapResults.find(
                (t) => t.trapId === 'TRAP_3_VERSION_REGRESSION',
            )?.passed,
        ).toBe(true)
        expect(
            result.trapResults.find(
                (t) => t.trapId === 'TRAP_4_AUTHORITY_DEMOTION',
            )?.passed,
        ).toBe(true)
        expect(
            result.trapResults.find(
                (t) => t.trapId === 'TRAP_5_NON_ASCII_EMOJI',
            )?.passed,
        ).toBe(true)

        // Assert final console banner was printed
        expect(
            logs.some((l) =>
                l.includes('[GAUNTLET PASS: 5/5 TRAPS VERIFIED AT T0 = $0.00]'),
            ),
        ).toBe(true)
    })
})
