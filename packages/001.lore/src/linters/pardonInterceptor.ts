import {
    WaiverGate,
    InterceptionContext,
    WaiverInterceptionResult,
} from '../core/governance/waiverGate.js'
import { LocalPardonLedger } from '../db/localPardonLedger.js'
import {
    loadOntologyRules,
    loadOntologyAuthorizers,
} from '../core/governance/pardonEnforcer.js'

export class PardonInterceptor {
    private gate: WaiverGate

    constructor(ledger: LocalPardonLedger, ontologyDir?: string) {
        const rules = loadOntologyRules(ontologyDir)
        const authorizers = loadOntologyAuthorizers(ontologyDir)
        this.gate = new WaiverGate(ledger, rules, authorizers)
    }

    /**
     * Intercepts a detected compilation or runtime rule violation.
     * Throws Error if breach is fatal/unpardonable.
     * Returns WaiverInterceptionResult if exemption is approved.
     */
    public interceptViolation(
        context: InterceptionContext,
    ): WaiverInterceptionResult {
        const result = this.gate.evaluate(context)

        if (result.status === 'FATAL_UNPARDONABLE_BREACH') {
            console.error(result.message)
            throw new Error(
                `FATAL_UNPARDONABLE_PHYSICAL_BREACH: ${result.message}`,
            )
        }

        if (!result.isExempt) {
            console.warn(result.message)
            throw new Error(`COMPILER_VIOLATION_UNPARDONED: ${result.message}`)
        }

        console.log(result.message)
        return result
    }
}
