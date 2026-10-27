/* eslint-disable */
import { BasisPointsSchema } from '../../38.types.unit/fce/primitives.schema.js'
import { AcousticBarrierSchema } from '../../38.types.unit/fce/acoustic.schema.js'
import {
    scaleBasisPoints,
    scaleBasisPointsBigInt,
} from '../../38.types.unit/buz/math.buzz.js'

export const SCHEMA_MENU_LABEL = '[ SCHEMA & INVARIANTS ]'
export const VALIDATE_PRIMITIVES_LABEL = '[ 1. Validate Primitive Standards ]'
export const SCHEMA_BACK_LABEL = '[ BACK ]'

export const TELEMETRY_PRIMITIVES_AUDIT =
    '>> [PRIMITIVES:AUDIT] Verifying Integer Basis-Point Enforcements...'
export const TELEMETRY_PRIMITIVES_OK =
    '>> [PRIMITIVES:OK] Float rejection confirmed on BasisPointsSchema.'
export const TELEMETRY_MATH_AUDIT =
    ">> [MATH:AUDIT] Testing Banker's Rounding tie-break on remainder 5,000..."
export const TELEMETRY_MATH_OK =
    '>> [MATH:OK] Round-Half-Even quotient parity verified.'
export const TELEMETRY_GATE_PASSED =
    '>> [GATE_0:PASSED] Primitive mathematical foundations sealed. Status code: 0.'

/**
 * Runs the REAL Phase 1 primitive invariant checks against the live
 * 38.types.unit schemas and integer math. Returns the exact 7-bit ASCII
 * telemetry lines on success; throws a [GATE_0:FAILED] error on any breach.
 */
export const auditPrimitiveStandards = async (): Promise<string[]> => {
    // --- Primitives: float rejection + bounds on the live Zod schema ---
    const floatsRejected = [0.5, 9999.99].every((v) => {
        const res = BasisPointsSchema.safeParse(v)
        return (
            !res.success &&
            res.error.issues.some((i) =>
                i.message.includes('[FLOAT_PROHIBITED]'),
            )
        )
    })
    const boundsRejected = [-1, 10001].every((v) => {
        const res = BasisPointsSchema.safeParse(v)
        return (
            !res.success &&
            res.error.issues.some((i) => i.message.includes('[OUT_OF_BOUNDS]'))
        )
    })
    const boundsAccepted =
        BasisPointsSchema.safeParse(0).success &&
        BasisPointsSchema.safeParse(5000).success &&
        BasisPointsSchema.safeParse(10000).success
    if (!floatsRejected || !boundsRejected || !boundsAccepted) {
        throw new Error(
            '[GATE_0:FAILED] BasisPointsSchema invariant breach: float/bounds enforcement drift detected.',
        )
    }

    // --- Acoustic barrier strict-mode enforcement (silent gate) ---
    const strictProbe = AcousticBarrierSchema.safeParse({
        source_location_id: 'loc_a',
        target_location_id: 'loc_b',
        damping_cdb: 2500,
        rogue_key: 1,
    })
    if (strictProbe.success) {
        throw new Error(
            '[GATE_0:FAILED] AcousticBarrierSchema is not in .strict() mode: unknown keys accepted.',
        )
    }

    // --- Math: Banker's Rounding tie-breaks + number/BigInt parity ---
    const ties: Array<[number, number, number]> = [
        [50, 500, 2],
        [70, 500, 4],
        [30, 500, 2],
    ]
    for (const [a, b, expected] of ties) {
        const n = scaleBasisPoints(a, b)
        const bi = scaleBasisPointsBigInt(BigInt(a), BigInt(b))
        if (n !== expected || BigInt(n) !== bi) {
            throw new Error(
                `[GATE_0:FAILED] Round-Half-Even parity breach at (${a}, ${b}): got ${n} / ${bi}, expected ${expected}.`,
            )
        }
    }

    return [
        TELEMETRY_PRIMITIVES_AUDIT,
        TELEMETRY_PRIMITIVES_OK,
        TELEMETRY_MATH_AUDIT,
        TELEMETRY_MATH_OK,
        TELEMETRY_GATE_PASSED,
    ]
}
