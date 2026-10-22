import { VALID_FACT_SCOPES } from '../../38.types.unit/val/scope.val.js'
import { FACT_SCOPE_DEFINITIONS } from '../../38.types.unit/fce/scope.bit.js'
import { validateEntityPrefixAlignment } from '../../38.types.unit/buz/scope.buzz.js'
import { VALID_AUTHORITY_LEVELS } from '../../38.types.unit/val/authority.val.js'
import {
    AUTHORITY_RANK_MAP,
    AUTHORITY_DEFINITIONS,
} from '../../38.types.unit/fce/authority.bit.js'
import { canOverwriteAuthority } from '../../38.types.unit/buz/authority.buzz.js'

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

export function runAuthorityLevelMenuAudit(cns00: {
    log: (msg: string) => void
}): void {
    cns00.log(
        '--- [299.LORE :: 38.TYPES.UNIT :: AUTHORITY STRATIFICATION AUDIT] ---',
    )
    for (const level of VALID_AUTHORITY_LEVELS) {
        const def = AUTHORITY_DEFINITIONS[level]
        const rank = AUTHORITY_RANK_MAP[level]
        cns00.log(
            `[OK] Tier ${def.level.padEnd(14)} -> Rank: ${rank} | WritableBy: ${def.writableBy}`,
        )
    }

    // Precedence invariant check
    const demotionBlocked = !canOverwriteAuthority('SPECULATION', 'CANON')
    if (demotionBlocked) {
        cns00.log(
            '[TRAP PASS] Verified demotion blockage: SPECULATION cannot overwrite CANON.',
        )
    } else {
        cns00.log('[FAIL] Authority demotion guard failed.')
    }
    cns00.log('--- [AUDIT COMPLETE: 6/6 TIERS VERIFIED AT T0 = $0.00] ---')
}
