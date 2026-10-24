import { describe, it, expect } from 'vitest'
import {
    executeGearRelationalAudit,
    executeGearPointerProbe,
    buildGearAuditCatalog,
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

describe('98.menu.unit: Gear Relational Field Audit Journey (030.ag-test Level 5)', () => {
    it('emits the exact Step 5.2 GEAR:RESOLVE block', async () => {
        const { lib, lines } = makeMockLib()
        await executeGearRelationalAudit(lib)

        expect(lines).toContain(
            '>> [GEAR:RESOLVE] Auditing Pass 2 Relational Field Topology...',
        )
        expect(lines).toContain(
            '>> CATALOG CHECK   : 18 items loaded from series possessions/*.md',
        )
        expect(lines).toContain(
            '>> LEASE CHECK     : Spatial exclusivity verified across all active cast members',
        )
        expect(lines).toContain(
            '>> CUSTODY CHECK   : Zero ungrounded props. Zero dangling retired leases.',
        )
        expect(lines).toContain(
            '>> STATUS          : [OK] Relational Foreign-Key Integrity Verified [T0 = $0.00]',
        )
    })

    it('derives the catalog count from the real in-memory index', async () => {
        expect(Object.keys(buildGearAuditCatalog()).length).toBe(18)
    })

    it('emits the exact Step 5.3 GEAR:POINTER_FAIL block for item_phantom_drill', async () => {
        const { lib, lines } = makeMockLib()
        await executeGearPointerProbe(lib, 'char_bog', 'item_phantom_drill')

        expect(lines).toContain(
            ':: [GEAR:POINTER_FAIL] Entity char_bog: DANGLING_POSSESSION_POINTER',
        )
        expect(lines).toContain(
            ':: Non-existent possession slug [item_phantom_drill]',
        )
        expect(lines).toContain(
            ':: Transaction aborted in RAM. Zero disk corruption. Compute spend: $0.00.',
        )
    })

    it('keeps every emitted telemetry line pure 7-bit ASCII', async () => {
        const { lib, lines } = makeMockLib()
        await executeGearRelationalAudit(lib)
        await executeGearPointerProbe(lib, 'char_bog', 'item_phantom_drill')

        expect(lines.length).toBeGreaterThan(0)
        for (const line of lines) {
            expect(/^[\x00-\x7F]*$/.test(line)).toBe(true)
        }
    })

    it('passes the pointer probe for a cataloged item', async () => {
        const { lib, lines } = makeMockLib()
        await executeGearPointerProbe(lib, 'char_bog', 'item_iron_knife')

        expect(lines.some((l) => l.includes('[GEAR:RESOLVE_OK]'))).toBe(true)
        expect(lines.some((l) => l.includes('[GEAR:POINTER_FAIL]'))).toBe(false)
    })
})
