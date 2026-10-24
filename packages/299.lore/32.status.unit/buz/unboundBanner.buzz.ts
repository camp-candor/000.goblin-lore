import type State from '../../99.core/state.js'
import type { StatusModel } from '../status.model.js'
import type StatusBit from '../fce/status.bit.js'

export const UNBOUND_HUD_LINES = [
    'ACTIVE SERIES : [NONE (UNBOUND)]',
    'CANON STATUS  : VOID STATE (T0=$0.00)',
    'ROOT MERKLE   : 0000000000000000000000000000000000000000000000000000000000000000',
    'DISPATCH LOCK : [!] ENGAGED',
] as const

/**
 * Pure generator returning the 4-line 7-bit ASCII HUD payload
 * for the Cold-Start Byte-0 Void State.
 */
export const formatUnboundBannerPayload = (): string[] => {
    return [...UNBOUND_HUD_LINES]
}

/**
 * Reactive Buzzer handler for ActSts.FORMAT_UNBOUND_BANNER.
 * Updates model state and dispatches curses update to 80.terminal.unit.
 */
export const formatUnboundBanner = async (
    cpy: StatusModel,
    bal: StatusBit,
    ste?: State,
): Promise<StatusModel> => {
    const lines = formatUnboundBannerPayload()

    cpy.isVoidState = true
    cpy.dispatchLockEngaged = true
    cpy.activeBorderColor = 'amber'
    cpy.hudLines = [...lines]

    // Intercept and dispatch to Blessed Terminal OS if available
    const lib = (globalThis as any).LIBRARY
    if (lib && typeof lib.hunt === 'function') {
        try {
            await lib.hunt('[Terminal action] Update Terminal', {
                idx: 'trm00',
                val: 1,
                lst: lines,
                dat: {
                    borderClr: cpy.activeBorderColor,
                    title: 'CANON TELEMETRY SENTINEL',
                },
            })
        } catch {
            // Non-blocking degradation in test/mock environments
        }
    }

    if (bal.slv) {
        bal.slv({
            statusBit: {
                idx: 'unbound-banner',
                val: 1,
                lst: lines,
                dat: {
                    isVoidState: cpy.isVoidState,
                    dispatchLockEngaged: cpy.dispatchLockEngaged,
                    activeBorderColor: cpy.activeBorderColor,
                },
            },
        })
    }

    return cpy
}
