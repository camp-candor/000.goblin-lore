import { allocateGenesisInputGrid } from './genesisInputGrid.buzz.js'
import { emitBusConsoleLog } from '../../99.bus.unit/buz/bus.buzz.js'
import type {
    PromptSeriesNameOptions,
    PromptSeriesNameResult,
} from '../fce/promptSeriesName.bit.js'

export const OPEN_INPUT = '[Open action] Open Input'

/**
 * Mounts the curses textbox modal in the left Control Axis (Cols 0-4, Rows 4-10)
 * to capture the series name directly from the operator.
 */
export const promptSeriesNameBuzz = async (
    options?: PromptSeriesNameOptions,
): Promise<PromptSeriesNameResult> => {
    const lib = (globalThis as any).LIBRARY

    // 1. Resolve Bounding Geometry
    let net = options?.customGridNet
    if (!net) {
        const gridAlloc = await allocateGenesisInputGrid()
        net = gridAlloc.dat
    }

    // 2. Stream Prompt Telemetry to Console cns00
    await emitBusConsoleLog(
        'cns00',
        '>> [GENESIS] Enter New Series Name (e.g. wiregrass-basin):',
    )

    // 3. Headless Fallback for CI / Vitest environments without Blessed display
    if (!lib || typeof lib.hunt !== 'function') {
        return {
            rawName: options?.defaultName || '',
            cancelled: !options?.defaultName,
            isHeadless: true,
        }
    }

    try {
        // 4. Dispatch OPEN_INPUT to 84.input.unit
        const inputRes = await lib.hunt(OPEN_INPUT, {
            txt: options?.label || 'Enter Series Name:',
            src: options?.defaultName || '',
            dat: {
                clr0: 'black',
                clr1: 'yellow',
            },
            net,
        })

        const putBit = inputRes?.putBit

        // Check for explicit cancel action (val: -1 or cancel idx)
        if (putBit?.val === -1 || putBit?.idx === 'open-input-cancel') {
            await emitBusConsoleLog(
                'cns00',
                '>> [CANCEL] Series genesis aborted by user.',
            )
            return {
                rawName: '',
                cancelled: true,
                isHeadless: false,
            }
        }

        const rawInput =
            typeof putBit?.src === 'string' ? putBit.src.trim() : ''

        if (rawInput.length === 0) {
            await emitBusConsoleLog(
                'cns00',
                '>> [CANCEL] Empty series name provided. Cancelled.',
            )
            return {
                rawName: '',
                cancelled: true,
                isHeadless: false,
            }
        }

        await emitBusConsoleLog(
            'cns00',
            `>> [INPUT] Captured raw series title: '${rawInput}'`,
        )

        return {
            rawName: rawInput,
            cancelled: false,
            isHeadless: false,
        }
    } catch (err: any) {
        const errorMsg = err instanceof Error ? err.message : String(err)
        await emitBusConsoleLog(
            'cns00',
            `:: [FAIL] Error invoking series input modal: ${errorMsg}`,
        )
        return {
            rawName: '',
            cancelled: true,
            isHeadless: false,
        }
    }
}
