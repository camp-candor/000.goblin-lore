import {
    VERB_FAMILIES,
    CONDITION_VERB_ROLLUP,
    type CompiledSomaticMask,
    type KineticAuditReceipt,
    type LocomotionTier,
} from '../val/verbs.val'
import type { VerbsModel } from '../verbs.model'
import type VerbsBit from '../fce/verbs.bit'
import type { CompileMaskPayload, AuditQueryPayload } from '../fce/verbs.bit'
import type State from '../../99.core/state'

/**
 * Pure compiler that rolls up biological conditions, anatomical limb ceilings,
 * and locomotion tiers into an immutable, sorted negative motor mask.
 */
export function compileSomaticMask(
    entityId: string,
    conditions: string[] = [],
    availableArmsBps: number = 20000,
    legsAvailable: number = 2,
    locomotionTier: LocomotionTier = 'UNRESTRICTED',
    explicitBannedVerbs: string[] = [],
): CompiledSomaticMask {
    const bannedSet = new Set<string>()
    const activeConditions = new Set<string>()

    // 1. Explicitly supplied negative motor exclusions
    for (const verb of explicitBannedVerbs) {
        bannedSet.add(verb.trim().toUpperCase())
    }

    // 2. Feature roll-up from active conditions
    for (const cond of conditions) {
        const normalizedCond = cond.trim().toUpperCase()
        activeConditions.add(normalizedCond)
        const rollup = CONDITION_VERB_ROLLUP[normalizedCond]
        if (rollup) {
            for (const verb of rollup) {
                bannedSet.add(verb.toUpperCase())
            }
        }
    }

    // 3. Anatomical limb saturation ceilings
    // 10000 bps = 1.0 functional arm; 20000 bps = 2.0 functional arms
    if (availableArmsBps < 20000) {
        for (const v of VERB_FAMILIES.BIMANUAL_GRIP) {
            bannedSet.add(v)
        }
    }
    if (availableArmsBps === 0) {
        for (const v of VERB_FAMILIES.MANIPULATION_FINE) {
            bannedSet.add(v)
        }
        bannedSet.add('GRASP')
        bannedSet.add('HOLD')
        bannedSet.add('CARRY_HAND')
    }

    // 4. Locomotion tier gait restrictions
    if (legsAvailable < 2 || locomotionTier === 'LIMPING') {
        const limpingRapidBans = [
            'SPRINT',
            'RUN',
            'DASH',
            'BOLT',
            'VAULT',
            'GALLOP',
            'FLEE',
            'BOUND',
            'CHARGE',
            'LEAP',
            'LUNGE',
            'SCURRY',
            'RAPID_STAIRS',
        ]
        for (const v of limpingRapidBans) {
            bannedSet.add(v)
        }
    }

    if (locomotionTier === 'CRAWLING') {
        for (const v of VERB_FAMILIES.LOCOMOTION_RAPID) {
            bannedSet.add(v)
        }
        bannedSet.add('STAND')
        bannedSet.add('WALK')
    }

    if (
        legsAvailable === 0 ||
        locomotionTier === 'IMMOBILIZED' ||
        locomotionTier === 'SESSILE'
    ) {
        for (const v of VERB_FAMILIES.LOCOMOTION_RAPID) {
            bannedSet.add(v)
        }
        for (const v of VERB_FAMILIES.LOCOMOTION_VERTICAL) {
            bannedSet.add(v)
        }
        bannedSet.add('WALK')
        bannedSet.add('STAND')
        bannedSet.add('LIMP')
        bannedSet.add('CRAWL')
    }

    return {
        entityId,
        availableArmsBps,
        legsAvailable,
        locomotionTier,
        activeConditions: Array.from(activeConditions).sort(),
        bannedKineticVerbs: Array.from(bannedSet).sort(),
    }
}

export const initVerbs = (
    cpy: VerbsModel,
    bal: VerbsBit,
    _ste?: State,
): VerbsModel => {
    cpy.masksByEntity = {}
    cpy.auditHistory = []
    if (bal?.slv) bal.slv({ vrbBit: { idx: 'init-verbs-ok', val: 0 } })
    return cpy
}

export const updateVerbs = (
    cpy: VerbsModel,
    bal: VerbsBit,
    _ste?: State,
): VerbsModel => {
    if (bal?.slv) bal.slv({ vrbBit: { idx: 'update-verbs-ok' } })
    return cpy
}

export const compileSomaticMaskVerbs = (
    cpy: VerbsModel,
    bal: VerbsBit,
    _ste?: State,
): VerbsModel => {
    const payload = bal?.dat as CompileMaskPayload
    if (!payload?.entityId) {
        if (bal?.slv) {
            bal.slv({
                vrbBit: {
                    idx: 'compile-somatic-mask-err',
                    src: 'MISSING_ENTITY_ID',
                    val: -1,
                },
            })
        }
        return cpy
    }

    const mask = compileSomaticMask(
        payload.entityId,
        payload.conditions ?? [],
        payload.availableArmsBps ?? 20000,
        payload.legsAvailable ?? 2,
        payload.locomotionTier ?? 'UNRESTRICTED',
        payload.explicitBannedVerbs ?? [],
    )

    cpy.masksByEntity[payload.entityId] = mask

    if (bal?.slv) {
        bal.slv({
            vrbBit: {
                idx: 'compile-somatic-mask-ok',
                src: payload.entityId,
                val: mask.bannedKineticVerbs.length,
                dat: mask,
            },
        })
    }
    return cpy
}

export const assertKineticVerbs = async (
    cpy: VerbsModel,
    bal: VerbsBit,
    ste?: State,
): Promise<VerbsModel> => {
    const payload = bal?.dat as AuditQueryPayload
    if (!payload?.entityId || !payload?.candidateVerbs) {
        if (bal?.slv) {
            bal.slv({
                vrbBit: {
                    idx: 'assert-kinetic-verbs-err',
                    src: 'MISSING_QUERY',
                    val: -1,
                },
            })
        }
        return cpy
    }

    const mask = cpy.masksByEntity[payload.entityId] || {
        entityId: payload.entityId,
        availableArmsBps: 20000,
        legsAvailable: 2,
        locomotionTier: 'UNRESTRICTED' as LocomotionTier,
        activeConditions: [],
        bannedKineticVerbs: [],
    }

    const bannedSet = new Set(mask.bannedKineticVerbs)
    const breachedVerbs: string[] = []

    // Constant-time O(1) set-intersection audit
    for (const verb of payload.candidateVerbs) {
        const normalized = verb.trim().toUpperCase()
        if (bannedSet.has(normalized)) {
            breachedVerbs.push(normalized)
        }
    }

    const allowed = breachedVerbs.length === 0
    const receipt: KineticAuditReceipt = {
        allowed,
        entityId: payload.entityId,
        breachedVerbs: breachedVerbs.sort(),
        bannedKineticVerbs: mask.bannedKineticVerbs,
        timestampEpochMs: Date.now(),
    }

    // Pure 7-bit ASCII logging to cns00 when a breach occurs
    if (!allowed && ste && typeof ste.hunt === 'function') {
        const errorMsg = `>> [SOMATIC_CAPABILITY_BREACH] Actor ${payload.entityId} attempted banned verb(s): [${breachedVerbs.join(', ')}]`
        await ste
            .hunt('[Console action] Update Console', {
                idx: 'cns00',
                src: errorMsg,
            })
            .catch(() => {})
    }

    if (bal?.slv) {
        bal.slv({
            vrbBit: {
                idx: allowed
                    ? 'assert-kinetic-verbs-ok'
                    : 'assert-kinetic-verbs-breached',
                src: payload.entityId,
                val: breachedVerbs.length,
                dat: receipt,
            },
        })
    }

    return cpy
}

const VERB_TAXONOMY_ROLLUP: Record<string, readonly string[]> = {
    sprint: ['sprint', 'dash', 'bolt', 'charge'],
    leap: ['leap', 'bound', 'jump', 'hurdle'],
    vault: ['vault', 'hop_barrier', 'scale_wall'],
    scramble: ['scramble', 'clamber', 'rush'],
    bimanual_strike: ['bimanual_strike', 'heavy_swing', 'two_handed_cleave'],
}

/**
 * Consolidates, rolls up synonyms, and deduplicates banned kinetic verbs.
 */
export function enforceBannedKineticVerbsBuzz(
    baseBanned: readonly string[] = [],
    locomotionBanned: readonly string[] = [],
    somaticConditions: readonly string[] = [],
): string[] {
    const resultSet = new Set<string>()

    const addVerbWithRollup = (verb: string) => {
        const normalized = verb.toLowerCase().trim()
        resultSet.add(normalized)
        const rollups = VERB_TAXONOMY_ROLLUP[normalized]
        if (rollups) {
            for (const synonym of rollups) {
                resultSet.add(synonym)
            }
        }
    }

    for (const v of baseBanned) addVerbWithRollup(v)
    for (const v of locomotionBanned) addVerbWithRollup(v)

    for (const condition of somaticConditions) {
        const uc = condition.toUpperCase()
        if (
            uc.includes('AMPUTATION') ||
            uc.includes('BRACHIAL') ||
            uc.includes('FRACTURED')
        ) {
            addVerbWithRollup('bimanual_strike')
            addVerbWithRollup('bimanual_lift')
        }
        if (uc.includes('PARALYSIS') || uc.includes('FRACTURED_FEMUR')) {
            addVerbWithRollup('sprint')
            addVerbWithRollup('leap')
            addVerbWithRollup('vault')
        }
    }

    return Array.from(resultSet).sort()
}
