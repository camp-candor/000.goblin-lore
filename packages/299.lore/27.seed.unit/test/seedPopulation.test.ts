import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { populateGenesisSeeds } from '../buz/populateGenesisSeeds.buzz.js'
import { verifyByteZeroBuffer } from '../buz/seedWorldDefinitions.buzz.js'
import { SeedModel } from '../seed.model.js'

describe('Task 4.3 Series Genesis Seed Population Gauntlet', () => {
    let tempRepoRoot: string
    const seriesSlug = 'test-seed-series'

    beforeEach(() => {
        tempRepoRoot = fs.mkdtempSync(
            path.join(os.tmpdir(), 'goblin-seed-test-'),
        )
        fs.mkdirSync(path.join(tempRepoRoot, 'series', seriesSlug), {
            recursive: true,
        })
    })

    afterEach(() => {
        if (fs.existsSync(tempRepoRoot)) {
            fs.rmSync(tempRepoRoot, { recursive: true, force: true })
        }
    })

    it('verifies byte-zero frontmatter buffer inspector rejects BOM and leading whitespace', () => {
        const validBuf = Buffer.from('---\nid: "test"\n---\n')
        expect(verifyByteZeroBuffer(validBuf)).toBe(true)

        const bomBuf = Buffer.concat([
            Buffer.from([0xef, 0xbb, 0xbf]),
            validBuf,
        ])
        expect(verifyByteZeroBuffer(bomBuf)).toBe(false)

        const leadingSpaceBuf = Buffer.from(' ---\nid: "test"\n---\n')
        expect(verifyByteZeroBuffer(leadingSpaceBuf)).toBe(false)

        const leadingNewlineBuf = Buffer.from('\n---\nid: "test"\n---\n')
        expect(verifyByteZeroBuffer(leadingNewlineBuf)).toBe(false)
    })

    it('populates world/conditions.md, world/economy.md, and locations/loc_origin_hub.md at Byte 0', async () => {
        const model = new SeedModel()
        let result: any = null

        const bal = {
            idx: 'test-seed',
            dat: {
                seriesSlug,
                repoRoot: tempRepoRoot,
            },
            slv: (res: any) => {
                result = res
            },
        }

        await populateGenesisSeeds(model, bal as any)

        expect(result).toBeDefined()
        expect(result.seedBit.val).toBe(1)
        expect(result.seedBit.dat.totalSeeded).toBe(4)

        const seriesDir = path.join(tempRepoRoot, 'series', seriesSlug)
        const conditionsPath = path.join(seriesDir, 'world', 'conditions.md')
        const economyPath = path.join(seriesDir, 'world', 'economy.md')
        const hubPath = path.join(seriesDir, 'locations', 'loc_origin_hub.md')

        expect(fs.existsSync(conditionsPath)).toBe(true)
        expect(fs.existsSync(economyPath)).toBe(true)
        expect(fs.existsSync(hubPath)).toBe(true)

        const condBytes = fs.readFileSync(conditionsPath)
        expect(condBytes[0]).toBe(0x2d) // '-'
        expect(condBytes[1]).toBe(0x2d) // '-'
        expect(condBytes[2]).toBe(0x2d) // '-'
        expect(condBytes[3]).toBe(0x0a) // '\n'

        const hubBytes = fs.readFileSync(hubPath)
        expect(hubBytes[0]).toBe(0x2d)
        expect(hubBytes[1]).toBe(0x2d)
        expect(hubBytes[2]).toBe(0x2d)
        expect(hubBytes[3]).toBe(0x0a)
    })

    it('fails closed when target series directory does not exist', async () => {
        const model = new SeedModel()
        let result: any = null

        const bal = {
            idx: 'test-seed-missing-dir',
            dat: {
                seriesSlug: 'non-existent-series',
                repoRoot: tempRepoRoot,
            },
            slv: (res: any) => {
                result = res
            },
        }

        await populateGenesisSeeds(model, bal as any)

        expect(result).toBeDefined()
        expect(result.seedBit.val).toBe(0)
        expect(result.seedBit.dat.error).toContain('SERIES_DIRECTORY_NOT_FOUND')
    })
})
