import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import {
    assertSeriesNamespaceVacant,
    checkSeriesSlugAvailabilityBuzz,
} from '../buz/slugCollisionGuard.buzz.js'
import type { SlugCollisionGuardOccupiedBit } from '../fce/slugCollisionGuard.bit.js'
import { SeriesModel } from '../series.model.js'

describe('29.series.unit - Existing Series Namespace Collision Guard', () => {
    let tempRepoRoot: string

    beforeEach(() => {
        tempRepoRoot = fs.mkdtempSync(
            path.join(os.tmpdir(), 'collision-guard-test-'),
        )
        fs.mkdirSync(path.join(tempRepoRoot, 'series'), { recursive: true })
        fs.mkdirSync(path.join(tempRepoRoot, 'compiled'), { recursive: true })
    })

    afterEach(() => {
        fs.rmSync(tempRepoRoot, { recursive: true, force: true })
    })

    it('detects a vacant namespace when neither series nor compiled folders exist', () => {
        const res = assertSeriesNamespaceVacant(tempRepoRoot, 'wiregrass-basin')
        expect(res.isVacant).toBe(true)
        expect(res.slug).toBe('wiregrass-basin')
    })

    it('detects collision when target directory already exists in series/', () => {
        const existingSeriesDir = path.join(
            tempRepoRoot,
            'series',
            'wiregrass-basin',
        )
        fs.mkdirSync(existingSeriesDir, { recursive: true })

        const res = assertSeriesNamespaceVacant(tempRepoRoot, 'Wiregrass Basin')
        expect(res.isVacant).toBe(false)
        if (!res.isVacant) {
            const occ = res as SlugCollisionGuardOccupiedBit
            expect(occ.errorCode).toBe('CONFLICT_BLOCKED')
            expect(occ.collidedPaths).toContain(existingSeriesDir)
            expect(occ.message).toContain('already exists on disk')
        }
    })

    it('detects collision when target directory already exists in compiled/', () => {
        const existingCompiledDir = path.join(
            tempRepoRoot,
            'compiled',
            'wiregrass-basin',
        )
        fs.mkdirSync(existingCompiledDir, { recursive: true })

        const res = assertSeriesNamespaceVacant(tempRepoRoot, 'wiregrass-basin')
        expect(res.isVacant).toBe(false)
        if (!res.isVacant) {
            const occ = res as SlugCollisionGuardOccupiedBit
            expect(occ.errorCode).toBe('CONFLICT_BLOCKED')
            expect(occ.collidedPaths).toContain(existingCompiledDir)
        }
    })

    it('dispatches checkSeriesSlugAvailabilityBuzz and returns val: 1 on vacancy', async () => {
        const model = new SeriesModel()
        const slvSpy = vi.fn()

        const bale = {
            idx: 'test-check-vacant',
            src: 'brand-new-universe',
            dat: { repoRoot: tempRepoRoot },
            slv: slvSpy,
        }

        await checkSeriesSlugAvailabilityBuzz(model, bale, {} as any)

        expect(slvSpy).toHaveBeenCalledTimes(1)
        const callbackArg = slvSpy.mock.calls[0][0]
        expect(callbackArg.seriesBit.val).toBe(1)
        expect(callbackArg.seriesBit.src).toBe('brand-new-universe')
        expect(callbackArg.seriesBit.dat.isVacant).toBe(true)
    })

    it('dispatches checkSeriesSlugAvailabilityBuzz and returns val: 0 with error details on collision', async () => {
        fs.mkdirSync(path.join(tempRepoRoot, 'series', 'collided-series'), {
            recursive: true,
        })

        const model = new SeriesModel()
        const slvSpy = vi.fn()

        const bale = {
            idx: 'test-check-collision',
            src: 'collided-series',
            dat: { repoRoot: tempRepoRoot },
            slv: slvSpy,
        }

        await checkSeriesSlugAvailabilityBuzz(model, bale, {} as any)

        expect(slvSpy).toHaveBeenCalledTimes(1)
        const callbackArg = slvSpy.mock.calls[0][0]
        expect(callbackArg.seriesBit.val).toBe(0)
        expect(callbackArg.seriesBit.src).toBe('collided-series')
        expect(callbackArg.seriesBit.dat.isVacant).toBe(false)
        expect(callbackArg.seriesBit.dat.errorCode).toBe('CONFLICT_BLOCKED')
    })
})
