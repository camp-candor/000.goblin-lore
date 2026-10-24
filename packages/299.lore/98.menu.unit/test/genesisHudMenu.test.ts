import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { inspectGenesisHudStatus } from '../buz/genesisHudMenu.buzz.js'
import { MenuModel } from '../menu.model.js'
import { reducer } from '../menu.reduce.js'
import * as Act from '../act/menu.action.js'

describe('98.menu.unit - inspectGenesisHudStatus', () => {
    let tmpDir: string

    beforeEach(() => {
        delete (globalThis as any).LIBRARY
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hud-menu-test-'))
    })

    afterEach(() => {
        delete (globalThis as any).LIBRARY
        fs.rmSync(tmpDir, { recursive: true, force: true })
    })

    it('audits void state when series directory contains zero storyworlds', async () => {
        const initialModel = new MenuModel()
        let callbackPayload: any = null

        const action = new Act.InspectHudStatus({
            idx: 'test-hud-audit',
            src: tmpDir,
            slv: (res: any) => {
                callbackPayload = res
            },
        })

        const updatedModel = await reducer(initialModel, action)

        expect(updatedModel.lastSelection).toBe('INSPECT HUD STATUS')
        expect(callbackPayload?.mnuBit?.val).toBe(1)
        expect(callbackPayload?.mnuBit?.dat?.isVoidState).toBe(true)
        expect(callbackPayload?.mnuBit?.dat?.dispatchLockEngaged).toBe(true)
        expect(callbackPayload?.mnuBit?.dat?.discoveredSlugs).toEqual([])
    })

    it('audits ready state when valid series exists on disk', async () => {
        const seriesDir = path.join(tmpDir, 'series', 'wiregrass-basin')
        fs.mkdirSync(seriesDir, { recursive: true })
        fs.writeFileSync(
            path.join(seriesDir, 'series.config.json'),
            JSON.stringify({ series_slug: 'wiregrass-basin' }),
        )

        const initialModel = new MenuModel()
        let callbackPayload: any = null

        const action = new Act.InspectHudStatus({
            idx: 'test-hud-ready',
            src: tmpDir,
            slv: (res: any) => {
                callbackPayload = res
            },
        })

        const updatedModel = await reducer(initialModel, action)

        expect(callbackPayload?.mnuBit?.val).toBe(0)
        expect(callbackPayload?.mnuBit?.dat?.isVoidState).toBe(false)
        expect(callbackPayload?.mnuBit?.dat?.discoveredSlugs).toEqual([
            'wiregrass-basin',
        ])
    })

    it('dispatches console telemetry via global.LIBRARY.hunt when curses host is present', async () => {
        const mockHunt = vi.fn().mockResolvedValue({ cnsBit: { val: 1 } })
        ;(globalThis as any).LIBRARY = { hunt: mockHunt }

        const initialModel = new MenuModel()
        const action = new Act.InspectHudStatus({
            idx: 'test-with-library',
            src: tmpDir,
        })

        await reducer(initialModel, action)

        expect(mockHunt).toHaveBeenCalled()
        expect(mockHunt).toHaveBeenCalledWith(
            '[Console action] Update Console',
            expect.objectContaining({
                idx: 'cns00',
                src: expect.stringContaining(
                    'LORE ENGINE STATUS & TELEMETRY AUDIT',
                ),
            }),
        )
    })
})
