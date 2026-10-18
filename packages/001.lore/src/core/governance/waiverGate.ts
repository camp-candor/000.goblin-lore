import * as crypto from 'node:crypto'
import {
    Rule,
    Authorizer,
    PardonRecord,
    InjectedStateMutation,
} from '../../../schemas/pardon.schema.js'
import { LocalPardonLedger } from '../../db/localPardonLedger.js'

export interface InterceptionTarget {
    seriesId: string
    episodeId: string
    sceneId: string
    shotId?: string
    entityId: string
}

export interface InterceptionContext {
    ruleId: string
    target: InterceptionTarget
    entityPayload: unknown
    currentCanonRoot: string
    violationMessage: string
}

export type InterceptionStatus =
    | 'FATAL_UNPARDONABLE_BREACH'
    | 'UNPARDONED_VIOLATION'
    | 'STALE_ENTITY_PARDON'
    | 'UNAUTHORIZED_SIGNER'
    | 'FREQUENCY_EXCEEDED'
    | 'COMPLIANT_BY_EXEMPTION'

export interface WaiverInterceptionResult {
    status: InterceptionStatus
    isExempt: boolean
    ruleId: string
    targetEntityId: string
    appliedPardon?: PardonRecord
    injectedStateMutation?: InjectedStateMutation
    message: string
}

export const HARD_UNPARDONABLE_RULES: ReadonlySet<string> = new Set([
    'rule_kinetic_limb_conservation',
    'rule_bimanual_coordination',
    'rule_unresolved_epistemic_leak',
    'SOMATIC_SAT_BREACH',
    'MASS_CONSERVATION_BREACH',
    'VOCAL_FEASIBILITY_BREACH',
    'SPATIAL_CO_PRESENCE_VIOLATION',
])

export function computeEntityHash(payload: unknown): string {
    const canonicalString = JSON.stringify(payload).normalize('NFC')
    return crypto.createHash('sha256').update(canonicalString).digest('hex')
}

export class WaiverGate {
    constructor(
        private ledger: LocalPardonLedger,
        private rules: Map<string, Rule>,
        private authorizers: Map<string, Authorizer>,
    ) {}

    /**
     * Evaluates a detected violation against Gate 1 (Hard Shield) and Gate 2 (Waiver Verification)
     */
    public evaluate(context: InterceptionContext): WaiverInterceptionResult {
        const {
            ruleId,
            target,
            entityPayload,
            currentCanonRoot,
            violationMessage,
        } = context

        // -------------------------------------------------------------------------
        // GATE 1: Hard Invariant Shield (Fail-Closed Physical & Epistemic Boundary)
        // -------------------------------------------------------------------------
        if (HARD_UNPARDONABLE_RULES.has(ruleId)) {
            return {
                status: 'FATAL_UNPARDONABLE_BREACH',
                isExempt: false,
                ruleId,
                targetEntityId: target.entityId,
                message: `>> [SHIELD:HALT] FATAL_UNPARDONABLE_PHYSICAL_BREACH: Rule '${ruleId}' is an absolute invariant. Waivers are structurally barred. ${violationMessage}`,
            }
        }

        const rule = this.rules.get(ruleId)
        if (!rule) {
            return {
                status: 'FATAL_UNPARDONABLE_BREACH',
                isExempt: false,
                ruleId,
                targetEntityId: target.entityId,
                message: `>> [SHIELD:HALT] UNKNOWN_RULE: Rule '${ruleId}' is not registered in canonical ontology.`,
            }
        }

        if (
            !rule.pardonable ||
            rule.severity_class === 'PHYSICAL_SOMATIC' ||
            rule.severity_class === 'EPISTEMIC'
        ) {
            return {
                status: 'FATAL_UNPARDONABLE_BREACH',
                isExempt: false,
                ruleId,
                targetEntityId: target.entityId,
                message: `>> [SHIELD:HALT] FATAL_UNPARDONABLE_PHYSICAL_BREACH: Rule '${ruleId}' (severity: ${rule.severity_class}) is strictly non-pardonable. ${violationMessage}`,
            }
        }

        // -------------------------------------------------------------------------
        // GATE 2: Cryptographic Waiver Gate (Local SQLite Verification)
        // -------------------------------------------------------------------------
        const activePardons = this.ledger.getPardonsForScene(
            target.seriesId,
            target.episodeId,
            target.sceneId,
        )

        const matchingPardon = activePardons.find(
            (p) =>
                p.rule_id === ruleId && p.target.entity_id === target.entityId,
        )

        if (!matchingPardon) {
            return {
                status: 'UNPARDONED_VIOLATION',
                isExempt: false,
                ruleId,
                targetEntityId: target.entityId,
                message: `>> [WAIVER:MISSING] No active pardon registered in local SQLite for entity '${target.entityId}' on rule '${ruleId}'. ${violationMessage}`,
            }
        }

        // 1. Authorizer Role Permission Check
        const authorizer = this.authorizers.get(matchingPardon.authorizer_id)
        if (!authorizer) {
            return {
                status: 'UNAUTHORIZED_SIGNER',
                isExempt: false,
                ruleId,
                targetEntityId: target.entityId,
                appliedPardon: matchingPardon,
                message: `>> [WAIVER:REJECT] Authorizer '${matchingPardon.authorizer_id}' is not recognized in canonical registry.`,
            }
        }

        if (
            !authorizer.permitted_severity_classes.includes(rule.severity_class)
        ) {
            return {
                status: 'UNAUTHORIZED_SIGNER',
                isExempt: false,
                ruleId,
                targetEntityId: target.entityId,
                appliedPardon: matchingPardon,
                message: `>> [WAIVER:REJECT] Authorizer '${authorizer.name}' (${authorizer.role}) lacks permission for severity class '${rule.severity_class}'.`,
            }
        }

        // 2. Cryptographic Entity State Hash Verification (Tamper Guard)
        const currentEntityHash = computeEntityHash(entityPayload)
        if (matchingPardon.granted_against_entity_hash !== currentEntityHash) {
            return {
                status: 'STALE_ENTITY_PARDON',
                isExempt: false,
                ruleId,
                targetEntityId: target.entityId,
                appliedPardon: matchingPardon,
                message: `>> [WAIVER:STALE] STALE_ENTITY_PARDON: Target entity '${target.entityId}' state hash drifted from '${matchingPardon.granted_against_entity_hash.slice(0, 8)}...' to '${currentEntityHash.slice(0, 8)}...'. Re-ratification required.`,
            }
        }

        // 3. Rule Usage Frequency Check
        const usageCount = this.ledger.countWaiversByRule(ruleId)
        if (usageCount > rule.max_tolerated_pardon_frequency) {
            return {
                status: 'FREQUENCY_EXCEEDED',
                isExempt: false,
                ruleId,
                targetEntityId: target.entityId,
                appliedPardon: matchingPardon,
                message: `>> [WAIVER:REJECT] PARDON_FREQUENCY_EXCEEDED: Rule '${ruleId}' has ${usageCount} active waivers, exceeding limit of ${rule.max_tolerated_pardon_frequency}.`,
            }
        }

        // 4. Exemption Approved
        return {
            status: 'COMPLIANT_BY_EXEMPTION',
            isExempt: true,
            ruleId,
            targetEntityId: target.entityId,
            appliedPardon: matchingPardon,
            injectedStateMutation: matchingPardon.injected_state_mutation,
            message: `>> [WAIVER:EXEMPT] COMPLIANT_BY_EXEMPTION: Entity '${target.entityId}' granted exemption for rule '${ruleId}' by '${authorizer.name}'.`,
        }
    }
}
