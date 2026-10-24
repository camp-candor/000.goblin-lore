import { describe, it, expect } from 'vitest'
import {
    executeEscalationProfileInspect,
    executeEscalationTurnProbe,
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

describe('98.menu.unit: Escalation Profile Journey (033.ag-test Level 5)', () => {
    it('emits the exact Step 5.2 ESCALATION:INSPECT block for char_wart', async () => {
        const { lib, lines } = makeMockLib()
        await executeEscalationProfileInspect(lib, 'char_wart')

        expect(lines).toContain(
            '>> [ESCALATION:INSPECT] Actor: char_wart | Ceiling: 3 (Tier 3: Heated Bickering)',
        )
        expect(lines).toContain(
            '>> PERSONALITY STATS : Spite: 4 | Cunning: 2 | Charm: 1 | Nerve: 2 | Warmth: 1',
        )
        expect(lines).toContain(
            '>> SUBTEXT TOKENS    : ["amputation", "turbine", "coward"] (3 Monitored)',
        )
        expect(lines).toContain(
            '>> STATUS            : [OK] Conversational Pacing & Subtext Invariants Verified',
        )
    })

    it('emits the exact Step 5.3 ESCALATION:BREACH block for an unearned tier-5 turn', async () => {
        const { lib, lines } = makeMockLib()
        await executeEscalationTurnProbe(
            lib,
            'char_wart',
            5,
            0,
            'I will smash this valve!',
        )

        expect(lines).toContain(
            ':: [ESCALATION:BREACH] Actor char_wart: CONVERSATIONAL_CEILING_BREACH',
        )
        expect(lines).toContain(
            ':: Proposed intensity tier (5) exceeds actor escalation ceiling (3).',
        )
        expect(lines).toContain(
            ':: Zero leverage strings expended. Strained break state: FALSE.',
        )
        expect(lines).toContain(
            ':: Transaction aborted in RAM. Zero compute spend. Subtext preserved.',
        )
    })

    it('keeps every emitted telemetry line pure 7-bit ASCII', async () => {
        const { lib, lines } = makeMockLib()
        await executeEscalationProfileInspect(lib, 'char_wart')
        await executeEscalationTurnProbe(
            lib,
            'char_wart',
            5,
            0,
            'I will smash this valve!',
        )

        expect(lines.length).toBeGreaterThan(0)
        for (const line of lines) {
            expect(/^[\x00-\x7F]*$/.test(line)).toBe(true)
        }
    })

    it('passes an earned turn when leverage is expended', async () => {
        const { lib, lines } = makeMockLib()
        await executeEscalationTurnProbe(
            lib,
            'char_wart',
            5,
            1,
            'I will smash this valve!',
        )

        expect(lines.some((l) => l.includes('[ESCALATION:TURN_OK]'))).toBe(true)
        expect(lines.some((l) => l.includes('[ESCALATION:BREACH]'))).toBe(false)
    })

    it('reports attenuation leaks with the leak-specific receipt', async () => {
        const { lib, lines } = makeMockLib()
        await executeEscalationTurnProbe(
            lib,
            'char_wart',
            2,
            0,
            'You left me near the turbine!',
        )

        expect(lines).toContain(
            ':: [ESCALATION:BREACH] Actor char_wart: SUBTEXT_ATTENUATION_LEAK',
        )
        expect(
            lines.some((l) =>
                l.includes('forbidden subtext token(s): [turbine]'),
            ),
        ).toBe(true)
    })
})
