// packages/001.lore/schemas/schemas.ts
import { z } from 'zod'

/**
 * Pure 7-bit ASCII Telemetry Prefix Constants
 */
export const LORE_SCHEMA_TAG = '[LORE::SCHEMA]' as const

/**
 * Byte-0 Frontmatter Invariant Verifier
 * Asserts that raw dossier buffers begin strictly at byte index 0 with "---\n" or "---\r\n"
 * and contain zero UTF-8 BOM (0xEF, 0xBB, 0xBF) or leading whitespace.
 */
export function assertByteZeroFrontmatter(
    rawBuffer: Buffer | Uint8Array | string,
): void {
    const bytes =
        typeof rawBuffer === 'string'
            ? Buffer.from(rawBuffer, 'utf8')
            : Buffer.from(rawBuffer)

    if (
        bytes.length >= 3 &&
        bytes[0] === 0xef &&
        bytes[1] === 0xbb &&
        bytes[2] === 0xbf
    ) {
        throw new Error(
            `${LORE_SCHEMA_TAG} [FAIL] Byte-0 Violation :: UTF-8 BOM detected at byte 0. Dossiers must start with 0x2D 0x2D 0x2D.`,
        )
    }

    if (
        bytes.length < 4 ||
        bytes[0] !== 0x2d ||
        bytes[1] !== 0x2d ||
        bytes[2] !== 0x2d
    ) {
        throw new Error(
            `${LORE_SCHEMA_TAG} [FAIL] Byte-0 Violation :: YAML frontmatter must begin strictly at byte index 0 with '---'.`,
        )
    }

    const fourthByte = bytes[3]
    const isLf = fourthByte === 0x0a
    const isCrLf = fourthByte === 0x0d && bytes.length >= 5 && bytes[4] === 0x0a

    if (!isLf && !isCrLf) {
        throw new Error(
            `${LORE_SCHEMA_TAG} [FAIL] Byte-0 Violation :: Opening '---' must be immediately followed by LF (0x0A) or CRLF (0x0D 0x0A).`,
        )
    }
}

/**
 * Unicode NFC Canonical String Schema
 * Normalizes all input strings to Unicode Normalization Form C (NFC) prior to validation.
 */
export const NfcNonEmptyStringSchema = z
    .string()
    .min(1, `${LORE_SCHEMA_TAG} [FAIL] String cannot be empty`)
    .transform((val) => val.normalize('NFC'))

/**
 * Gillian Arithmetic Doctrine: Fixed-Point Integer Basis Points (0 to 10,000 bps)
 * Rejects floating-point numbers and out-of-range scalars at T0 = $0.00.
 */
export const BasisPointsSchema = z
    .number()
    .int(
        `${LORE_SCHEMA_TAG} [FAIL] Floating-point numbers are barred; use integer basis points (0..10000)`,
    )
    .min(0, `${LORE_SCHEMA_TAG} [FAIL] Basis points cannot be negative (< 0)`)
    .max(
        10000,
        `${LORE_SCHEMA_TAG} [FAIL] Basis points cannot exceed 10000 (100.00%)`,
    )

/**
 * Monotonic Version Integer Schema
 * Starts at 1 and increments strictly by +1 on every approved state mutation.
 */
export const MonotonicVersionSchema = z
    .number()
    .int(`${LORE_SCHEMA_TAG} [FAIL] Version must be an integer`)
    .min(1, `${LORE_SCHEMA_TAG} [FAIL] Monotonic version must be >= 1`)

/**
 * Narrative Logical Clock Epoch Schema
 * Replaces ambient wall-clock timestamps with deterministic non-negative integer epochs.
 */
export const LogicalEpochSchema = z
    .number()
    .int(`${LORE_SCHEMA_TAG} [FAIL] Logical epoch must be an integer`)
    .min(0, `${LORE_SCHEMA_TAG} [FAIL] Logical epoch must be >= 0`)
    .default(0)

/**
 * Authority Level Hierarchy (Monotonic Authority Principle)
 * Ordered from highest legislative sovereignty (AXIOM) to lowest untrusted output (SPECULATION).
 */
export const AuthorityLevelValues = [
    'AXIOM',
    'CANON',
    'EVENT',
    'RUNTIME_STATE',
    'PROJECTION',
    'SPECULATION',
] as const

export const AuthorityLevelSchema = z.enum(AuthorityLevelValues)
export type AuthorityLevel = z.infer<typeof AuthorityLevelSchema>

export const AUTHORITY_RANK: Readonly<Record<AuthorityLevel, number>> =
    Object.freeze({
        AXIOM: 6,
        CANON: 5,
        EVENT: 4,
        RUNTIME_STATE: 3,
        PROJECTION: 2,
        SPECULATION: 1,
    })

/**
 * Canonical Scope Partition
 */
export const FactScopeValues = [
    'CHARACTER',
    'LOCATION',
    'LOGISTIC',
    'LAW',
] as const
export const FactScopeSchema = z.enum(FactScopeValues)
export type FactScope = z.infer<typeof FactScopeSchema>

/**
 * Tri-State Epistemological Standing
 */
export const EpistemologicalStandingValues = [
    'ACTIVE_ENDORSED',
    'FLAGGED_FOR_REVIEW',
    'DEPRECATED_ARCHIVED',
] as const

export const EpistemologicalStandingSchema = z.enum(
    EpistemologicalStandingValues,
)
export type EpistemologicalStanding = z.infer<
    typeof EpistemologicalStandingSchema
>

/**
 * SHA-256 Digest Hex Contract (64 lowercase hex characters or sha256: prefixed)
 */
export const Sha256HashSchema = z
    .string()
    .regex(
        /^(sha256:)?[a-f0-9]{64}$/,
        `${LORE_SCHEMA_TAG} [FAIL] Invalid SHA-256 digest format`,
    )

/**
 * Three-Part Reproducibility Lock Contract
 * Pins canon_version, action_vocabulary_version, and schema_version.
 */
export const ThreePartLockSchema = z
    .object({
        canon_version: NfcNonEmptyStringSchema,
        action_vocabulary_version: NfcNonEmptyStringSchema,
        schema_version: NfcNonEmptyStringSchema,
    })
    .strict()

export type ThreePartLock = z.infer<typeof ThreePartLockSchema>

/**
 * Ontological Trust Graph Metadata Contract
 * Enforces mandatory early validation on 'approved_by' and 'canon_version'.
 */
export const TrustGraphMetadataSchema = z
    .object({
        created_by: NfcNonEmptyStringSchema,
        parent_artifact_ids: z.array(NfcNonEmptyStringSchema).default([]),
        approved_by: NfcNonEmptyStringSchema,
        canon_version: NfcNonEmptyStringSchema,
        producer_software_version: NfcNonEmptyStringSchema,
        is_mutable: z.boolean().default(false),
        can_become_authoritative: z.boolean().default(false),
        revocation_policy: z
            .enum(['APPEND_ONLY_ERRATA', 'RETIRE_CLI', 'IMMUTABLE_AXIOM'])
            .default('APPEND_ONLY_ERRATA'),
    })
    .strict()

export type TrustGraphMetadata = z.infer<typeof TrustGraphMetadataSchema>

/**
 * Atomic Canonical Fact Node Schema
 */
export const FactNodeSchema = z
    .object({
        id: z
            .string()
            .regex(
                /^[a-z0-9_.-]+$/,
                `${LORE_SCHEMA_TAG} [FAIL] Fact ID must contain only lowercase alphanumeric, '_', '.', or '-'`,
            ),
        claim_text: NfcNonEmptyStringSchema,
        scope: FactScopeSchema,
        authority_level: AuthorityLevelSchema.default('CANON'),
        standing: EpistemologicalStandingSchema.default('ACTIVE_ENDORSED'),
        author: NfcNonEmptyStringSchema,
        version: MonotonicVersionSchema.default(1),
        content_hash: Sha256HashSchema,
        severity_bps: BasisPointsSchema.default(0),
        confidence_bps: BasisPointsSchema.default(10000),
        created_at_epoch: LogicalEpochSchema,
        last_edited_at_epoch: LogicalEpochSchema,
        last_reconsidered_at_epoch: LogicalEpochSchema,
        trust_graph: TrustGraphMetadataSchema.optional(),
    })
    .strict()
    .superRefine((fact, ctx) => {
        if (fact.last_edited_at_epoch < fact.created_at_epoch) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `${LORE_SCHEMA_TAG} [FAIL] Temporal regression :: last_edited_at_epoch (${fact.last_edited_at_epoch}) < created_at_epoch (${fact.created_at_epoch})`,
                path: ['last_edited_at_epoch'],
            })
        }
    })

export type FactNode = z.infer<typeof FactNodeSchema>

/**
 * Enforces the Monotonic Fact Incrementation Invariant and Authority Boundary across commits.
 * 1. Downward projections (PROJECTION, SPECULATION) cannot mutate CANON or AXIOM facts.
 * 2. When claim_text, scope, or content_hash mutates, NEW.version must strictly equal OLD.version + 1.
 * 3. Transitioning standing to FLAGGED_FOR_REVIEW ("Still Good" upward scrutiny) updates
 *    review metadata without bumping version or triggering downstream invalidation cascades.
 */
export function verifyMonotonicFactTransition(
    oldFact: FactNode,
    newFact: FactNode,
    actorAuthority: AuthorityLevel = 'CANON',
): { versionIncremented: boolean; requiresCascade: boolean } {
    if (oldFact.id !== newFact.id) {
        throw new Error(
            `${LORE_SCHEMA_TAG} [FAIL] Identity Mismatch :: Cannot transition between distinct fact IDs (${oldFact.id} != ${newFact.id}).`,
        )
    }

    // Enforce Monotonic Authority Principle
    if (
        AUTHORITY_RANK[actorAuthority] <
            AUTHORITY_RANK[oldFact.authority_level] ||
        actorAuthority === 'PROJECTION' ||
        actorAuthority === 'SPECULATION'
    ) {
        throw new Error(
            `${LORE_SCHEMA_TAG} [FAIL] Authority Boundary Breach :: Actor with authority '${actorAuthority}' cannot mutate fact governed by '${oldFact.authority_level}'.`,
        )
    }

    const contentMutated =
        oldFact.claim_text !== newFact.claim_text ||
        oldFact.scope !== newFact.scope ||
        oldFact.content_hash !== newFact.content_hash ||
        oldFact.severity_bps !== newFact.severity_bps

    const standingDeprecated =
        oldFact.standing !== 'DEPRECATED_ARCHIVED' &&
        newFact.standing === 'DEPRECATED_ARCHIVED'

    if (contentMutated) {
        if (newFact.version !== oldFact.version + 1) {
            throw new Error(
                `${LORE_SCHEMA_TAG} [FAIL] Monotonic Version Violation :: Fact '${oldFact.id}' mutated content, so version must increment from ${oldFact.version} to ${oldFact.version + 1} (received ${newFact.version}).`,
            )
        }
        return { versionIncremented: true, requiresCascade: true }
    }

    // "Still Good" / FLAGGED_FOR_REVIEW upward scrutiny path: zero version bump, zero cascade
    if (newFact.version < oldFact.version) {
        throw new Error(
            `${LORE_SCHEMA_TAG} [FAIL] Monotonic Regression :: Fact '${oldFact.id}' version regressed from ${oldFact.version} to ${newFact.version}.`,
        )
    }

    return {
        versionIncremented: newFact.version > oldFact.version,
        requiresCascade:
            newFact.version > oldFact.version || standingDeprecated,
    }
}
