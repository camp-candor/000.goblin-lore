import { CharacterSomaticMaskBit } from '../fce/somaticMask.bit.js'
import { CharacterModel } from '../character.model.js'
import CharacterBit from '../fce/character.bit.js'
import State from '../../99.core/state.js'

const SEVERE_ARM_CONDITIONS = new Set([
    'cnd_severed_left_arm',
    'cnd_severed_right_arm',
    'cnd_braxial_plexus_severed',
    'cnd_brachial_plexus_severed',
    'cnd_paralyzed_arm',
    'cnd_amputated_limb',
    'cnd_combat_excision_arm',
    'severed_left_arm',
    'severed_right_arm',
    'braxial_plexus_severed',
    'brachial_plexus_severed',
    'paralyzed_arm',
    'amputated_limb',
    'combat_excision_arm',
])

const BIMANUAL_VERB_BANS = ['bimanual_lift', 'dual_wield', 'two_handed_strike']

const UPPER_LIMB_TOTAL_BANS = [
    'bimanual_lift',
    'carry',
    'climb',
    'dual_wield',
    'grasp',
    'hold',
    'pick_lock',
    'two_handed_strike',
]

const LIMPING_VERB_BANS = ['leap', 'sprint', 'vault']

const SESSILE_VERB_BANS = [
    'climb',
    'crawl',
    'leap',
    'run',
    'sprint',
    'vault',
    'walk',
]

/**
 * Recursively freezes an object tree with proxy mutation traps to ensure absolute immutability.
 */
export function deepFreeze<T>(obj: T): Readonly<T> {
    if (obj === null || typeof obj !== 'object') {
        return obj
    }
    for (const key of Object.getOwnPropertyNames(obj)) {
        const prop = (obj as Record<string, unknown>)[key]
        if (
            prop !== null &&
            (typeof prop === 'object' || typeof prop === 'function')
        ) {
            ;(obj as Record<string, unknown>)[key] = deepFreeze(prop)
        }
    }
    Object.freeze(obj)
    return new Proxy(obj, {
        set(_target, prop) {
            throw new TypeError(
                `Cannot assign to read only property '${String(prop)}'`,
            )
        },
        defineProperty(_target, prop) {
            throw new TypeError(`Cannot define property '${String(prop)}'`)
        },
        deleteProperty(_target, prop) {
            throw new TypeError(`Cannot delete property '${String(prop)}'`)
        },
    }) as Readonly<T>
}

/**
 * Extracts and compiles an immutable somatic capability projection for an actor.
 */
export function getCharacterSomaticMask(
    characterId: string,
    registry: Map<string, any> | Record<string, any>,
): Readonly<CharacterSomaticMaskBit> {
    const character =
        registry instanceof Map
            ? registry.get(characterId)
            : registry[characterId]

    if (!character) {
        throw new Error(`[LORE CLIENT] Unknown character ID: '${characterId}'`)
    }

    // Handle both DualRailCharacterBit envelope and raw CharacterFrontmatter
    const frontmatter = character.machineRail || character
    const somatic = frontmatter.somatic || {}

    const locomotionBaseline: string =
        somatic.locomotion_baseline || 'bipedal_standard'
    const conditions: string[] = somatic.conditions || []
    const motorLimitations: string[] = somatic.motor_limitations || []

    // Calculate base arm capacity
    let baseArmsBps = 20000 // 2.0 arms default
    if (
        locomotionBaseline === 'sessile' ||
        locomotionBaseline === 'slithering'
    ) {
        baseArmsBps = 0
    }

    // Subtract severe conditions (10000 bps per lost limb)
    let severeConditionCount = 0
    for (const condition of conditions) {
        if (SEVERE_ARM_CONDITIONS.has(condition.toLowerCase())) {
            severeConditionCount++
        }
    }

    // Clamp upper-limb capacity at zero (no negative limb budgets)
    // prettier-ignore
    const availableArmsBps = Math.max(0, baseArmsBps - severeConditionCount * 10000)

    // Compile negative kinetic verb mask
    const verbSet = new Set<string>()

    // 1. Explicitly configured verb bans
    for (const verb of somatic.banned_kinetic_verbs || []) {
        verbSet.add(verb.toLowerCase())
    }

    // 2. Locomotion baseline restrictions
    if (locomotionBaseline === 'limping') {
        for (const verb of LIMPING_VERB_BANS) verbSet.add(verb)
    } else if (locomotionBaseline === 'sessile') {
        for (const verb of SESSILE_VERB_BANS) verbSet.add(verb)
    }

    // 3. Upper limb saturation restrictions
    if (availableArmsBps < 20000 && availableArmsBps > 0) {
        for (const verb of BIMANUAL_VERB_BANS) verbSet.add(verb)
    } else if (availableArmsBps === 0) {
        for (const verb of UPPER_LIMB_TOTAL_BANS) verbSet.add(verb)
    }

    // Deduplicate and lexicographically sort verb lemmas
    const bannedKineticVerbs = Array.from(verbSet).sort()

    const sensory = somatic.sensory || {}
    const vocalDsp = somatic.vocal_dsp || {}

    const sensoryAcuity = {
        opticalState: (sensory.optical_state || 'NORMAL') as
            'NORMAL' | 'MONOCULAR' | 'BLIND',
        blindConeDegrees: sensory.blind_cone_degrees ?? 0,
        auditoryFloorDebuffCdB: sensory.auditory_floor_debuff_cdb ?? 0,
    }

    const vocalDspModifiers = {
        pitchShiftCentitones: vocalDsp.pitch_shift_centitones ?? 0,
        speedMultiplierBps: vocalDsp.speed_multiplier_bps ?? 10000,
        pauseFrequencyBps: vocalDsp.pause_frequency_bps ?? 10000,
    }

    const canSpeak =
        !motorLimitations.includes('MUTE') &&
        !conditions.includes('cnd_vocal_cord_transected')

    const projection: CharacterSomaticMaskBit = {
        characterId,
        locomotionBaseline,
        availableArmsBps,
        bannedKineticVerbs,
        motorLimitations: [...motorLimitations],
        conditions: [...conditions],
        sensoryAcuity,
        vocalDsp: vocalDspModifiers,
        canSpeak,
    }

    return deepFreeze(projection)
}

/**
 * Buzzer action validating and projecting somatic capability through state dispatcher.
 */
export const projectSomaticMask = (
    cpy: CharacterModel,
    bal: CharacterBit,
    ste: State,
): CharacterModel => {
    try {
        const characterId: string = bal.dat?.characterId || bal.src || ''
        const registry = bal.dat?.registry || {}

        const mask = getCharacterSomaticMask(characterId, registry)

        if (bal.slv) {
            bal.slv({
                characterBit: {
                    idx: bal.idx,
                    val: 1,
                    dat: mask,
                },
            })
        }
    } catch (err: any) {
        if (bal.slv) {
            bal.slv({
                characterBit: {
                    idx: bal.idx,
                    val: 0,
                    dat: {
                        error: err.message,
                    },
                },
            })
        }
    }
    return cpy
}
