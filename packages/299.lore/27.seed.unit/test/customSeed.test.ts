import { describe, it, expect, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { injectCustomSeedIdentifiers } from '../buz/customSeed.buzz.js'
import { SeedModel } from '../seed.model.js'
import { promptCustomSeedMenu } from '../../98.menu.unit/buz/customSeedMenu.buzz.js'
import { MenuModel } from '../../98.menu.unit/menu.model.js'

describe('299.lore - [Feature 1.5] Custom Starter Seed Identifier Injection', () => {
    let tempRepoRoot: string

    afterEach(() => {
        delete (globalThis as any).LIBRARY
        delete (global as any).LIBRARY
        if (tempRepoRoot && fs.existsSync(tempRepoRoot)) {
            fs.rmSync(tempRepoRoot, { recursive: true, force: true })
        }
    })

    it('injects Gotham-specific custom starter seed IDs with reciprocal FKs and Byte-0 frontmatter', async () => {
        tempRepoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'custom-seed-'))
        const seriesSlug = 'gotham-trinity-crisis'

        const model = new SeedModel()
        let resolved: any = null

        const bal: any = {
            idx: 'test-custom-seed',
            src: seriesSlug,
            dat: {
                seriesSlug,
                repoRoot: tempRepoRoot,
                customIdentifiers: {
                    characterId: 'char_wonder_woman',
                    locationId: 'loc_gotham_rooftop',
                    possessionId: 'item_lasso_of_truth',
                    grievanceId: 'grv_gotham_standoff',
                },
            },
            slv: (res: any) => {
                resolved = res
            },
        }

        await injectCustomSeedIdentifiers(model, bal)

        expect(resolved?.seedBit?.val).toBe(1)
        expect(resolved?.seedBit?.dat?.totalInjected).toBe(4)
        expect(resolved?.seedBit?.dat?.byteZeroVerified).toBe(true)

        const charFile = path.join(
            tempRepoRoot,
            'series',
            seriesSlug,
            'characters',
            'char_wonder_woman.md',
        )
        const locFile = path.join(
            tempRepoRoot,
            'series',
            seriesSlug,
            'locations',
            'loc_gotham_rooftop.md',
        )
        const itemFile = path.join(
            tempRepoRoot,
            'series',
            seriesSlug,
            'possessions',
            'item_lasso_of_truth.md',
        )
        const grvFile = path.join(
            tempRepoRoot,
            'series',
            seriesSlug,
            'grievances',
            'grv_gotham_standoff.md',
        )

        expect(fs.existsSync(charFile)).toBe(true)
        expect(fs.existsSync(locFile)).toBe(true)
        expect(fs.existsSync(itemFile)).toBe(true)
        expect(fs.existsSync(grvFile)).toBe(true)

        const charBuf = fs.readFileSync(charFile)
        expect(charBuf[0]).toBe(0x2d)
        expect(charBuf[1]).toBe(0x2d)
        expect(charBuf[2]).toBe(0x2d)
        expect(charBuf[3]).toBe(0x0a)

        const charText = charBuf.toString('utf8')
        const itemText = fs.readFileSync(itemFile, 'utf8')
        const grvText = fs.readFileSync(grvFile, 'utf8')

        expect(charText).toContain('held_primary: "item_lasso_of_truth"')
        expect(charText).toContain('available_arms_bps: 20000')
        expect(itemText).toContain('custody_holder: "char_wonder_woman"')
        expect(itemText).toContain('hands_required_bps: 10000')
        expect(grvText).toContain('participants_primary: ["char_wonder_woman"]')
        expect(grvText).toContain('location_anchor: "loc_gotham_rooftop"')
        expect(grvText).toContain('physical_anchor_prop: "item_lasso_of_truth"')
        expect(grvText).toContain('intensity_bounds_bps: [3000, 9000]')
    })

    it('[Level 2 Trap] fails closed with MISSING_SERIES_SLUG and zero disk writes', async () => {
        tempRepoRoot = fs.mkdtempSync(
            path.join(os.tmpdir(), 'custom-seed-missing-'),
        )
        let resolved: any = null

        await injectCustomSeedIdentifiers(new SeedModel(), {
            idx: 'test-missing-slug',
            dat: { seriesSlug: '', repoRoot: tempRepoRoot },
            slv: (res: any) => {
                resolved = res
            },
        })

        expect(resolved?.seedBit?.val).toBe(0)
        expect(resolved?.seedBit?.dat?.error).toBe('MISSING_SERIES_SLUG')
        expect(fs.existsSync(path.join(tempRepoRoot, 'series'))).toBe(false)
    })

    it('[Level 2 Trap] falls back deterministically to default identifiers on empty customIdentifiers', async () => {
        tempRepoRoot = fs.mkdtempSync(
            path.join(os.tmpdir(), 'custom-seed-fallback-'),
        )
        let resolved: any = null

        await injectCustomSeedIdentifiers(new SeedModel(), {
            idx: 'test-fallback-ids',
            src: 'fallback-series',
            dat: {
                seriesSlug: 'fallback-series',
                repoRoot: tempRepoRoot,
                customIdentifiers: {},
            },
            slv: (res: any) => {
                resolved = res
            },
        })

        expect(resolved?.seedBit?.val).toBe(1)
        expect(resolved?.seedBit?.dat?.totalInjected).toBe(4)
        expect(resolved?.seedBit?.dat?.byteZeroVerified).toBe(true)
        expect(resolved?.seedBit?.dat?.injectedIds).toEqual({
            characterId: 'char_wonder_woman',
            locationId: 'loc_gotham_rooftop',
            possessionId: 'item_lasso_of_truth',
            grievanceId: 'grv_gotham_standoff',
        })
    })

    it('[Level 2 Trap] promptCustomSeedMenu aborts cleanly on Escape (val=-1) and resolves headless', async () => {
        tempRepoRoot = fs.mkdtempSync(
            path.join(os.tmpdir(), 'custom-seed-menu-'),
        )

        ;(globalThis as any).LIBRARY = {
            hunt: async (action: string) => {
                if (action === '[Grid action] Update Grid') {
                    return {
                        grdBit: {
                            dat: {
                                left: '0%',
                                top: '33%',
                                width: '33%',
                                height: '33%',
                            },
                        },
                    }
                }
                if (action === '[Open action] Open Input') {
                    return { putBit: { src: '', val: -1 } }
                }
                return {}
            },
        }

        let cancelledRes: any = null
        await promptCustomSeedMenu(new MenuModel(), {
            idx: 'test-cancel-custom-seed',
            src: 'abort-series',
            dat: { seriesSlug: 'abort-series', repoRoot: tempRepoRoot },
            slv: (res: any) => {
                cancelledRes = res
            },
        })

        expect(cancelledRes?.mnuBit?.val).toBe(0)
        expect(cancelledRes?.mnuBit?.dat?.cancelled).toBe(true)
        expect(fs.existsSync(path.join(tempRepoRoot, 'series'))).toBe(false)

        delete (globalThis as any).LIBRARY
        delete (global as any).LIBRARY

        let headlessRes: any = null
        await promptCustomSeedMenu(new MenuModel(), {
            idx: 'test-headless-custom-seed',
            src: 'headless-series',
            dat: { seriesSlug: 'headless-series', repoRoot: tempRepoRoot },
            slv: (res: any) => {
                headlessRes = res
            },
        })

        expect(headlessRes?.mnuBit?.val).toBe(1)
        expect(headlessRes?.mnuBit?.dat?.totalInjected).toBe(4)
        expect(headlessRes?.mnuBit?.dat?.byteZeroVerified).toBe(true)
    })
})
