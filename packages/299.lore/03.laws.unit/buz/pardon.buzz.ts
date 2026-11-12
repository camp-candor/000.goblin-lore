import type { Rule, Authorizer } from '../fce/rule.schema.js'
import type { PardonRecord } from '../fce/pardon.schema.js'
import type { PardonValidationResult } from '../fce/pardonValidation.bit.js'
import type { LawsModel } from '../laws.model.js'
import type PardonEvaluatorBit from '../fce/pardonValidation.bit.js'
import type State from '../../99.core/state.js'

export function validatePass2Pardons(
    pardons: Map<string, PardonRecord> | Record<string, PardonRecord>,
    rules: Map<string, Rule>,
    authorizers: Map<string, Authorizer>,
    entities: {
        characters?: Record<string, any>
        locations?: Record<string, any>
        possessions?: Record<string, any>
        grievances?: Record<string, any>
    },
    currentCanonHash: string,
    strictFrequencyAudit: boolean = false,
): PardonValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    const appliedPardons: PardonRecord[] = []
    const usageCounts = new Map<string, number>()

    const pardonList: PardonRecord[] =
        pardons instanceof Map
            ? Array.from(pardons.values())
            : Object.values(pardons)

    for (const pardon of pardonList) {
        const pardonId = pardon.pardon_id

        // 1. Foreign-Key Existence of Target Entity
        const targetEntityId = pardon.target.entity_id
        const charExists =
            entities.characters && entities.characters[targetEntityId]
        const locExists =
            entities.locations && entities.locations[targetEntityId]
        const itemExists =
            entities.possessions && entities.possessions[targetEntityId]
        const grvExists =
            entities.grievances && entities.grievances[targetEntityId]

        if (!charExists && !locExists && !itemExists && !grvExists) {
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
                `[PASS 2 PARDON FATAL] Illegal waiver attempted! Rule '${rule.id}' carries category '${rule.category}' ` +
                    `and is marked pardonable: false. Hard physical, somatic, and epistemic laws cannot be bypassed via pardons.`,
            )
        }

        // 4. Authorizer Existence and Category Scope Permissions
        const authorizer = authorizers.get(pardon.authorizer_id)
        if (!authorizer) {
            errors.push(
                `[PASS 2 PARDON ERROR] Unknown authorizer '${pardon.authorizer_id}' on pardon '${pardonId}'.`,
            )
        } else if (!authorizer.permitted_categories.includes(rule.category)) {
            errors.push(
                `[PASS 2 PARDON PERMISSION DENIED] Authorizer '${authorizer.name}' (${authorizer.role}) ` +
                    `is not permitted to waive rules of category '${rule.category}'.`,
            )
        }

        // 5. Stale Canon Hash Guard
        if (pardon.granted_against_canon_hash !== currentCanonHash) {
            warnings.push(
                `>> [PARDON WARNING] Pardon '${pardonId}' was granted against canon hash ` +
                    `'${pardon.granted_against_canon_hash.slice(0, 8)}...', but current hash is ` +
                    `'${currentCanonHash.slice(0, 8)}...'. Re-ratification recommended.`,
            )
        }

        usageCounts.set(
            pardon.rule_id,
            (usageCounts.get(pardon.rule_id) || 0) + 1,
        )
        appliedPardons.push(pardon)
    }

    // 6. Active Pardon Frequency Auditing
    for (const [ruleId, count] of usageCounts.entries()) {
        const rule = rules.get(ruleId)
        const limit = rule ? rule.max_tolerated_pardon_frequency_bps : 0
        if (rule && limit > 0 && count > limit) {
            const freqMsg =
                `[PASS 2 PARDON FREQUENCY BREACH] Rule '${ruleId}' permits at most ` +
                `${limit} active waivers, but ${count} are registered.`
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
        appliedPardons,
    }
}

export const evaluatePardonWaivers = (
    cpy: LawsModel,
    bal: PardonEvaluatorBit,
    ste?: State,
): LawsModel => {
    const dat = bal?.dat
    if (!dat) {
        if (bal?.slv) {
            bal.slv({
                lawBit: {
                    idx: 'evaluate-pardon-waivers-err',
                    val: -1,
                    dat: {
                        valid: false,
                        errors: ['[MISSING_PAYLOAD] dat is required'],
                        warnings: [],
                        appliedPardons: [],
                    },
                },
            })
        }
        return cpy
    }

    let entities = {}
    if (ste && ste.value && ste.value.lore && ste.value.lore.entities) {
        entities = ste.value.lore.entities
    }

    const result = validatePass2Pardons(
        dat.pardons,
        cpy.rules,
        cpy.authorizers,
        entities,
        dat.currentCanonHash,
        dat.strictFrequencyAudit ?? false,
    )

    if (bal?.slv) {
        bal.slv({
            lawBit: {
                idx: 'evaluate-pardon-waivers',
                val: result.valid ? 0 : -1,
                dat: result,
            },
        })
    }
    return cpy
}
