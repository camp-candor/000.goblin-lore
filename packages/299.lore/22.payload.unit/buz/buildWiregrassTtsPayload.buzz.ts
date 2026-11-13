import fs from 'node:fs'
import type { ExtractedSomaticLedgerRecordBit } from '../../16.ledger.unit/fce/somaticLedger.bit.js'
import type { ComposedSomaticDspMatrix } from '../../14.intensity.unit/val/algebraicDsp.val.js'
import {
    assertIntegerMetric,
    SHA256_HEX_REGEX,
    type ConditioningStrategy,
    type TTSGenerationRequest,
} from '../val/ttsPayload.val.js'
import type { TTSPayloadValidationReceiptBit } from '../fce/ttsPayload.bit.js'
import { validateTtsGenerationPayload } from './validateTtsPayload.buzz.js'
import { canonicalizeJson, sha256Hex } from './canonicalPayloadHasher.buzz.js'

export interface WiregrassCanonSealSummary {
    readonly seriesSlug: string
    readonly rootMerkleHash: string
    readonly totalEntities: number
    readonly entityHashes: Readonly<Record<string, string>>
}

const REQUIRED_SEALED_CHARACTERS = [
    'char_johnny_walkman',
    'char_orbie_mayhaw',
] as const

function invalidCanonSeal(reason: string): Error {
    return new Error(`[CANON_SEAL_INVALID] ${reason}`)
}

function assertSha256Hex(
    value: unknown,
    label: string,
): asserts value is string {
    if (typeof value !== 'string' || !SHA256_HEX_REGEX.test(value)) {
        throw invalidCanonSeal(
            `${label} must be a 64-character lowercase SHA-256 hex digest`,
        )
    }
}

export function verifyWiregrassCanonSealForTts(
    bibleStatePath: string,
): WiregrassCanonSealSummary {
    if (!fs.existsSync(bibleStatePath)) {
        throw new Error(
            `[CANON_SEAL_MISSING] Cannot locate bible-state.json at: ${bibleStatePath}`,
        )
    }

    let parsed: any
    try {
        parsed = JSON.parse(fs.readFileSync(bibleStatePath, 'utf8'))
    } catch {
        throw invalidCanonSeal('bible-state.json is not valid JSON')
    }

    if (parsed?.series_slug !== 'wiregrass-basin') {
        throw invalidCanonSeal('series_slug must be wiregrass-basin')
    }
    assertSha256Hex(parsed.root_merkle_hash, 'root_merkle_hash')

    const entities = parsed.entities
    const entityHashes = parsed.entity_hashes
    if (
        !entities ||
        typeof entities !== 'object' ||
        Array.isArray(entities) ||
        !entityHashes ||
        typeof entityHashes !== 'object' ||
        Array.isArray(entityHashes)
    ) {
        throw invalidCanonSeal('entities and entity_hashes must be objects')
    }

    const totalEntities = Number(parsed.catalog_summary?.totalEntities ?? 0)
    if (
        !Number.isSafeInteger(totalEntities) ||
        totalEntities !== Object.keys(entities).length
    ) {
        throw invalidCanonSeal(
            'catalog_summary.totalEntities does not match entities',
        )
    }

    for (const entityId of REQUIRED_SEALED_CHARACTERS) {
        if (!entities[entityId] || !entityHashes[entityId]) {
            throw invalidCanonSeal(`sealed canon is missing ${entityId}`)
        }
    }

    for (const [entityId, expectedHash] of Object.entries(entityHashes)) {
        assertSha256Hex(expectedHash, `entity_hashes.${entityId}`)
        const entity = entities[entityId]
        if (!entity || typeof entity !== 'object') {
            throw invalidCanonSeal(
                `entity_hashes references missing entity ${entityId}`,
            )
        }
        const actualHash = sha256Hex(canonicalizeJson(entity))
        if (actualHash !== expectedHash) {
            throw invalidCanonSeal(`entity hash mismatch for ${entityId}`)
        }
    }

    const preSealPayload = {
        schema_version: parsed.schema_version,
        series_slug: parsed.series_slug,
        _meta: parsed._meta,
        catalog_summary: parsed.catalog_summary,
        entity_hashes: entityHashes,
        entities,
        chronology: parsed.chronology,
    }
    const recomputedRoot = sha256Hex(canonicalizeJson(preSealPayload))
    if (recomputedRoot !== parsed.root_merkle_hash) {
        throw invalidCanonSeal(
            'root_merkle_hash does not match sealed canon payload',
        )
    }

    return Object.freeze({
        seriesSlug: parsed.series_slug,
        rootMerkleHash: parsed.root_merkle_hash,
        totalEntities,
        entityHashes: Object.freeze({ ...entityHashes }),
    })
}

export interface BuildCharacterTtsRequestInput {
    readonly record: ExtractedSomaticLedgerRecordBit
    readonly seriesSlug?: string
    readonly sceneId: string
    readonly lineId: string
    readonly verbatimText: string
    readonly conditioningStrategy?: ConditioningStrategy
    readonly canSpeak?: boolean
    readonly pinnedFactVersions?: Record<string, number>
}

function deepFreeze<T>(value: T): T {
    if (value && typeof value === 'object') {
        for (const child of Object.values(value)) {
            deepFreeze(child)
        }
        if (!Object.isFrozen(value)) {
            Object.freeze(value)
        }
    }
    return value
}

export function buildCharacterTtsRequestFromLedger(
    input: BuildCharacterTtsRequestInput,
): {
    request: TTSGenerationRequest
    receipt: TTSPayloadValidationReceiptBit
} {
    const {
        record,
        seriesSlug = 'wiregrass-basin',
        sceneId,
        lineId,
        verbatimText,
        conditioningStrategy = 'ZERO_SHOT_WAV',
        canSpeak = true,
        pinnedFactVersions = {
            fact_dixie_starlight_rain_squall: 1,
            fact_booth_seven_parallax: 1,
        },
    } = input

    assertIntegerMetric(record.availableArmsBps, 'availableArmsBps')
    assertIntegerMetric(record.chronicFatigueFloorBps, 'chronicFatigueFloorBps')
    assertIntegerMetric(record.chronicPainFloorBps, 'chronicPainFloorBps')
    assertIntegerMetric(
        record.baselineDspDeltas.pitchShiftCentitones,
        'baselineDspDeltas.pitchShiftCentitones',
    )
    assertIntegerMetric(
        record.baselineDspDeltas.formantWarpingBps,
        'baselineDspDeltas.formantWarpingBps',
    )
    assertIntegerMetric(
        record.baselineDspDeltas.vocalFryDensityBps,
        'baselineDspDeltas.vocalFryDensityBps',
    )
    assertIntegerMetric(
        record.baselineDspDeltas.breathinessPauseBps,
        'baselineDspDeltas.breathinessPauseBps',
    )

    const isExhaustionStrained =
        record.chronicFatigueFloorBps >= 2500 ||
        record.chronicPainFloorBps >= 5000

    const composedDspMatrix: ComposedSomaticDspMatrix = {
        entityId: record.entityId,
        effectivePitchCentitones: record.baselineDspDeltas.pitchShiftCentitones,
        effectiveFormantWarpingBps: record.baselineDspDeltas.formantWarpingBps,
        effectiveTonePacingBps: isExhaustionStrained ? 8500 : 10000,
        effectiveBreathinessPauseBps:
            record.baselineDspDeltas.breathinessPauseBps,
        pauseFrequencyMultiplierBps: isExhaustionStrained ? 15000 : 11000,
        effectiveVocalFryDensityBps:
            record.baselineDspDeltas.vocalFryDensityBps,
        estimatedDurationExpansionBps: isExhaustionStrained ? 1800 : 500,
        visceralReflexHoldFrames: isExhaustionStrained ? 12 : 6,
        isExhaustionStrained,
        bannedCadences: [...record.baselineDspDeltas.bannedCadences],
    }

    const candidatePayload: TTSGenerationRequest = {
        seriesSlug,
        sceneId,
        lineId,
        characterId: record.entityId,
        verbatimText,
        conditioningStrategy,
        composedDspMatrix,
        somaticMask: {
            armsAvailableBps: record.availableArmsBps,
            locomotionBaseline: record.locomotionBaseline,
            activeConditions: [...record.activeConditions],
            bannedKineticVerbs: [...record.bannedVerbs],
            opticalState: 'NORMAL',
            blindConeDegrees: 0,
            canSpeak,
        },
        silenceDirective: {
            maxConsecutiveDialogueLines: 2,
            enforceBeatAfterDialogueCount: 2,
            allowExtendedMonologue: false,
            clampedBeatDurationFrames: 18,
        },
        pinnedFactVersions: { ...pinnedFactVersions },
    }

    const { request, receipt } = validateTtsGenerationPayload(candidatePayload)
    return {
        request: deepFreeze(request),
        receipt,
    }
}
