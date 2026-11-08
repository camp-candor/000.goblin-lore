import type { Rule, Authorizer } from '../fce/rule.schema.js'
import type { PardonRecord } from '../fce/pardon.schema.js'

export interface PardonValidationResult {
    valid: boolean
    errors: string[]
    warnings: string[]
}

export function validatePass2Pardons(
    pardons: Map<string, PardonRecord>,
    rules: Map<string, Rule>,
    authorizers: Map<string, Authorizer>,
    entities: {
        characters: Record<string, any>
        locations?: Record<string, any>
        possessions?: Record<string, any>
        grievances?: Record<string, any>
    },
    currentCanonHash: string,
    strictFrequencyAudit: boolean = false,
): PardonValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    const usageCounts = new Map<string, number>()

    for (const [pardonId, pardon] of pardons.entries()) {
        // 1. Foreign-Key Existence of Target Entity
        const targetEntityId = pardon.target.entity_id
        const charExists =
            entities.characters && entities.characters[targetEntityId]
        if (!charExists) {
            errors.push(
                `[PASS 2 PARDON ERROR] Pardon '${pardonId}' references non-existent target entity: '${targetEntityId}'`,
            )
        }

        // 2. Foreign-Key Existence of Rule ID
        const rule = rules.get(pardon.rule_id)
        if (!rule) {
            errors.push(
                `[PASS 2 PARDON ERROR] Pardon '${pardonId}' references unknown rule_id: '${pardon.rule_id}'`,
            )
            continue
        }

        // 3. Relational Authority Enforcement: Check Rule Pardonability
        if (rule.pardonable !== true) {
            errors.push(
                `[PASS 2 PARDON FATAL] Illegal waiver attempted! Rule '${rule.id}' has severity '${rule.severity_class}' ` +
                    `and is marked 'pardonable: false'. Hard physical, somatic, and epistemic laws cannot be bypassed via pardons.`,
            )
        }

        // 4. Authorizer Existence and Authority Scope
        const authorizer = authorizers.get(pardon.authorizer_id)
        if (!authorizer) {
            errors.push(
                `[PASS 2 PARDON ERROR] Unknown authorizer '${pardon.authorizer_id}' on pardon '${pardonId}'.`,
            )
        } else if (
            !authorizer.permitted_severity_classes.includes(rule.severity_class)
        ) {
            errors.push(
                `[PASS 2 PARDON PERMISSION DENIED] Authorizer '${authorizer.name}' (${authorizer.role}) ` +
                    `is not permitted to waive rules of severity '${rule.severity_class}'.`,
            )
        }

        // 5. Stale Canon Hash Guard
        if (pardon.granted_against_canon_hash !== currentCanonHash) {
            warnings.push(
                `>> [PARDON WARNING] Pardon '${pardonId}' granted against canon hash ` +
                    `'${pardon.granted_against_canon_hash.slice(0, 8)}...', but current hash is ` +
                    `'${currentCanonHash.slice(0, 8)}...'. Re-ratification recommended.`,
            )
        }

        usageCounts.set(
            pardon.rule_id,
            (usageCounts.get(pardon.rule_id) || 0) + 1,
        )
    }

    // 6. Active Pardon Frequency Auditing
    for (const [ruleId, count] of usageCounts.entries()) {
        const rule = rules.get(ruleId)
        if (
            rule &&
            rule.max_tolerated_pardon_frequency > 0 &&
            count > rule.max_tolerated_pardon_frequency
        ) {
            const freqMsg =
                `[PASS 2 PARDON FREQUENCY BREACH] Rule '${ruleId}' permits at most ` +
                `${rule.max_tolerated_pardon_frequency} active waivers, but ${count} are registered.`
            if (strictFrequencyAudit) {
                errors.push(freqMsg)
            } else {
                warnings.push(`>> [PARDON FREQUENCY ALERT] ${freqMsg}`)
            }
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
    }
}
