import type State from '../../99.core/state.js'
import type { MenuModel } from '../menu.model.js'
import type MenuBit from '../fce/menu.bit.js'
import { emitBusConsoleLog } from '../../99.bus.unit/buz/bus.buzz.js'
import { scanVoidState } from '../../32.status.unit/buz/voidStateScan.buzz.js'
import * as ActSts from '../../32.status.unit/status.action.js'

/**
 * Formats and streams the 7-bit clean ASCII status audit report to console channel cns00.
 */
export const streamHudTelemetryReport = async (
    isVoid: boolean,
    slugs: readonly string[],
    lockEngaged: boolean,
    lockReason: string | null,
): Promise<void> => {
    const lines = [
        '>> --------------------------------------------------',
        '>> LORE ENGINE STATUS & TELEMETRY AUDIT',
        `>> CANON POSTURE    : [${isVoid ? 'VOID STATE (T0=$0.00)' : 'SERIES BOUND / READY'}]`,
        `>> ACTIVE SERIES    : [${slugs.length === 0 ? 'NONE (UNBOUND)' : slugs[0]}]`,
        `>> ROOT MERKLE      : ${isVoid ? '0000000000000000000000000000000000000000000000000000000000000000' : 'ACTIVE_STATE_SEALED'}`,
        `>> DISPATCH LOCKOUT : [${lockEngaged ? 'ENGAGED' : 'DISENGAGED'}] (Reason: ${lockReason || 'NONE'})`,
        `>> SERIES ON DISK   : ${slugs.length} discovered (${slugs.length > 0 ? slugs.join(', ') : 'none'})`,
        '>> --------------------------------------------------',
    ]

    for (const line of lines) {
        try {
            await emitBusConsoleLog('cns00', line)
        } catch {
            // Non-blocking degradation in test/mock environments
        }
    }
}

/**
 * Reactive Buzzer handler for ActMnu.INSPECT_HUD_STATUS.
 * Re-scans filesystem, updates 80.terminal.unit, and streams audit lines to cns00.
 */
export const inspectGenesisHudStatus = async (
    cpy: MenuModel,
    bal: MenuBit,
    ste?: State,
): Promise<MenuModel> => {
    const scanResult = scanVoidState(bal.src)
    const isVoid = scanResult.isVoidState
    const slugs = scanResult.discoveredSlugs

    let lockEngaged = isVoid
    let lockReason: string | null = isVoid ? 'COLD_BOOT_VOID_STATE' : null

    // Interrogate or dispatch to 32.status.unit if state hunt dispatcher is present
    if (ste && typeof ste.hunt === 'function') {
        if (isVoid) {
            await ste.hunt(ActSts.FORMAT_UNBOUND_BANNER, {})
        }
        const statusRes: any = await ste.hunt(ActSts.READ_DISPATCH_LOCKOUT, {})
        if (statusRes?.statusBit?.dat) {
            lockEngaged = Boolean(statusRes.statusBit.dat.dispatchLockEngaged)
            lockReason = statusRes.statusBit.dat.lockReason
        }
    }

    await streamHudTelemetryReport(isVoid, slugs, lockEngaged, lockReason)

    cpy.lastSelection = 'INSPECT HUD STATUS'

    if (bal.slv) {
        bal.slv({
            mnuBit: {
                idx: 'inspect-genesis-hud',
                val: isVoid ? 1 : 0,
                dat: {
                    isVoidState: isVoid,
                    discoveredSlugs: slugs,
                    dispatchLockEngaged: lockEngaged,
                    lockReason,
                },
            },
        })
    }

    return cpy
}
