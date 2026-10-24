import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { stageEntityScratchpad } from '../buz/stageEntityScratchpad.buzz.js'
import { verifyScratchpadSave } from '../../41.canon.unit/buz/verifyScratchpadSave.buzz.js'
import { threeStrikeSaveGate } from '../buz/threeStrikeSaveGate.buzz.js'
import { EntityModel } from '../entity.model.js'
import * as loreBuzz from '../../00.lore.unit/buz/lore.buzz.js'
import * as editorBuzz from '../../98.menu.unit/buz/suspendCursesEditor.buzz.js'

describe('Phase 7 Human Save Gate & Three-Strike Circuit Breaker', () => {
    const testRoot = path.join(process.cwd(), '.tmp_test_human_gate')
    const seriesSlug = 'wiregrass-basin'

    beforeEach(() => {
        if (fs.existsSync(testRoot))
            fs.rmSync(testRoot, { recursive: true, force: true })
        vi.spyOn(loreBuzz, 'resolveRepoRoot').mockReturnValue(testRoot)

        const seriesDir = path.join(testRoot, 'series', seriesSlug)
        fs.mkdirSync(path.join(seriesDir, 'characters'), { recursive: true })
        fs.mkdirSync(path.join(seriesDir, 'possessions'), { recursive: true })
        fs.mkdirSync(path.join(seriesDir, 'locations'), { recursive: true })
        fs.mkdirSync(path.join(seriesDir, 'grievances'), { recursive: true })
        fs.mkdirSync(path.join(testRoot, 'compiled', seriesSlug), {
            recursive: true,
        })

        fs.writeFileSync(
            path.join(seriesDir, 'series.config.json'),
            JSON.stringify({
                series_slug: seriesSlug,
                genre_tag: 'SOUTHERN_GOTHIC_INDUSTRIAL',
            }) + '\n',
        )
    })

    afterEach(() => {
        if (fs.existsSync(testRoot))
            fs.rmSync(testRoot, { recursive: true, force: true })
        vi.restoreAllMocks()
    })

    it('stageEntityScratchpad: creates Byte-0 isolated .tmp scratchpad with Voice Rail stubs', () => {
        const desc = stageEntityScratchpad({
            seriesSlug,
            domain: 'characters',
            entityId: 'char_spleen',
        })

        expect(fs.existsSync(desc.tmpFilePath)).toBe(true)
        expect(fs.existsSync(desc.canonicalFilePath)).toBe(false)

        const rawBytes = fs.readFileSync(desc.tmpFilePath)
        expect(rawBytes[0]).toBe(0x2d)
        expect(rawBytes[1]).toBe(0x2d)
        expect(rawBytes[2]).toBe(0x2d)

        const content = rawBytes.toString('utf-8')
        expect(content).toContain('## Wants (surface)')
        expect(content).toContain('## Wants (actual)')
        expect(content).toContain('## Blind spot')
    })

    it('verifyScratchpadSave: fails closed if Byte-0 is violated', () => {
        const desc = stageEntityScratchpad({
            seriesSlug,
            domain: 'characters',
            entityId: 'char_bog',
        })

        fs.writeFileSync(desc.tmpFilePath, ' \n---\nid: "char_bog"\n---\n')
        const res = verifyScratchpadSave(desc.tmpFilePath, 'characters')
        expect(res.passed).toBe(false)
        expect(res.error).toContain('BYTE_ZERO_BREACH')
    })

    it('threeStrikeSaveGate: trips circuit breaker after 3 failed verification strikes', async () => {
        // Mock editor to leave an invalid Byte-0 file
        vi.spyOn(editorBuzz, 'suspendCursesAndSpawnEditor').mockImplementation(
            async (filePath: string) => {
                fs.writeFileSync(filePath, 'INVALID_NO_FRONTMATTER')
                return { success: true, exitCode: 0, headlessBypass: true }
            },
        )

        const model = new EntityModel()
        let result: any = null
        const bal = {
            idx: 'test-gate',
            src: seriesSlug,
            dat: {
                entityId: 'char_wart',
                domain: 'characters' as const,
            },
            slv: (res: any) => {
                result = res
            },
        }

        await threeStrikeSaveGate(model, bal as any, {} as any)

        expect(result.entityBit.val).toBe(0)
        expect(result.entityBit.dat.result.trippedCircuitBreaker).toBe(true)
        expect(result.entityBit.dat.result.attempts).toBe(3)

        // Canonical file must NOT have been created
        const canonical = path.join(
            testRoot,
            'series',
            seriesSlug,
            'characters',
            'char_wart.md',
        )
        expect(fs.existsSync(canonical)).toBe(false)
    })

    it('threeStrikeSaveGate: promotes scratchpad on successful edit', async () => {
        // Mock editor to write a valid Byte-0 character
        vi.spyOn(editorBuzz, 'suspendCursesAndSpawnEditor').mockImplementation(
            async (filePath: string) => {
                fs.writeFileSync(
                    filePath,
                    '---\nid: "char_wart"\nname: "Wart"\nsomatic:\n  available_arms_bps: 20000\n---\n\n## Wants (surface)\nTo rest.\n',
                )
                return { success: true, exitCode: 0, headlessBypass: true }
            },
        )

        const model = new EntityModel()
        let result: any = null
        const bal = {
            idx: 'test-gate-pass',
            src: seriesSlug,
            dat: {
                entityId: 'char_wart',
                domain: 'characters' as const,
            },
            slv: (res: any) => {
                result = res
            },
        }

        await threeStrikeSaveGate(model, bal as any, {} as any)

        expect(result.entityBit.val).toBe(1)
        expect(result.entityBit.dat.result.success).toBe(true)

        const canonical = path.join(
            testRoot,
            'series',
            seriesSlug,
            'characters',
            'char_wart.md',
        )
        expect(fs.existsSync(canonical)).toBe(true)
    })
})
