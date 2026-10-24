import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { promptSwitchSeries } from '../buz/promptSwitchSeries.buzz.js'
import { MenuModel } from '../menu.model.js'
import * as loreBuzz from '../../00.lore.unit/buz/lore.buzz.js'

describe('Phase 6 Switch Series Blessed Menu Prompt', () => {
    const testRoot = path.join(process.cwd(), '.tmp_test_switch_menu')

    beforeEach(() => {
        if (fs.existsSync(testRoot))
            fs.rmSync(testRoot, { recursive: true, force: true })
        vi.spyOn(loreBuzz, 'resolveRepoRoot').mockReturnValue(testRoot)

        const s1 = path.join(testRoot, 'series', 'wiregrass-basin')
        const s2 = path.join(testRoot, 'series', 'salt-flat-reach')
        fs.mkdirSync(s1, { recursive: true })
        fs.mkdirSync(s2, { recursive: true })

        fs.writeFileSync(
            path.join(s1, 'series.config.json'),
            '{"series_slug":"wiregrass-basin"}\n',
        )
        fs.writeFileSync(
            path.join(s2, 'series.config.json'),
            '{"series_slug":"salt-flat-reach"}\n',
        )

        ;(globalThis as any).LIBRARY = {
            hunt: vi.fn(),
        }
    })

    afterEach(() => {
        if (fs.existsSync(testRoot))
            fs.rmSync(testRoot, { recursive: true, force: true })
        vi.restoreAllMocks()
    })

    it('prompts user and dispatches SELECT_TARGET_SERIES upon selection', async () => {
        ;(globalThis as any).LIBRARY.hunt.mockImplementation(
            async (action: string) => {
                if (action.includes('Update Grid'))
                    return { grdBit: { dat: {} } }
                if (action.includes('Open Choice'))
                    return { chcBit: { src: 'wiregrass-basin' } }
                return {}
            },
        )

        const cpy = new MenuModel()
        let result: any = null
        const bal = {
            idx: 'test-menu',
            slv: (res: any) => {
                result = res
            },
        }

        const mockState = {
            hunt: vi.fn().mockResolvedValue({
                targetBit: { val: 1, dat: { seriesSlug: 'wiregrass-basin' } },
            }),
        }

        await promptSwitchSeries(cpy, bal, mockState as any)
        expect(mockState.hunt).toHaveBeenCalled()
        expect(result.mnuBit.val).toBe(1)
    })

    it('handles cancellation cleanly without triggering state mutation', async () => {
        ;(globalThis as any).LIBRARY.hunt.mockImplementation(
            async (action: string) => {
                if (action.includes('Update Grid'))
                    return { grdBit: { dat: {} } }
                if (action.includes('Open Choice'))
                    return { chcBit: { src: '[<] CANCEL' } }
                return {}
            },
        )

        const cpy = new MenuModel()
        let result: any = null
        const bal = {
            idx: 'test-menu',
            slv: (res: any) => {
                result = res
            },
        }

        const mockState = { hunt: vi.fn() }
        await promptSwitchSeries(cpy, bal, mockState as any)
        expect(mockState.hunt).not.toHaveBeenCalled()
        expect(result.mnuBit.val).toBe(0)
        expect(result.mnuBit.dat.cancelled).toBe(true)
    })
})
