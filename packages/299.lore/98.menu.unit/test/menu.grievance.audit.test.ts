import { describe, expect, it } from 'vitest'
import {
    AUDIT_DAG_LABEL,
    DYADIC_HEALTH_LABEL,
    GRIEVANCE_MENU_LABEL,
    VERIFY_EPISTEMIC_LABEL,
    runCausalDagAudit,
    runDyadicMeshAudit,
    runEpistemicFirewallAudit,
} from '../buz/04.grievance.audit.buzz'

describe('Phase 4 grievance menu wiring', () => {
    it('exposes the mandated GRIEVANCES & CAUSALITY journey labels', () => {
        expect(GRIEVANCE_MENU_LABEL).toBe('[ GRIEVANCES & CAUSALITY ]')
        expect(AUDIT_DAG_LABEL).toBe('[ 1. Audit Causal Escalation DAG ]')
        expect(DYADIC_HEALTH_LABEL).toBe('[ 2. Check Dyadic Mesh Health ]')
        expect(VERIFY_EPISTEMIC_LABEL).toBe('[ 3. Verify Epistemic Firewalls ]')
    })

    it('audits the causal escalation DAG against the live cycle detector', async () => {
        const lines = await runCausalDagAudit()
        expect(lines.some((l) => l.includes('[DAG:OK]'))).toBe(true)
        expect(
            lines.some(
                (l) =>
                    l.includes('depth(grv_spoon_credit_dispute)=0') &&
                    l.includes('depth(grv_generational_famine_feud)=2'),
            ),
        ).toBe(true)
    })

    it('audits dyadic mesh health against the live grievance schema', async () => {
        const lines = await runDyadicMeshAudit()
        expect(lines.some((l) => l.includes('[DYAD:OK]'))).toBe(true)
    })

    it('verifies epistemic firewalls against the live disjointness evaluator', async () => {
        const lines = await runEpistemicFirewallAudit()
        expect(lines.some((l) => l.includes('[EPISTEMIC:OK]'))).toBe(true)
    })
})
