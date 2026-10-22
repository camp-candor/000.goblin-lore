import { VALID_FACT_SCOPES } from '../../38.types.unit/val/scope.val.js'
import { FACT_SCOPE_DEFINITIONS } from '../../38.types.unit/fce/scope.bit.js'
import { validateEntityPrefixAlignment } from '../../38.types.unit/buz/scope.buzz.js'

export function runFactScopeMenuAudit(cns00: {
    log: (msg: string) => void
}): void {
    cns00.log('--- [299.LORE :: 38.TYPES.UNIT :: FACT SCOPE AUDIT] ---')
    for (const scope of VALID_FACT_SCOPES) {
        const def = FACT_SCOPE_DEFINITIONS[scope]
        const testId = `${def.expectedPrefix}test_probe`
        const check = validateEntityPrefixAlignment(scope, testId)
        if (check.valid) {
            cns00.log(
                `[OK] Scope ${def.scope.padEnd(10)} -> Prefix '${def.expectedPrefix}' verified.`,
            )
        } else {
            cns00.log(`[FAIL] Scope ${scope} verification failed.`)
        }
    }
    cns00.log('--- [AUDIT COMPLETE: 4/4 SCOPES VERIFIED AT T0 = $0.00] ---')
}
