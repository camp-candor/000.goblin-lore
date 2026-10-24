import type NetBit from '../fce/net.bit.js'

export const UPDATE_GRID = '[Grid action] Update Grid'

export interface GenesisInputGridRequest {
    readonly x?: number
    readonly y?: number
    readonly xSpan?: number
    readonly ySpan?: number
}

export interface GenesisInputGridResult {
    readonly idx: string
    readonly dat: NetBit
    readonly isFallback: boolean
}

export const FALLBACK_GENESIS_INPUT_GRID: NetBit = {
    left: '0%',
    top: '33.333333333333336%',
    width: '33.333333333333336%',
    height: '50%',
}

/**
 * Allocates 12x12 percentage grid bounding coordinates for the series name input modal
 * inside the left Control Axis (x: 0, y: 4, xSpan: 4, ySpan: 6).
 */
export const allocateGenesisInputGrid = async (
    custom?: GenesisInputGridRequest,
): Promise<GenesisInputGridResult> => {
    const x = typeof custom?.x === 'number' ? custom.x : 0
    const y = typeof custom?.y === 'number' ? custom.y : 4
    const xSpan = typeof custom?.xSpan === 'number' ? custom.xSpan : 4
    const ySpan = typeof custom?.ySpan === 'number' ? custom.ySpan : 6

    const lib = (globalThis as any).LIBRARY

    if (!lib || typeof lib.hunt !== 'function') {
        return {
            idx: 'genesis-input-grid-fallback',
            dat: FALLBACK_GENESIS_INPUT_GRID,
            isFallback: true,
        }
    }

    try {
        const res = await lib.hunt(UPDATE_GRID, {
            x,
            y,
            xSpan,
            ySpan,
        })

        const net: NetBit = res?.grdBit?.dat || FALLBACK_GENESIS_INPUT_GRID

        return {
            idx: 'genesis-input-grid',
            dat: net,
            isFallback: false,
        }
    } catch (_err) {
        return {
            idx: 'genesis-input-grid-error-fallback',
            dat: FALLBACK_GENESIS_INPUT_GRID,
            isFallback: true,
        }
    }
}
