// packages/001.lore/schemas/dependencies.schema.ts
import { z } from 'zod'
import {
    FactNode,
    LogicalEpochSchema,
    MonotonicVersionSchema,
    NfcNonEmptyStringSchema,
    Sha256HashSchema,
} from './schemas'

export const DEP_SCHEMA_TAG = '[LORE::PINNED_EDGE]' as const

/**
 * Dependent Entity Type Classification
 */
export const DependentEntityTypeValues = [
    'character',
    'location',
    'possession',
    'grievance',
    'axiom',
] as const

export const DependentEntityTypeSchema = z.enum(DependentEntityTypeValues)
export type DependentEntityType = z.infer<typeof DependentEntityTypeSchema>

/**
 * Version-Pinned Dependency Edge Schema
 * Rejects unpinned edges (edges that declare fact_id without pinned_version).
 */
export const DependencyEdgeSchema = z
    .object({
        fact_id: z
            .string()
            .regex(
                /^[a-z0-9_.-]+$/,
                `${DEP_SCHEMA_TAG} [FAIL] fact_id must be a valid lowercase identifier`,
            ),
        entity_type: DependentEntityTypeSchema.default('character'),
        pinned_version: MonotonicVersionSchema,
        pinned_hash: Sha256HashSchema.optional(),
        is_dirty: z.boolean().default(false),
        invalidation_reason: z.string().optional(),
    })
    .strict()

export type DependencyEdge = z.infer<typeof DependencyEdgeSchema>

/**
 * Scene Lifecycle Status Enumeration
 */
export const SceneLifecycleStatusValues = [
    'DRAFT',
    'CLEAN',
    'DIRTY',
    'PENDING_REVALIDATION',
    'REVIEWED',
    'REVIEWED_NO_CHANGE',
] as const

export const SceneLifecycleStatusSchema = z.enum(SceneLifecycleStatusValues)
export type SceneLifecycleStatus = z.infer<typeof SceneLifecycleStatusSchema>

/**
 * Scene Node & Point-of-Composition Completion Fence Schema
 * A scene node cannot transition from DRAFT to CLEAN/REVIEWED without either:
 * 1. Declaring at least one valid version-pinned edge in depends_on, OR
 * 2. Explicitly setting asserts_zero_dependencies: true.
 * Additionally, duplicate fact_id entries within depends_on are rejected.
 */
export const SceneDependencyContractSchema = z
    .object({
        id: z
            .string()
            .regex(
                /^[a-z0-9_.-]+$/,
                `${DEP_SCHEMA_TAG} [FAIL] Scene ID must be a valid identifier`,
            ),
        episode_num: z.number().int().min(1),
        scene_num: z.number().int().min(1),
        prose_text: NfcNonEmptyStringSchema,
        status: SceneLifecycleStatusSchema.default('DRAFT'),
        is_dirty: z.boolean().default(false),
        dirty_reason: z.string().nullable().default(null),
        asserts_zero_dependencies: z.boolean().default(false),
        depends_on: z.array(DependencyEdgeSchema).default([]),
        owner_id: NfcNonEmptyStringSchema,
        updated_at_epoch: LogicalEpochSchema,
    })
    .strict()
    .superRefine((scene, ctx) => {
        // 1. Check for duplicate fact_ids in depends_on
        const seenFacts = new Set<string>()
        for (let i = 0; i < scene.depends_on.length; i++) {
            const edge = scene.depends_on[i]
            if (seenFacts.has(edge.fact_id)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `${DEP_SCHEMA_TAG} [FAIL] Duplicate dependency edge declared for fact_id '${edge.fact_id}'`,
                    path: ['depends_on', i, 'fact_id'],
                })
            }
            seenFacts.add(edge.fact_id)
        }

        // 2. Contradictory zero-dependency assertion vs populated depends_on
        if (scene.asserts_zero_dependencies && scene.depends_on.length > 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `${DEP_SCHEMA_TAG} [FAIL] Scene '${scene.id}' sets asserts_zero_dependencies=true but declares ${scene.depends_on.length} dependency edges`,
                path: ['asserts_zero_dependencies'],
            })
        }

        // 3. Point-of-Composition Completion Fence (Write-Time Friction Gate)
        const isLockedCleanStatus =
            scene.status === 'CLEAN' ||
            scene.status === 'REVIEWED' ||
            scene.status === 'REVIEWED_NO_CHANGE'

        if (
            isLockedCleanStatus &&
            scene.depends_on.length === 0 &&
            !scene.asserts_zero_dependencies
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `${DEP_SCHEMA_TAG} [FAIL] Write-Time Friction Gate :: Scene '${scene.id}' cannot transition to '${scene.status}' without declaring depends_on edges or explicitly setting asserts_zero_dependencies=true`,
                path: ['depends_on'],
            })
        }

        // 4. Dirty consistency check
        if (scene.status === 'DIRTY' && !scene.is_dirty) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `${DEP_SCHEMA_TAG} [FAIL] Status Consistency Violation :: Scene '${scene.id}' has status='DIRTY' but is_dirty=false`,
                path: ['is_dirty'],
            })
        }

        if (isLockedCleanStatus && scene.is_dirty) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `${DEP_SCHEMA_TAG} [FAIL] Status Consistency Violation :: Scene '${scene.id}' cannot have status='${scene.status}' while is_dirty=true`,
                path: ['is_dirty'],
            })
        }
    })

export type SceneDependencyContract = z.infer<
    typeof SceneDependencyContractSchema
>

/**
 * Deterministic Staleness Predicate Evaluator
 * Evaluates: Exists d in Scene.depends_on | d.pinned_version < Fact.version OR Fact.standing == 'DEPRECATED_ARCHIVED'
 */
export interface StalenessEvaluationResult {
    scene_id: string
    is_dirty: boolean
    status: SceneLifecycleStatus
    dirty_reason: string | null
    updated_edges: DependencyEdge[]
}

export function evaluateSceneStaleness(
    scene: SceneDependencyContract,
    activeFactsMap: ReadonlyMap<string, FactNode>,
): StalenessEvaluationResult {
    const reasons: string[] = []
    const updatedEdges: DependencyEdge[] = []

    for (const edge of scene.depends_on) {
        const activeFact = activeFactsMap.get(edge.fact_id)
        if (!activeFact) {
            const reason = `Dangling Fact Reference: [${edge.fact_id}] is missing from active facts ledger`
            reasons.push(reason)
            updatedEdges.push({
                ...edge,
                is_dirty: true,
                invalidation_reason: reason,
            })
            continue
        }

        if (activeFact.standing === 'DEPRECATED_ARCHIVED') {
            const reason = `Fact [${activeFact.id}] retired to DEPRECATED_ARCHIVED`
            reasons.push(reason)
            updatedEdges.push({
                ...edge,
                is_dirty: true,
                invalidation_reason: reason,
            })
            continue
        }

        // Note: FLAGGED_FOR_REVIEW intentionally triggers ZERO dirty cascade (Zero-Cascade Liminal Guarantee)
        if (edge.pinned_version < activeFact.version) {
            const reason = `Fact [${activeFact.id}] mutated v${edge.pinned_version}->v${activeFact.version}: ${activeFact.claim_text}`
            reasons.push(reason)
            updatedEdges.push({
                ...edge,
                is_dirty: true,
                invalidation_reason: reason,
            })
            continue
        }

        updatedEdges.push({
            ...edge,
            is_dirty: false,
            invalidation_reason: undefined,
        })
    }

    const isDirty = reasons.length > 0
    return {
        scene_id: scene.id,
        is_dirty: isDirty,
        status: isDirty ? 'DIRTY' : scene.status,
        dirty_reason: isDirty ? reasons.join(' | ') : null,
        updated_edges: updatedEdges,
    }
}
