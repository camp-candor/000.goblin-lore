import type State from '../../99.core/state.js'
import type { StreamModel } from '../stream.model.js'
import type StreamBit from '../fce/stream.bit.js'
import { emitBusConsoleLog } from '../../99.bus.unit/buz/bus.buzz.js'

export const DEFAULT_VOID_WARNING_LINES = [
    '>> [WARN] No series found in series/. Create one first.',
    '>> [LOCK] Dispatch Lockout Engaged at T_0 ($0.00 spend).',
] as const

/**
 * Pure generator returning the canonical void warning lines.
 */
export const getVoidWarningPayload = (): string[] => {
    return [...DEFAULT_VOID_WARNING_LINES]
}

/**
 * Reactive Buzzer handler for ActStm.STREAM_VOID_WARNING.
 * Emits diagnostic warnings to Blessed console cns00 and records telemetry in model state.
 */
export const voidWarningStream = async (
    cpy: StreamModel,
    bal: StreamBit,
    ste?: State,
): Promise<StreamModel> => {
    const lines: string[] =
        bal.lst && Array.isArray(bal.lst) && bal.lst.length > 0
            ? bal.lst
            : getVoidWarningPayload()

    for (const line of lines) {
        try {
            await emitBusConsoleLog('cns00', line)
        } catch {
            // Non-blocking degradation in test/mock environments
        }
    }

    cpy.lastEmittedWarning = [...lines]
    cpy.warningCount = (cpy.warningCount || 0) + 1

    if (bal.slv) {
        bal.slv({
            stmBit: {
                idx: 'void-warning-stream',
                val: lines.length,
                lst: lines,
                dat: {
                    emittedAt: Date.now(),
                    targetChannel: 'cns00',
                    warningCount: cpy.warningCount,
                },
            },
        })
    }

    return cpy
}
