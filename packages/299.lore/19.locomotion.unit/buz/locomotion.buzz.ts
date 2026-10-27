import { LocomotionModel } from '../locomotion.model.js'
import LocomotionBit from '../fce/locomotion.bit.js'
import State from '../../99.core/state.js'
import {
    SomaticVector,
    SomaticVectorSchema,
    LocomotionTier,
} from '../../02.character.unit/fce/somatic.schema.js'
import {
    KineticVerb,
    VERB_FAMILIES,
} from '../../39.verbs.unit/fce/verbs.schema.js'

export interface SomaticMask {
    effectiveArms: number
    effectiveLegs: number
    derivedLocomotionTier: LocomotionTier
    compiledBannedVerbs: KineticVerb[]
    somaticStrainBp: number
    characterId?: string
}

export function deriveSomaticMask(vector: SomaticVector): SomaticMask {
    const parsed = SomaticVectorSchema.parse(vector)

    let totalArmPenalty = 0
    let totalLegPenalty = 0
    const conditionBannedVerbs: KineticVerb[] = []

    for (const cond of parsed.conditions) {
        totalArmPenalty += cond.impairment_penalty_arms ?? 0
        totalLegPenalty += cond.impairment_penalty_legs ?? 0
        if (cond.added_banned_verbs) {
            conditionBannedVerbs.push(...cond.added_banned_verbs)
        }
    }

    const effectiveArms = Math.max(0, parsed.arms_available - totalArmPenalty)
    const effectiveLegs = Math.max(0, parsed.legs_available - totalLegPenalty)

    let derivedLocomotionTier: LocomotionTier = parsed.locomotion_tier
    if (effectiveLegs === 0) {
        if (effectiveArms > 0) {
            derivedLocomotionTier = 'CRAWLWAY_SLITHER'
        } else {
            derivedLocomotionTier = 'IMMOBILE'
        }
    } else if (effectiveLegs === 1) {
        if (
            derivedLocomotionTier === 'BIPEDAL_NIMBLE' ||
            derivedLocomotionTier === 'QUADRUPEDAL_SCUTTLE'
        ) {
            derivedLocomotionTier = 'BIPEDAL_LIMPING'
        }
    }

    const bannedSet = new Set<KineticVerb>([
        ...parsed.banned_verbs,
        ...conditionBannedVerbs,
    ])

    if (effectiveArms < 2) {
        for (const verb of VERB_FAMILIES.BIMANUAL) {
            bannedSet.add(verb)
        }
    }

    if (effectiveLegs === 1 || derivedLocomotionTier === 'BIPEDAL_LIMPING') {
        for (const verb of ['SPRINT', 'VAULT', 'LEAP'] as const) {
            bannedSet.add(verb)
        }
    }

    if (effectiveLegs === 0 || derivedLocomotionTier === 'CRAWLWAY_SLITHER') {
        for (const verb of ['SCUTTLE', 'SPRINT', 'VAULT', 'LEAP'] as const) {
            bannedSet.add(verb)
        }
    }

    if (derivedLocomotionTier === 'IMMOBILE') {
        for (const verb of [
            'SCUTTLE',
            'SPRINT',
            'VAULT',
            'LEAP',
            'CRAWL',
            'SLITHER',
            'LIMP',
        ] as const) {
            bannedSet.add(verb)
        }
    }

    return {
        effectiveArms,
        effectiveLegs,
        derivedLocomotionTier,
        compiledBannedVerbs: Array.from(bannedSet),
        somaticStrainBp: parsed.somatic_strain_bp,
        characterId: parsed.character_id,
    }
}

export function evaluateMotorActionsFeasibility(
    mask: SomaticMask,
    candidateActions: (KineticVerb | string)[],
): { valid: boolean; forbiddenActions: string[] } {
    const bannedSet = new Set<string>(mask.compiledBannedVerbs)
    const forbiddenActions = candidateActions.filter((action) =>
        bannedSet.has(action),
    )
    return {
        valid: forbiddenActions.length === 0,
        forbiddenActions,
    }
}

export const initLocomotion = (
    cpy: LocomotionModel,
    bal: LocomotionBit,
    ste: State,
) => {
    debugger
    return cpy
}

export const updateLocomotion = (
    cpy: LocomotionModel,
    bal: LocomotionBit,
    ste: State,
) => {
    return cpy
}
