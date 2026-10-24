import { VoiceModel } from '../voice.model'
import type VoiceBit from '../fce/voice.bit'
import type State from '../../99.core/state'
import {
    CharacterProgressionSchema,
    ShowrunnerTaskIdSchema,
    type ProgressionLockResult,
    type CharacterProgression,
} from '../val/progressionLock.val'

/**
 * Checks whether a character is locked awaiting a showrunner scripted milestone.
 */
export const checkProgressionLock = (
    cpy: VoiceModel,
    bal: VoiceBit,
    ste: State,
): VoiceModel => {
    const characterId = String(bal.idx ?? 'char_unknown')
    const payload = bal.dat ?? {}

    const parseResult = CharacterProgressionSchema.safeParse(payload)
    if (!parseResult.success) {
        const issue = parseResult.error.issues[0]
        const failure: ProgressionLockResult = {
            characterId,
            isLocked: true,
            status: 'LOCKED_PENDING_SHOWRUNNER',
            pendingTask: null,
            simulationPermitted: false,
            isValid: false,
            errorCode: 'INVALID_SHOWRUNNER_TASK_FORMAT_BREACH',
            message: issue?.message ?? 'Malformed progression schema payload',
        }

        if (bal.slv != null) {
            bal.slv({
                vceBit: {
                    idx: 'check-progression-lock',
                    val: 0,
                    dat: failure,
                },
            })
        }
        return cpy
    }

    const progression: CharacterProgression = parseResult.data
    const isLocked = progression.pending_showrunner_task !== null

    const result: ProgressionLockResult = {
        characterId,
        isLocked,
        status: isLocked
            ? 'LOCKED_PENDING_SHOWRUNNER'
            : 'UNLOCKED_SIMULATION_PERMITTED',
        pendingTask: progression.pending_showrunner_task,
        simulationPermitted: !isLocked,
        isValid: true,
        message: isLocked
            ? `Character progression gated on showrunner task '${progression.pending_showrunner_task}'. Simulation advancement blocked.`
            : 'Character has zero pending showrunner milestones. Simulation advancement permitted.',
    }

    if (bal.slv != null) {
        bal.slv({
            vceBit: {
                idx: 'check-progression-lock',
                val: isLocked ? 0 : 1,
                dat: result,
            },
        })
    }

    return cpy
}

/**
 * Resolves a progression lock when a showrunner milestone is fulfilled.
 */
export const resolveProgressionLock = (
    cpy: VoiceModel,
    bal: VoiceBit,
    ste: State,
): VoiceModel => {
    const characterId = String(bal.idx ?? 'char_unknown')
    const taskId = bal.src

    const taskParse = ShowrunnerTaskIdSchema.safeParse(taskId)
    if (!taskParse.success) {
        if (bal.slv != null) {
            bal.slv({
                vceBit: {
                    idx: 'resolve-progression-lock',
                    val: 0,
                    dat: {
                        characterId,
                        resolved: false,
                        errorCode: 'INVALID_SHOWRUNNER_TASK_FORMAT_BREACH',
                        message: `Task ID '${String(taskId)}' does not conform to lowercase alphanumeric schema.`,
                    },
                },
            })
        }
        return cpy
    }

    if (bal.slv != null) {
        bal.slv({
            vceBit: {
                idx: 'resolve-progression-lock',
                val: 1,
                dat: {
                    characterId,
                    resolvedTask: taskParse.data,
                    resolved: true,
                    message: `Showrunner task '${taskParse.data}' resolved. Progression unlocked for '${characterId}'.`,
                },
            },
        })
    }

    return cpy
}
