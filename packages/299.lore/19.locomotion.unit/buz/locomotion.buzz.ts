import { LocomotionModel } from '../locomotion.model.js'
import type LocomotionBit from '../fce/locomotion.bit.js'
import type State from '../../99.core/state.js'
import {
    validateLocomotionBaseline,
    LocomotionTierSchema,
    LOCOMOTION_PROFILES,
    type LocomotionProfile,
} from '../val/locomotion.val.js'
import { ZodError } from 'zod'

const UPDATE_CONSOLE = '[Console action] Update Console'

const logConsole = async (ste: State, src: string): Promise<void> => {
    if (ste && typeof ste.hunt === 'function') {
        try {
            await ste.hunt(UPDATE_CONSOLE, {
                idx: 'cns00',
                src,
            })
        } catch {
            // Non-blocking degradation when running in headless unit tests
        }
    } else if (
        (globalThis as any).LIBRARY &&
        typeof (globalThis as any).LIBRARY.hunt === 'function'
    ) {
        try {
            await (globalThis as any).LIBRARY.hunt(UPDATE_CONSOLE, {
                idx: 'cns00',
                src,
            })
        } catch {
            // Headless harness fallback
        }
    }
}

export const initLocomotion = (
    cpy: LocomotionModel,
    bal: LocomotionBit,
    ste: State,
): LocomotionModel => {
    cpy.locomotionBitList = []
    cpy.locomotionBits = {}

    if (bal && bal.slv != null) {
        bal.slv({
            locomotionBit: {
                idx: bal.idx || 'init-locomotion',
                val: 1,
                dat: { initialized: true },
            },
        })
    }
    return cpy
}

export const updateLocomotion = (
    cpy: LocomotionModel,
    bal: LocomotionBit,
    ste: State,
): LocomotionModel => {
    if (bal && bal.slv != null) {
        bal.slv({
            locomotionBit: {
                idx: bal.idx || 'update-locomotion',
                val: 1,
            },
        })
    }
    return cpy
}

export const validateLocomotion = async (
    cpy: LocomotionModel,
    bal: LocomotionBit,
    ste: State,
): Promise<LocomotionModel> => {
    const candidate = bal.dat?.baseline

    try {
        if (!candidate || typeof candidate !== 'string') {
            throw new Error(
                '[LOCOMOTION_BASELINE_REQUIRED]: Candidate baseline string must be provided in bal.dat.baseline.',
            )
        }

        const profile = validateLocomotionBaseline(candidate)

        // Cache the validated profile in model state
        cpy.locomotionBits[profile.baseline] = profile
        cpy.locomotionBitList.push({
            idx: bal.idx || `loc_${Date.now()}`,
            val: 1,
            dat: { baseline: profile.baseline, profile, isValid: true },
        })

        await logConsole(
            ste,
            `>> [LOCOMOTION UNIT] Baseline validated: ${profile.baseline}`,
        )
        await logConsole(
            ste,
            `>> [VELOCITY CAP] Max velocity: ${profile.max_velocity_bps} bps`,
        )
        await logConsole(
            ste,
            `>> [NEGATIVE MASK] Banned verbs: ${JSON.stringify(profile.default_banned_verbs)}`,
        )
        await logConsole(
            ste,
            '>> [STATUS] Stage T_0 Physical Bounds Locked [OK]',
        )

        if (bal && bal.slv != null) {
            bal.slv({
                locomotionBit: {
                    idx: bal.idx,
                    val: 1,
                    dat: {
                        baseline: profile.baseline,
                        profile,
                        isValid: true,
                    },
                },
            })
        }
    } catch (error) {
        const errorMsg =
            error instanceof ZodError
                ? `[INVALID_LOCOMOTION_BASELINE]: ${error.issues.map((i) => i.message).join(', ')}`
                : `[LOCOMOTION_VALIDATION_ERROR]: ${String(error)}`

        await logConsole(ste, `>> [LOCOMOTION REJECTED] ${errorMsg}`)

        if (bal && bal.slv != null) {
            bal.slv({
                locomotionBit: {
                    idx: bal.idx,
                    val: 0,
                    dat: {
                        baseline: candidate,
                        isValid: false,
                        error: errorMsg,
                    },
                },
            })
        }
    }

    return cpy
}

export interface LocomotionValidationResult {
    readonly success: boolean
    readonly locomotion_tier: string
    readonly profile: LocomotionProfile
    readonly code: string
    readonly message: string
}

/**
 * Validates a locomotion tier and resolves its velocity and forbidden verbs.
 */
export function validateLocomotionBaselineBuzz(
    rawTier: unknown,
): LocomotionValidationResult {
    const parseResult = LocomotionTierSchema.safeParse(rawTier)

    if (!parseResult.success) {
        return {
            success: false,
            locomotion_tier: String(rawTier),
            profile: {
                baseline: 'sessile',
                max_velocity_bps: 0,
                max_velocity_bp: 0,
                default_arms_bps: 0,
                default_banned_verbs: [],
                mandatory_banned_verbs: [],
                description: '',
            },
            code: 'INVALID_LOCOMOTION_TIER',
            message: `[FAIL] :: Invalid locomotion baseline: ${String(rawTier)}`,
        }
    }

    const tier = parseResult.data
    const profile = LOCOMOTION_PROFILES[tier]

    return {
        success: true,
        locomotion_tier: tier,
        profile,
        code: 'OK',
        message: `[OK] :: Locomotion tier '${tier}' mapped (Max Velocity: ${profile.max_velocity_bp} bp)`,
    }
}
