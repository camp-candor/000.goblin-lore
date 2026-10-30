import { describe, expect, it } from 'vitest'
import {
    RUN_SOLVER_SAT_LABEL,
    SCHEMA_SOLVER_MENU_LABEL,
    VALIDATE_MANIFESTS_LABEL,
    runEntityManifestAudit,
    runSomaticSolverAudit,
} from '../buz/05.schema.solver.audit.buzz'

describe('Phase 5 schema solver menu wiring', () => {
    it('exposes the mandated 26.schema.unit journey labels', () => {
        expect(SCHEMA_SOLVER_MENU_LABEL).toBe('[ 26. SCHEMA & INVARIANTS ]')
        expect(VALIDATE_MANIFESTS_LABEL).toBe(
            '[ 1. Validate Entity Manifests ]',
        )
        expect(RUN_SOLVER_SAT_LABEL).toBe('[ 2. Run Somatic SAT Solver ]')
    })

    it('streams entity manifests through the live 26.schema.unit router', async () => {
        const lines = await runEntityManifestAudit()
        expect(lines.some((l) => l.includes('[SCHEMA:OK]'))).toBe(true)
        expect(
            lines.some(
                (l) =>
                    l.includes('item_silver_spoon') &&
                    l.includes('UNKNOWN_ENTITY_SCHEMA'),
            ),
        ).toBe(true)
    })

    it('solves hand capacity through the live solveSomaticSAT solver', async () => {
        const lines = await runSomaticSolverAudit()
        expect(lines.some((l) => l.includes('[SAT:OK]'))).toBe(true)
        expect(lines.some((l) => l.includes('[SOMATIC_OVERLOAD]'))).toBe(true)
    })
})
