import { describe, it, expect, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { injectCustomSeedIdentifiers } from '../buz/customSeed.buzz.js'
import { SeedModel } from '../seed.model.js'

describe('299.lore - [Feature 1.5] Custom Starter Seed Identifier Injection', () => {
    let tempRepoRoot: string

    afterEach(() => {
        if (tempRepoRoot && fs.existsSync(tempRepoRoot)) {
            fs.rmSync(tempRepoRoot, { recursive: true, force: true })
        }
    })

    it('injects Gotham-specific custom starter seed IDs while maintaining Byte-0 frontmatter', async () => {
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
    })
})
