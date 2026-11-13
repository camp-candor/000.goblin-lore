import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { scanVoidState, voidStateScan } from '../buz/voidStateScan.buzz.js'
import { StatusModel } from '../status.model.js'

describe('32.status.unit :: Void-State Filesystem Scanner', () => {
    let testRoot: string

    beforeEach(() => {
        testRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'goblin-void-scan-'))
    })

    afterEach(() => {
        if (fs.existsSync(testRoot)) {
            fs.rmSync(testRoot, { recursive: true, force: true })
        }
    })

    it('resolves isVoidState: true when series/ directory does not exist', () => {
        const res = scanVoidState(testRoot)
        expect(res.isVoidState).toBe(true)
        expect(res.discoveredSlugs).toEqual([])
    })

    it('resolves isVoidState: true when series/ directory is empty', () => {
        fs.mkdirSync(path.join(testRoot, 'series'))
        const res = scanVoidState(testRoot)
        expect(res.isVoidState).toBe(true)
        expect(res.discoveredSlugs).toEqual([])
    })

    it('ignores subdirectories lacking series.config.json or holding corrupted JSON', () => {
        const seriesDir = path.join(testRoot, 'series')
        fs.mkdirSync(path.join(seriesDir, 'missing-config'), {
            recursive: true,
        })

        const brokenDir = path.join(seriesDir, 'broken-config')
        fs.mkdirSync(brokenDir, { recursive: true })
        fs.writeFileSync(
            path.join(brokenDir, 'series.config.json'),
            '{ broken json',
            'utf8',
        )

        const emptyDir = path.join(seriesDir, 'empty-config')
        fs.mkdirSync(emptyDir, { recursive: true })
        fs.writeFileSync(
            path.join(emptyDir, 'series.config.json'),
            '   ',
            'utf8',
        )

        const res = scanVoidState(testRoot)
        expect(res.isVoidState).toBe(true)
        expect(res.discoveredSlugs).toEqual([])
    })

    it('resolves isVoidState: false and mutates StatusModel when valid series exist', async () => {
        const validDir = path.join(testRoot, 'series', 'wiregrass-basin')
        fs.mkdirSync(validDir, { recursive: true })
        fs.writeFileSync(
            path.join(validDir, 'series.config.json'),
            JSON.stringify({
                series_slug: 'wiregrass-basin',
                title: 'Wiregrass Basin',
            }),
            'utf8',
        )

        const model = new StatusModel()
        let callbackData: any = null

        await voidStateScan(model, {
            idx: 'test-void-scan',
            src: testRoot,
            slv: (res: any) => {
                callbackData = res.statusBit
            },
        })

        expect(model.isVoidState).toBe(false)
        expect(model.dispatchLockEngaged).toBe(false)
        expect(model.activeBorderColor).toBe('green')
        expect(model.discoveredSlugs).toEqual(['wiregrass-basin'])
        expect(callbackData.val).toBe(0)
        expect(callbackData.dat.discoveredSlugs).toEqual(['wiregrass-basin'])
    })
})
