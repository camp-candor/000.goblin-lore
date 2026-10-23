import { FactNodeSchema } from '../../26.schema.unit/val/schema.val.js'
import { evaluateVersionProgression } from '../../28.sequence.unit/buz/sequence.buzz.js'
import { canOverwriteAuthority } from '../../38.types.unit/buz/authority.buzz.js'
import { computeFactContentHash } from '../../41.canon.unit/buz/canonHash.buzz.js'
import {
    GauntletTrapResult,
    SchemaGauntletSummaryBit,
} from '../fce/schemaGauntlet.bit.js'
import { emitBusConsoleLog } from '../../99.bus.unit/buz/bus.buzz.js'

/**
 * Executes the 5-part Negative-Control Schema Trap Gauntlet at Stage T0 ($0.00).
 * Validates fail-closed behavior across:
 * 1. Un-schemaed key injection (.strict() closure)
 * 2. Floating-point epoch injection (integer timestamp constraint)
 * 3. Monotonic version regression (v_new < v_old)
 * 4. Authority hierarchy demotion (lower tier overwriting higher tier)
 * 5. Non-ASCII / multi-byte UTF-8 emoji in claim_text
 */
export async function executeNegativeControlSchemaGauntlet(
    loggerOverride?: (msg: string) => void | Promise<void>,
): Promise<SchemaGauntletSummaryBit> {
    const startTime = Date.now()
    const trapResults: GauntletTrapResult[] = []

    const log = async (msg: string) => {
        if (loggerOverride) {
            await loggerOverride(msg)
        } else {
            await emitBusConsoleLog('cns00', msg)
        }
    }

    await log('--- [299.LORE :: NEGATIVE-CONTROL SCHEMA TRAP GAUNTLET] ---')
    await log(
        '>> Initiating 5/5 Invariant Fail-Closed Integrity Sweep (T0 = $0.00)...',
    )

    const baseValidClaim = 'Culvert drainage valve is cast iron.'
    const baseValidHash = computeFactContentHash('LOCATION', baseValidClaim)

    const validBaseline = {
        id: 'fact_culvert_valve',
        claim_text: baseValidClaim,
        scope: 'LOCATION',
        authority_level: 'CANON',
        standing: 'ACTIVE_ENDORSED',
        version: 1,
        content_hash: baseValidHash,
        author: 'elena',
        created_at_epoch: 1714000000,
        last_mutated_epoch: 1714000000,
        last_reconsidered_epoch: 1714000000,
    }

    // --------------------------------------------------------------------------
    // TRAP 1: Un-schemaed Key Injection (.strict() Closure Check)
    // --------------------------------------------------------------------------
    const payloadTrap1 = {
        ...validBaseline,
        confidence_float: 0.98,
        hallucinated_prop: 'rogue_value',
    }

    const parseResult1 = FactNodeSchema.safeParse(payloadTrap1)
    if (
        !parseResult1.success &&
        parseResult1.error.errors.some((e) => e.code === 'unrecognized_keys')
    ) {
        trapResults.push({
            trapId: 'TRAP_1_UNSCHEMAED_KEY',
            trapDescription:
                'Un-schemaed key injection rejected via .strict() closure',
            passed: true,
            caughtErrorCode: 'UNRECOGNIZED_KEYS',
            diagnosticMessage:
                'Blocked extraneous keys: confidence_float, hallucinated_prop',
        })
        await log(
            '[TRAP 1 PASS] Un-schemaed key injection caught by .strict() closure.',
        )
    } else {
        trapResults.push({
            trapId: 'TRAP_1_UNSCHEMAED_KEY',
            trapDescription:
                'Un-schemaed key injection rejected via .strict() closure',
            passed: false,
            caughtErrorCode: 'NONE',
            diagnosticMessage:
                'CRITICAL: Schema allowed un-schemaed keys into payload!',
        })
        await log('[TRAP 1 FAIL] Un-schemaed key injection was NOT trapped.')
    }

    // --------------------------------------------------------------------------
    // TRAP 2: Floating-Point Epoch Timestamp Violation
    // --------------------------------------------------------------------------
    const payloadTrap2 = {
        ...validBaseline,
        created_at_epoch: 1714000000.428, // IEEE 754 float
    }

    const parseResult2 = FactNodeSchema.safeParse(payloadTrap2)
    if (
        !parseResult2.success &&
        parseResult2.error.errors.some(
            (e) => e.message.includes('integer') || e.code === 'invalid_type',
        )
    ) {
        trapResults.push({
            trapId: 'TRAP_2_FLOAT_EPOCH',
            trapDescription:
                'Floating-point epoch rejected; integer timestamp enforced',
            passed: true,
            caughtErrorCode: 'INVALID_INTEGER_EPOCH',
            diagnosticMessage:
                'Rejected float value 1714000000.428 on created_at_epoch',
        })
        await log('[TRAP 2 PASS] Floating-point epoch timestamp trapped.')
    } else {
        trapResults.push({
            trapId: 'TRAP_2_FLOAT_EPOCH',
            trapDescription:
                'Floating-point epoch rejected; integer timestamp enforced',
            passed: false,
            caughtErrorCode: 'NONE',
            diagnosticMessage:
                'CRITICAL: Schema permitted non-integer float epoch!',
        })
        await log('[TRAP 2 FAIL] Floating-point epoch was NOT trapped.')
    }

    // --------------------------------------------------------------------------
    // TRAP 3: Non-Monotonic Version Regression Check (v2 -> v1)
    // --------------------------------------------------------------------------
    const regressionStep = evaluateVersionProgression({
        currentVersion: 2,
        proposedVersion: 1,
        claimMutated: true,
        hashMutated: true,
    })

    if (
        !regressionStep.valid &&
        (regressionStep as any).errorCode ===
            'MONOTONIC_VERSION_REGRESSION_BREACH'
    ) {
        trapResults.push({
            trapId: 'TRAP_3_VERSION_REGRESSION',
            trapDescription:
                'Non-monotonic version regression rejected (v2 -> v1)',
            passed: true,
            caughtErrorCode: (regressionStep as any).errorCode,
            diagnosticMessage: (regressionStep as any).message,
        })
        await log('[TRAP 3 PASS] Version regression (v2 -> v1) trapped.')
    } else {
        trapResults.push({
            trapId: 'TRAP_3_VERSION_REGRESSION',
            trapDescription:
                'Non-monotonic version regression rejected (v2 -> v1)',
            passed: false,
            caughtErrorCode: 'NONE',
            diagnosticMessage:
                'CRITICAL: Version sequence engine permitted backward regression!',
        })
        await log('[TRAP 3 FAIL] Version regression was NOT trapped.')
    }

    // --------------------------------------------------------------------------
    // TRAP 4: Authority Hierarchy Demotion Check (SPECULATION over CANON)
    // --------------------------------------------------------------------------
    const demotionPermitted = canOverwriteAuthority('SPECULATION', 'CANON')
    if (!demotionPermitted) {
        trapResults.push({
            trapId: 'TRAP_4_AUTHORITY_DEMOTION',
            trapDescription:
                'Authority hierarchy demotion blocked (SPECULATION over CANON)',
            passed: true,
            caughtErrorCode: 'PRE_WRITE_AUTHORITY_DEMOTION',
            diagnosticMessage: 'Rank 100 cannot overwrite Rank 500',
        })
        await log(
            '[TRAP 4 PASS] Authority demotion (SPECULATION over CANON) trapped.',
        )
    } else {
        trapResults.push({
            trapId: 'TRAP_4_AUTHORITY_DEMOTION',
            trapDescription:
                'Authority hierarchy demotion blocked (SPECULATION over CANON)',
            passed: false,
            caughtErrorCode: 'NONE',
            diagnosticMessage:
                'CRITICAL: Lower authority tier was permitted to overwrite higher tier!',
        })
        await log('[TRAP 4 FAIL] Authority demotion was NOT trapped.')
    }

    // --------------------------------------------------------------------------
    // TRAP 5: Multi-Byte Non-ASCII Emoji Breach
    // --------------------------------------------------------------------------
    const emojiClaim = 'Culvert drainage valve is sealed \uD83D\uDD12.' // Contains padlock emoji
    const payloadTrap5 = {
        ...validBaseline,
        claim_text: emojiClaim,
        content_hash: computeFactContentHash('LOCATION', emojiClaim),
    }

    const parseResult5 = FactNodeSchema.safeParse(payloadTrap5)
    // Zod / asciiGuard check must fail closed on non-ASCII characters
    if (
        !parseResult5.success &&
        parseResult5.error.errors.some(
            (e) => e.message.includes('ASCII') || e.code === 'custom',
        )
    ) {
        trapResults.push({
            trapId: 'TRAP_5_NON_ASCII_EMOJI',
            trapDescription:
                'Multi-byte UTF-8 emoji rejected via 7-bit ASCII guard',
            passed: true,
            caughtErrorCode: 'NON_ASCII_CHARACTER_DETECTED',
            diagnosticMessage: 'Detected non-ASCII character in claim_text',
        })
        await log('[TRAP 5 PASS] Multi-byte non-ASCII emoji trapped.')
    } else {
        trapResults.push({
            trapId: 'TRAP_5_NON_ASCII_EMOJI',
            trapDescription:
                'Multi-byte UTF-8 emoji rejected via 7-bit ASCII guard',
            passed: false,
            caughtErrorCode: 'NONE',
            diagnosticMessage:
                'CRITICAL: Multi-byte unicode emoji penetrated the ASCII guard!',
        })
        await log('[TRAP 5 FAIL] Non-ASCII emoji was NOT trapped.')
    }

    // --------------------------------------------------------------------------
    // SUMMARY & VERDICT COMPILATION
    // --------------------------------------------------------------------------
    const passedCount = trapResults.filter((t) => t.passed).length
    const failedCount = trapResults.filter((t) => !t.passed).length
    const allPassed = passedCount === 5

    if (allPassed) {
        await log('>> ======================================================')
        await log('>> [GAUNTLET PASS: 5/5 TRAPS VERIFIED AT T0 = $0.00]')
        await log('>> All legislative fact invariants certified fail-closed.')
        await log('>> ======================================================')
    } else {
        await log(`>> [GAUNTLET FAIL: ${failedCount}/5 TRAPS FAILED]`)
    }

    return {
        totalTraps: 5,
        passedTraps: passedCount,
        failedTraps: failedCount,
        allPassed,
        trapResults,
        executionTimeMs: Date.now() - startTime,
    }
}
