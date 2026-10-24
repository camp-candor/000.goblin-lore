import { EntityModel } from '../entity.model'
import EntityBit, {
    SomaticSATCandidateBit,
    SomaticSATReceiptBit,
} from '../fce/entity.bit'
import State from '../../99.core/state'
import { computeFunctionalLimbsBuzz } from '../../37.trauma.unit/buz/trauma.buzz'
import { calculateHandLoadBuzz } from '../../04.logistic.unit/buz/logistic.buzz'
import { validateLocomotionBaselineBuzz } from '../../19.locomotion.unit/buz/locomotion.buzz'
import { enforceBannedKineticVerbsBuzz } from '../../39.verbs.unit/buz/verbs.buzz'

export const initEntity = (cpy: EntityModel, bal: EntityBit, ste: State) => {
    return cpy
}

export const updateEntity = (cpy: EntityModel, bal: EntityBit, ste: State) => {
    return cpy
}

/**
 * Pure in-memory SAT solver verifying physical capability invariants at Stage T_0.
 */
export function evaluateSomaticSATBuzz(
    candidate: SomaticSATCandidateBit,
): SomaticSATReceiptBit {
    const limbResult = computeFunctionalLimbsBuzz(
        candidate.base_arms_bp,
        candidate.somatic_conditions,
    )

    const loadResult = calculateHandLoadBuzz(candidate.equipped_items)

    const locomotionResult = validateLocomotionBaselineBuzz(
        candidate.locomotion_baseline,
    )

    if (!locomotionResult.success) {
        return {
            success: false,
            entity_id: candidate.entity_id,
            code: 'INVALID_LOCOMOTION',
            available_arms_bp: limbResult.available_arms_bp,
            required_hands_bp: loadResult.required_hands_bp,
            max_velocity_bp: 0,
            consolidated_banned_verbs: [],
            message: locomotionResult.message,
        }
    }

    const consolidatedVerbs = enforceBannedKineticVerbsBuzz(
        candidate.manual_banned_verbs ?? [],
        locomotionResult.profile.mandatory_banned_verbs,
        candidate.somatic_conditions,
    )

    if (loadResult.required_hands_bp > limbResult.available_arms_bp) {
        return {
            success: false,
            entity_id: candidate.entity_id,
            code: 'LIMB_CAPACITY_EXCEEDED',
            available_arms_bp: limbResult.available_arms_bp,
            required_hands_bp: loadResult.required_hands_bp,
            max_velocity_bp: locomotionResult.profile.max_velocity_bp,
            consolidated_banned_verbs: consolidatedVerbs,
            message: `[FAIL] :: Limb capacity exceeded: Required ${loadResult.required_hands_bp} bp > Available ${limbResult.available_arms_bp} bp`,
        }
    }

    return {
        success: true,
        entity_id: candidate.entity_id,
        code: 'OK',
        available_arms_bp: limbResult.available_arms_bp,
        required_hands_bp: loadResult.required_hands_bp,
        max_velocity_bp: locomotionResult.profile.max_velocity_bp,
        consolidated_banned_verbs: consolidatedVerbs,
        message: `[OK] :: Somatic SAT verified for ${candidate.entity_id} (Arms: ${limbResult.available_arms_bp} bp, Load: ${loadResult.required_hands_bp} bp)`,
    }
}
