/**
 * packages/299.lore/02.character.unit/test/characterScaffold.test.ts
 * Vitest verification battery for Interactive Character Scaffolding Interview.
 */
import * as fs from 'node:fs'
import * as path from 'node:path'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { CharacterModel } from '../character.model.js'
import * as ActChr from '../character.action.js'
import { reducer } from '../character.reduce.js'
import {
    evaluateHandCapacitySAT,
    renderCharacterDossierMarkdown,
    writeCharacterDossierAtomic,
    LOCOMOTION_PROFILES,
    TRAUMA_CONDITIONS,
} from '../buz/characterScaffold.buzz.js'

describe('Interactive Character Scaffolding Interview (02.character.unit)', () => {
    const tmpTestDir = path.join(process.cwd(), '.tmp_test_character_scaffold')

    afterEach(() => {
        if (fs.existsSync(tmpTestDir)) {
            fs.rmSync(tmpTestDir, { recursive: true, force: true })
        }
    })

    it('P0.1: evaluates Hand Capacity SAT: approves <= available arms and rejects overload', () => {
        // 2 arms available (20,000 bps) holding 2 one-handed items (10,000 + 10,000 bps)
        const validSat = evaluateHandCapacitySAT([10000, 10000], 20000)
        expect(validSat.passed).toBe(true)
        expect(validSat.demandedBps).toBe(20000)

        // 1 arm available (10,000 bps) holding 2 items (20,000 bps) -> MUST FAIL
        const invalidSat = evaluateHandCapacitySAT([10000, 10000], 10000)
        expect(invalidSat.passed).toBe(false)
        expect(invalidSat.demandedBps).toBe(20000)
        expect(invalidSat.availableBps).toBe(10000)
    })

    it('P0.2: formats dossier string strictly beginning with --- at Byte 0', () => {
        const md = renderCharacterDossierMarkdown({
            id: 'char_spleen',
            name: 'Spleen',
            locomotionBaseline: LOCOMOTION_PROFILES.limping.baseline,
            bannedVerbs: LOCOMOTION_PROFILES.limping.bannedVerbs,
            conditions: ['BRACHIAL_PLEXUS_RIGHT'],
            availableArmsBps: 10000,
            heldItems: ['item_pipe_knife'],
            escalationCeiling: 3,
            stringsHeldOver: ['char_bog'],
        })

        const buf = Buffer.from(md, 'utf8')
        expect(buf[0]).toBe(0x2d) // '-'
        expect(buf[1]).toBe(0x2d) // '-'
        expect(buf[2]).toBe(0x2d) // '-'
        expect(buf[3]).toBe(0x0a) // '\n'
        expect(md.includes('id: char_spleen')).toBe(true)
        expect(md.includes('## Wants (surface)')).toBe(true)
        expect(md.includes('## Wants (actual)')).toBe(true)
        expect(md.includes('## Blind spot')).toBe(true)
    })

    it('P0.3: executes atomic POSIX file persistence and enforces Byte 0 invariant', () => {
        const targetFile = path.join(tmpTestDir, 'char_test.md')
        const content = renderCharacterDossierMarkdown({
            id: 'char_test',
            name: 'Test Actor',
            locomotionBaseline: 'bipedal_standard',
            bannedVerbs: [],
            conditions: [],
            availableArmsBps: 20000,
            heldItems: [],
            escalationCeiling: 2,
            stringsHeldOver: [],
        })

        writeCharacterDossierAtomic(targetFile, content)

        expect(fs.existsSync(targetFile)).toBe(true)
        const readBuf = fs.readFileSync(targetFile)
        expect(readBuf[0]).toBe(0x2d)
        expect(readBuf[1]).toBe(0x2d)
        expect(readBuf[2]).toBe(0x2d)
    })

    it('P0.4: routes SCAFFOLD_CHARACTER_WIZARD through reducer with state bus mocks', async () => {
        const model = new CharacterModel()
        const calls: Array<{ action: string; payload: any }> = []

        const mockState: any = {
            hunt: vi.fn(async (action: string, payload: any) => {
                calls.push({ action, payload })
                return {}
            }),
        }

        let resolvedResult: any = null
        const action = new ActChr.ScaffoldCharacterWizard({
            idx: 'test-wizard',
            dat: {
                seriesSlug: 'test-series',
                charId: 'char_unit_test',
                name: 'Unit Tester',
                locomotionBaseline: 'bipedal_hunched',
                traumaCondition: 'NONE',
                heldItemIds: ['item_wrench'],
                escalationCeiling: 4,
                stringsHeldOver: [],
            },
            slv: (res) => {
                resolvedResult = res
            },
        })

        await reducer(model, action, mockState)

        expect(resolvedResult).toBeDefined()
        expect(resolvedResult.success).toBe(true)
        expect(resolvedResult.charId).toBe('char_unit_test')

        const consoleCalls = calls.filter(
            (c) => c.action === '[Console action] Update Console',
        )
        expect(consoleCalls.length).toBeGreaterThan(0)
        const satPassCall = consoleCalls.find((c) =>
            c.payload?.src?.includes('Hand Capacity Invariant Satisfied'),
        )
        expect(satPassCall).toBeDefined()

        // Clean up created file in series/test-series if written
        if (resolvedResult.filePath && fs.existsSync(resolvedResult.filePath)) {
            fs.unlinkSync(resolvedResult.filePath)
            const parentDir = path.dirname(resolvedResult.filePath)
            if (fs.existsSync(parentDir)) fs.rmdirSync(parentDir)
        }
    })
})
