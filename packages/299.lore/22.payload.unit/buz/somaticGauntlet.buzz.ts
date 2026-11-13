import * as crypto from 'node:crypto'
import { z } from 'zod'
import type State from '../../99.core/state.js'
import type { PayloadModel } from '../payload.model.js'
import type {
    SomaticTrapId,
    SomaticTrapResult,
    SomaticGauntletSummary,
    default as PayloadGauntletBit,
} from '../fce/somaticGauntlet.bit.js'

const BasisPointMetricSchema = z
    .number()
    .int({ message: '[FLOAT_PROHIBITED] Basis points must be pure integers' })
    .min(0)
    .max(10000)

const ClosedIngressEnvelopeSchema = z
    .object({
        entity_id: z.string().regex(/^[a-z]+_[a-z0-9_]+$/),
        epoch: z.number().int().min(0),
        tension_bps: BasisPointMetricSchema,
    })
    .strict()

function assertVocalDeliveryPermitted(
    isAphonic: boolean,
    lineText: string,
): void {
    if (isAphonic && lineText.trim().length > 0) {
        throw new Error(
            'VOCAL_DELIVERY_BREACH: Aphonic actor cannot emit voiced dialogue stems',
        )
    }
}

function assertMonotonicVersion(
    prevVersion: number,
    nextVersion: number,
): void {
    if (nextVersion !== prevVersion + 1) {
        throw new Error(
            `MONOTONIC_VERSION_REGRESSION_BREACH: Expected v${prevVersion + 1}, received v${nextVersion}`,
        )
    }
}

function canonicalStringify(value: unknown): string {
    if (value === null || typeof value !== 'object') {
        return JSON.stringify(value)
    }
    if (Array.isArray(value)) {
        return `[${value.map((v) => canonicalStringify(v)).join(',')}]`
    }
    const rec = value as Record<string, unknown>
    const keys = Object.keys(rec).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
    return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalStringify(rec[k])}`).join(',')}}`
}

function assertPayloadHashParity(
    payload: Record<string, unknown>,
    expectedHex: string,
): void {
    const actualHex = crypto
        .createHash('sha256')
        .update(canonicalStringify(payload), 'utf8')
        .digest('hex')
    if (actualHex !== expectedHex) {
        throw new Error(
            `PAYLOAD_HASH_PARITY_BREACH: Digest mismatch (expected ${expectedHex.slice(0, 12)}, got ${actualHex.slice(0, 12)})`,
        )
    }
}

function executeTrap(
    trapId: SomaticTrapId,
    stageLabel: string,
    expectedSignature: string,
    fn: () => void,
): SomaticTrapResult {
    const start = Date.now()
    let caughtSignature = 'NONE'
    let passed = false

    try {
        fn()
    } catch (err: any) {
        const msg = String(err?.message || err)
        if (msg.includes(expectedSignature)) {
            caughtSignature = expectedSignature
            passed = true
        } else {
            caughtSignature = msg
        }
    }

    const latency = Math.max(0, Date.now() - start)
    return Object.freeze({
        trapId,
        stageLabel,
        passed,
        caughtExceptionSignature: caughtSignature,
        executionLatencyMs: latency,
    })
}

export function runSomaticGauntlet(
    seed: number = 100,
): Readonly<SomaticGauntletSummary> {
    if (!Number.isInteger(seed)) {
        throw new Error('[FLOAT_PROHIBITED] Gauntlet seed must be an integer')
    }

    const suiteStart = Date.now()
    const results: SomaticTrapResult[] = []

    results.push(
        executeTrap(
            'TRAP_1_FLOAT_METRIC_PROHIBITED',
            'STAGE_1 :: Float Metric Trap',
            '[FLOAT_PROHIBITED]',
            () => {
                BasisPointMetricSchema.parse(4250.75 + (seed % 1))
            },
        ),
    )

    results.push(
        executeTrap(
            'TRAP_2_UNSCHEMAED_KEY_CLOSURE',
            'STAGE_2 :: Strict Key Closure Trap',
            'ZOD_STRICT_UNRECOGNIZED_KEYS',
            () => {
                const res = ClosedIngressEnvelopeSchema.safeParse({
                    entity_id: 'char_wart',
                    epoch: seed,
                    tension_bps: 5000,
                    unschemaed_hallucinated_key: true,
                })
                if (!res.success) {
                    throw new Error(
                        'ZOD_STRICT_UNRECOGNIZED_KEYS: ' + res.error.message,
                    )
                }
            },
        ),
    )

    results.push(
        executeTrap(
            'TRAP_3_APHONIC_DELIVERY_BREACH',
            'STAGE_3 :: Aphonia Delivery Trap',
            'VOCAL_DELIVERY_BREACH',
            () => {
                assertVocalDeliveryPermitted(
                    true,
                    'Speak through the broken grate',
                )
            },
        ),
    )

    results.push(
        executeTrap(
            'TRAP_4_MONOTONIC_VERSION_REGRESSION',
            'STAGE_4 :: Monotonic Regression Trap',
            'MONOTONIC_VERSION_REGRESSION_BREACH',
            () => {
                assertMonotonicVersion(4, 3)
            },
        ),
    )

    results.push(
        executeTrap(
            'TRAP_5_RFC8785_HASH_PARITY_BREACH',
            'STAGE_5 :: Hash Parity Sentinel Trap',
            'PAYLOAD_HASH_PARITY_BREACH',
            () => {
                const validPayload = {
                    seed,
                    entity: 'char_wart',
                    status: 'ACTIVE_ENDORSED',
                }
                const validDigest = crypto
                    .createHash('sha256')
                    .update(canonicalStringify(validPayload), 'utf8')
                    .digest('hex')
                const tamperedPayload = {
                    seed,
                    entity: 'char_wart',
                    status: 'TAMPERED',
                }
                assertPayloadHashParity(tamperedPayload, validDigest)
            },
        ),
    )

    const frozenResults = Object.freeze(results)
    const trapsPassed = frozenResults.filter((r) => r.passed).length
    const totalLatencyMs = Math.max(0, Date.now() - suiteStart)

    return Object.freeze({
        seed,
        totalTraps: frozenResults.length,
        trapsPassed,
        isCertified: trapsPassed === frozenResults.length,
        totalLatencyMs,
        results: frozenResults,
    })
}

export const runSomaticGauntletAction = (
    cpy: PayloadModel,
    bal: PayloadGauntletBit,
    ste?: State,
): PayloadModel => {
    const seed = typeof bal?.dat?.seed === 'number' ? bal.dat.seed : 100
    const summary = runSomaticGauntlet(seed)

    if (bal?.slv) {
        bal.slv({
            payloadBit: {
                idx: bal.idx || 'run-somatic-gauntlet',
                val: summary.isCertified ? 1 : 0,
                dat: summary,
            },
        })
    }
    return cpy
}
