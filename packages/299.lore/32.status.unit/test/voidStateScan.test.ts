import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { scanVoidState } from '../buz/voidStateScan.buzz.js'
import { StatusModel } from '../status.model.js'
import { reducer } from '../status.reduce.js'
import * as Act from '../status.action.js'

describe('32.status.unit - scanVoidState & voidStateScan', () => {
    let tmpDir: string

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lore-void-test-'))
    })

    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true })
    })

    it('reports isVoidState: true when series directory does not exist', () => {
        const res = scanVoidState(tmpDir)
        expect(res.isVoidState).toBe(true)
        expect(res.discoveredSlugs).toEqual([])
    })

    it('reports isVoidState: true when series directory is empty', () => {
        fs.mkdirSync(path.join(tmpDir, 'series'))
        const res = scanVoidState(tmpDir)
        expect(res.isVoidState).toBe(true)
        expect(res.discoveredSlugs).toEqual([])
    })

    it('ignores subdirectories missing series.config.json', () => {
        fs.mkdirSync(path.join(tmpDir, 'series', 'corrupted-series'), {
            recursive: true,
        })
        const res = scanVoidState(tmpDir)
        expect(res.isVoidState).toBe(true)
        expect(res.discoveredSlugs).toEqual([])
    })

    it('ignores subdirectories with corrupted JSON in series.config.json', () => {
        const seriesDir = path.join(tmpDir, 'series', 'broken-series')
        fs.mkdirSync(seriesDir, { recursive: true })
        fs.writeFileSync(
            path.join(seriesDir, 'series.config.json'),
            '{ invalid json',
        )
        const res = scanVoidState(tmpDir)
        expect(res.isVoidState).toBe(true)
        expect(res.discoveredSlugs).toEqual([])
    })

    it('discovers valid series with parseable series.config.json', () => {
        const validDir = path.join(tmpDir, 'series', 'wiregrass-basin')
        fs.mkdirSync(validDir, { recursive: true })
        fs.writeFileSync(
            path.join(validDir, 'series.config.json'),
            JSON.stringify({
                series_slug: 'wiregrass-basin',
                title: 'Wiregrass Basin',
            }),
        )

        const res = scanVoidState(tmpDir)
        expect(res.isVoidState).toBe(false)
        expect(res.discoveredSlugs).toEqual(['wiregrass-basin'])
    })

    it('updates StatusModel state through reducer dispatch', async () => {
        const validDir = path.join(tmpDir, 'series', 'under-the-floorboards')
        fs.mkdirSync(validDir, { recursive: true })
        fs.writeFileSync(
            path.join(validDir, 'series.config.json'),
            JSON.stringify({ series_slug: 'under-the-floorboards' }),
        )

        const initialModel = new StatusModel()
        expect(initialModel.isVoidState).toBe(true)
        expect(initialModel.dispatchLockEngaged).toBe(true)

        let callbackPayload: any = null
        const action = new Act.EvaluateVoidState({
            idx: 'test-eval',
            src: tmpDir,
            slv: (res: any) => {
                callbackPayload = res
            },
        })

        const updatedModel = await reducer(initialModel, action)
        expect(updatedModel.isVoidState).toBe(false)
        expect(updatedModel.dispatchLockEngaged).toBe(false)
        expect(updatedModel.discoveredSlugs).toEqual(['under-the-floorboards'])
        expect(callbackPayload?.statusBit?.val).toBe(0)
        expect(callbackPayload?.statusBit?.dat?.isVoidState).toBe(false)
    })
})
