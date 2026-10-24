import { spawnSync } from 'node:child_process'
import { emitBusConsoleLog } from '../../99.bus.unit/buz/bus.buzz.js'

export interface CursesSuspensionResult {
    readonly success: boolean
    readonly exitCode: number
    readonly headlessBypass: boolean
    readonly error?: string
}

export const suspendCursesAndSpawnEditor = async (
    targetFilePath: string,
): Promise<CursesSuspensionResult> => {
    const lib = (globalThis as any).LIBRARY
    const isHeadless = !process.stdin.isTTY || process.env.CI === 'true'

    if (isHeadless) {
        await emitBusConsoleLog(
            'cns00',
            `>> [HUMAN_GATE] Headless execution detected. Bypassing interactive $EDITOR for: ${targetFilePath}`,
        )
        return {
            success: true,
            exitCode: 0,
            headlessBypass: true,
        }
    }

    await emitBusConsoleLog(
        'cns00',
        '>> [HUMAN_GATE] Suspending Blessed curses screen...',
    )

    // 1. De-allocate curses raw mode & leave alternate screen buffer
    if (lib && typeof lib.hunt === 'function') {
        await lib
            .hunt('[Terminal action] Update Terminal', {
                dat: { suspendRawMode: true },
            })
            .catch(() => {})
    }

    const editorCommand = process.env.VISUAL || process.env.EDITOR || 'nano'
    let childStatus = 0

    try {
        await emitBusConsoleLog(
            'cns00',
            `>> [HUMAN_GATE] Spawning editor: ${editorCommand} ${targetFilePath}`,
        )
        const child = spawnSync(editorCommand, [targetFilePath], {
            stdio: 'inherit',
            shell: true,
        })
        childStatus = child.status ?? 0
    } catch (err: any) {
        childStatus = 1
        await emitBusConsoleLog(
            'cns00',
            `>> [FAIL] [HUMAN_GATE] Editor process error: ${err?.message || String(err)}`,
        )
    } finally {
        // 2. Re-enter alternate screen buffer & re-enable raw mode
        if (lib && typeof lib.hunt === 'function') {
            await lib
                .hunt('[Terminal action] Update Terminal', {
                    dat: { restoreRawMode: true },
                })
                .catch(() => {})
        }
        await emitBusConsoleLog(
            'cns00',
            '>> [HUMAN_GATE] Restored Blessed curses screen buffer.',
        )
    }

    return {
        success: childStatus === 0,
        exitCode: childStatus,
        headlessBypass: false,
        error:
            childStatus !== 0
                ? `Editor exited with non-zero status: ${childStatus}`
                : undefined,
    }
}
