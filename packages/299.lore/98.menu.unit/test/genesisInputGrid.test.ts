import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
    allocateGenesisInputGrid,
    FALLBACK_GENESIS_INPUT_GRID,
    UPDATE_GRID,
} from '../buz/genesisInputGrid.buzz.js'
import type NetBit from '../fce/net.bit.js'

describe('98.menu.unit - Left Grid Coordinate Allocator Buzzer', () => {
    const originalLibrary = (globalThis as any).LIBRARY

    beforeEach(() => {
        delete (globalThis as any).LIBRARY
    })

    afterEach(() => {
        if (originalLibrary !== undefined) {
            ;(globalThis as any).LIBRARY = originalLibrary
        } else {
            delete (globalThis as any).LIBRARY
        }
    })

    it('returns deterministic fallback coordinates when running headless without LIBRARY', async () => {
        const result = await allocateGenesisInputGrid()

        expect(result.isFallback).toBe(true)
        expect(result.idx).toBe('genesis-input-grid-fallback')
        expect(result.dat).toEqual(FALLBACK_GENESIS_INPUT_GRID)
        expect(result.dat.left).toBe('0%')
        expect(result.dat.top).toBe('33.333333333333336%')
        expect(result.dat.width).toBe('33.333333333333336%')
        expect(result.dat.height).toBe('50%')
    })

    it('invokes LIBRARY.hunt with default genesis modal coordinates (x:0, y:4, xSpan:4, ySpan:6)', async () => {
        const mockNet: NetBit = {
            left: '0%',
            top: '33.333333333333336%',
            width: '33.333333333333336%',
            height: '50%',
        }

        const huntSpy = vi.fn().mockResolvedValue({
            grdBit: {
                idx: 'update-grid',
                dat: mockNet,
            },
        })

        ;(globalThis as any).LIBRARY = { hunt: huntSpy }

        const result = await allocateGenesisInputGrid()

        expect(huntSpy).toHaveBeenCalledTimes(1)
        expect(huntSpy).toHaveBeenCalledWith(UPDATE_GRID, {
            x: 0,
            y: 4,
            xSpan: 4,
            ySpan: 6,
        })
        expect(result.isFallback).toBe(false)
        expect(result.idx).toBe('genesis-input-grid')
        expect(result.dat).toEqual(mockNet)
    })

    it('respects custom grid coordinate overrides if provided', async () => {
        const mockNet: NetBit = {
            left: '0%',
            top: '25%',
            width: '33.333333333333336%',
            height: '58.333333333333336%',
        }

        const huntSpy = vi.fn().mockResolvedValue({
            grdBit: {
                idx: 'update-grid',
                dat: mockNet,
            },
        })

        ;(globalThis as any).LIBRARY = { hunt: huntSpy }

        const result = await allocateGenesisInputGrid({
            x: 0,
            y: 3,
            xSpan: 4,
            ySpan: 7,
        })

        expect(huntSpy).toHaveBeenCalledWith(UPDATE_GRID, {
            x: 0,
            y: 3,
            xSpan: 4,
            ySpan: 7,
        })
        expect(result.dat).toEqual(mockNet)
    })

    it('safely recovers and yields fallback coordinates if LIBRARY.hunt throws an error', async () => {
        const huntSpy = vi
            .fn()
            .mockRejectedValue(new Error('Harness isolate timeout'))
        ;(globalThis as any).LIBRARY = { hunt: huntSpy }

        const result = await allocateGenesisInputGrid()

        expect(result.isFallback).toBe(true)
        expect(result.idx).toBe('genesis-input-grid-error-fallback')
        expect(result.dat).toEqual(FALLBACK_GENESIS_INPUT_GRID)
    })
})
