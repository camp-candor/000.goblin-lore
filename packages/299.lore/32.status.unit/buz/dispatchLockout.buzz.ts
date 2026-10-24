import type State from '../../99.core/state.js'
import type { StatusModel } from '../status.model.js'
import type StatusBit from '../fce/status.bit.js'
import { emitBusConsoleLog } from '../../99.bus.unit/buz/bus.buzz.js'

/**
 * Mutates dispatchLockEngaged, updates lockReason, and appends a record to lockHistory.
 * bal.val: 1 for engage (lock), 0 for disengage (unlock)
 * bal.src: string reason (e.g. 'UNCOMPILED_CANON_DRIFT', 'SERIES_BOUND_AND_SEALED')
 */
export const setDispatchLockout = async (
    cpy: StatusModel,
    bal: StatusBit,
    ste?: State,
): Promise<StatusModel> => {
    const engage = bal.val === undefined ? true : Boolean(bal.val)
    const reason =
        bal.src || (engage ? 'MANUAL_DISPATCH_LOCKOUT' : 'LOCK_CLEARED')

    cpy.dispatchLockEngaged = engage
    cpy.lockReason = engage ? reason : null

    const record = {
        timestamp: Date.now(),
        reason,
        engaged: engage,
    }

    cpy.lockHistory = [...cpy.lockHistory, record]

    const logToken = engage ? '[LOCK]' : '[UNLOCK]'
    await emitBusConsoleLog(
        'cns00',
        `>> ${logToken} Dispatch Lockout state changed: ${engage ? 'ENGAGED' : 'DISENGAGED'} (${reason})`,
    )

    if (bal.slv) {
        bal.slv({
            statusBit: {
                idx: 'set-dispatch-lockout',
                val: engage ? 1 : 0,
                src: reason,
                dat: {
                    dispatchLockEngaged: cpy.dispatchLockEngaged,
                    lockReason: cpy.lockReason,
                    record,
                },
            },
        })
    }

    return cpy
}

/**
 * Pure query returning current lockout status.
 */
export const readDispatchLockout = async (
    cpy: StatusModel,
    bal: StatusBit,
    ste?: State,
): Promise<StatusModel> => {
    if (bal.slv) {
        bal.slv({
            statusBit: {
                idx: 'read-dispatch-lockout',
                val: cpy.dispatchLockEngaged ? 1 : 0,
                src: cpy.lockReason || 'UNLOCKED',
                dat: {
                    dispatchLockEngaged: cpy.dispatchLockEngaged,
                    lockReason: cpy.lockReason,
                    isVoidState: cpy.isVoidState,
                    historyCount: cpy.lockHistory.length,
                },
            },
        })
    }

    return cpy
}
