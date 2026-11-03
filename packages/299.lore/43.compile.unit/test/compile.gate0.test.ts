import { describe, it, expect, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { CompileModel } from '../compile.model'
import { reducer } from '../compile.reduce'
import * as ActCmp from '../compile.action'
import {
    parseByte0Markdown,
    jcsSerialize,
    deepFreeze,
    auditLevel0,
    scaleBasisPoints,
    auditStylometrics,
} from '../buz/compile.buzz'
import type CompileBit from '../fce/compile.bit'
import State from '../../99.core/state'

const tempDirs: string[] = []

function makeScratchDir(prefix: string): string {
    const dir = fs.mkdtempSync(
        path.join(os.tmpdir(), `goblin-gate0-${prefix}-`),
    )
    tempDirs.push(dir)
    return dir
}

afterEach(() => {
    while (tempDirs.length > 0) {
        const d = tempDirs.pop()
        if (d && fs.existsSync(d)) {
            fs.rmSync(d, { recursive: true, force: true })
        }
    }
})

describe('Gate 0 Verification Gauntlet & 3-Pass Compiler (43.compile.unit)', () => {
    it('Level 0: verifies runner immutability boundary, cleanroom artifact check, and 7-bit ASCII diff', () => {
        const l0 = auditLevel0()
        expect(l0.runnerImmutable).toBe(true)
        expect(l0.cleanroomVerified).toBe(true)
        expect(l0.asciiDiffClean).toBe(true)
        expect(l0.passed).toBe(true)
        expect(l0.errors).toEqual([])
    })

    it('Level 0 Negative Control: catches leaked .js / .d.ts / .tsbuildinfo artifacts outside dist/', () => {
        const scratch = makeScratchDir('cleanroom')
        const pkgDir = path.join(
            scratch,
            'packages',
            '299.lore',
            '43.compile.unit',
        )
        fs.mkdirSync(pkgDir, { recursive: true })
        fs.writeFileSync(
            path.join(pkgDir, 'leaked.js'),
            'console.log("leak");\n',
            'utf8',
        )

        const l0 = auditLevel0(scratch)
        expect(l0.cleanroomVerified).toBe(false)
        expect(l0.passed).toBe(false)
        expect(
            l0.errors.some((e) => e.includes('[LEVEL0_CLEANROOM_LEAK]')),
        ).toBe(true)
    })

    it('Pass 1 Negative Controls: rejects 0-byte files, Git LFS pointer stubs, missing byte-0 ---, and non-7-bit ASCII', () => {
        const scratch = makeScratchDir('pass1-neg')

        // 1. 0-byte empty file
        const emptyFile = path.join(scratch, 'empty.md')
        fs.writeFileSync(emptyFile, '')
        const resEmpty = parseByte0Markdown(emptyFile)
        expect(resEmpty.ok).toBe(false)
        expect(resEmpty.error).toContain('[EMPTY_STREAM_ABORT]')

        // 1b. Unhydrated Git LFS pointer stub
        const lfsFile = path.join(scratch, 'lfs_pointer.md')
        fs.writeFileSync(
            lfsFile,
            'version https://git-lfs.github.com/spec/v1\noid sha256:4d7a214614ab2935c943f9e0ff69d22eadbb8f32b1258daaa5e2ca24d17e2393\nsize 12345\n',
            'utf8',
        )
        const resLfs = parseByte0Markdown(lfsFile)
        expect(resLfs.ok).toBe(false)
        expect(resLfs.error).toContain('[LFS_POINTER_TRAP]')

        // 2. Leading whitespace before --- (Byte-0 violation)
        const leadingSpaceFile = path.join(scratch, 'leading.md')
        fs.writeFileSync(
            leadingSpaceFile,
            ' \n---\nid: char_test\n---\nBody text.\n',
            'utf8',
        )
        const resLeading = parseByte0Markdown(leadingSpaceFile)
        expect(resLeading.ok).toBe(false)
        expect(resLeading.byte0Ok).toBe(false)
        expect(resLeading.error).toContain('[BYTE_0_VIOLATION]')

        // 3. Non-7-bit ASCII byte (0xE2 smart quote / high byte)
        const nonAsciiFile = path.join(scratch, 'non_ascii.md')
        const buf = Buffer.concat([
            Buffer.from('---\nid: char_test\n---\nHello ', 'utf8'),
            Buffer.from([0xe2, 0x80, 0x99]),
            Buffer.from('\n', 'utf8'),
        ])
        fs.writeFileSync(nonAsciiFile, buf)
        const resAscii = parseByte0Markdown(nonAsciiFile)
        expect(resAscii.ok).toBe(false)
        expect(resAscii.asciiOk).toBe(false)
        expect(resAscii.error).toContain('[ASCII_VIOLATION]')
    })

    it('Pass 1 Negative Controls: rejects IEEE-754 floats, basis-point overflows, inverted intensity envelopes, somatic SAT collisions, duplicate IDs, and kinetic mask contradictions', () => {
        const scratch = makeScratchDir('pass1-schema')
        fs.writeFileSync(
            path.join(scratch, 'bad_char.md'),
            [
                '---',
                'id: char_overloaded',
                'entity_type: character',
                'paranoia: 15000',
                'trust: 42.5',
                'available_arms: 1',
                'locomotion_tier: IMMOBILE',
                'banned_kinetic_verbs: [climb]',
                'baseline_actions: [sprint, climb]',
                'held_items:',
                '  - item_a',
                '  - item_b',
                '---',
                'Overloaded character with float, bp overflow, and kinetic mask contradiction.',
            ].join('\n') + '\n',
            'utf8',
        )
        fs.writeFileSync(
            path.join(scratch, 'dup_char.md'),
            [
                '---',
                'id: char_overloaded',
                'entity_type: character',
                '---',
                'Duplicate character slug.',
            ].join('\n') + '\n',
            'utf8',
        )
        fs.writeFileSync(
            path.join(scratch, 'bad_grv.md'),
            [
                '---',
                'id: grv_inverted',
                'entity_type: grievance',
                'min_intensity: 5',
                'max_intensity: 2',
                '---',
                'Inverted grievance envelope.',
            ].join('\n') + '\n',
            'utf8',
        )

        let captured: CompileBit | undefined
        const model = new CompileModel()
        const next = reducer(
            model,
            new ActCmp.Pass1Evaluate({
                idx: 'test-p1',
                src: scratch,
                slv: (res: { cmpBit: CompileBit }) => {
                    captured = res.cmpBit
                },
            }),
        )

        expect(next.status).toBe('FAILED')
        expect(captured?.val).toBe(0)
        const errs = captured?.validationReport?.errors || []
        expect(errs.some((e) => e.includes('[BASIS_POINT_OVERFLOW]'))).toBe(
            true,
        )
        expect(errs.some((e) => e.includes('[FLOAT_PROHIBITED]'))).toBe(true)
        expect(errs.some((e) => e.includes('[SOMATIC_SAT_COLLISION]'))).toBe(
            true,
        )
        expect(
            errs.some((e) => e.includes('[KINETIC_MASK_CONTRADICTION]')),
        ).toBe(true)
        expect(errs.some((e) => e.includes('[DUPLICATE_ENTITY_ID]'))).toBe(true)
        expect(
            errs.some((e) => e.includes('[INTENSITY_ENVELOPE_INVERTED]')),
        ).toBe(true)
    })

    it("Banker's Rounding (scaleBasisPoints): resolves 5000 remainder ties to nearest even integer", () => {
        // 15000 / 10000 = 1.5 -> rounds to even 2
        expect(scaleBasisPoints(3, 5000)).toBe(2)
        // 25000 / 10000 = 2.5 -> rounds to even 2
        expect(scaleBasisPoints(5, 5000)).toBe(2)
        // 35000 / 10000 = 3.5 -> rounds to even 4
        expect(scaleBasisPoints(7, 5000)).toBe(4)
        // Non-tie standard rounding
        expect(scaleBasisPoints(100, 3333)).toBe(33)
        expect(scaleBasisPoints(100, 6667)).toBe(67)
        // Rejects floats
        expect(() => scaleBasisPoints(1.5, 5000)).toThrow('[FLOAT_PROHIBITED]')
    })

    it('Pass 2 Negative Controls: detects 3-color DFS cycles, asymmetric portals, acoustic attenuation violations, dangling FKs, and clue-lemma collisions', () => {
        const scratch = makeScratchDir('pass2-neg')

        // Cyclic grievances: grv_a -> grv_b -> grv_a
        fs.writeFileSync(
            path.join(scratch, 'grv_a.md'),
            [
                '---',
                'id: grv_a',
                'entity_type: grievance',
                'min_intensity: 1',
                'max_intensity: 3',
                'participants:',
                '  - char_missing_ghost',
                'spawns_on_max_escalation:',
                '  - grv_b',
                '---',
                'Grievance A.',
            ].join('\n') + '\n',
            'utf8',
        )
        fs.writeFileSync(
            path.join(scratch, 'grv_b.md'),
            [
                '---',
                'id: grv_b',
                'entity_type: grievance',
                'min_intensity: 2',
                'max_intensity: 4',
                'participants: []',
                'spawns_on_max_escalation:',
                '  - grv_a',
                '---',
                'Grievance B.',
            ].join('\n') + '\n',
            'utf8',
        )

        // Asymmetric location portal + negative acoustic attenuation: loc_1 -> loc_2, but loc_2 has []
        fs.writeFileSync(
            path.join(scratch, 'loc_1.md'),
            [
                '---',
                'id: loc_1',
                'entity_type: location',
                'acoustic_dampening_cdb: -50',
                'adjacent_to:',
                '  - loc_2',
                '---',
                'Location 1.',
            ].join('\n') + '\n',
            'utf8',
        )
        fs.writeFileSync(
            path.join(scratch, 'loc_2.md'),
            [
                '---',
                'id: loc_2',
                'entity_type: location',
                'adjacent_to: []',
                '---',
                'Location 2.',
            ].join('\n') + '\n',
            'utf8',
        )

        // Clue-lemma collision mystery
        fs.writeFileSync(
            path.join(scratch, 'mys_spoiler.md'),
            [
                '---',
                'id: mys_spoiler',
                'entity_type: mystery',
                'clue_tokens:',
                '  - rusty_key',
                '  - poisoned_chalice',
                'forbidden_lemmas:',
                '  - poisoned_chalice',
                '---',
                'Mystery with spoiler leak.',
            ].join('\n') + '\n',
            'utf8',
        )

        let captured: CompileBit | undefined
        const model = new CompileModel()
        const next = reducer(
            model,
            new ActCmp.Pass2Traverse({
                idx: 'test-p2',
                src: scratch,
                slv: (res: { cmpBit: CompileBit }) => {
                    captured = res.cmpBit
                },
            }),
        )

        expect(next.status).toBe('FAILED')
        expect(captured?.val).toBe(0)
        const report = captured?.validationReport
        expect(report?.foreignKeysValid).toBe(false)
        expect(report?.grievanceDagAcyclic).toBe(false)
        expect(report?.spatialPortalsReciprocal).toBe(false)
        expect(report?.acousticAttenuationValid).toBe(false)
        expect(report?.clueLemmaDisjoint).toBe(false)
        expect(
            report?.errors.some((e) => e.includes('[DAG_CYCLE_DETECTED]')),
        ).toBe(true)
        expect(
            report?.errors.some((e) =>
                e.includes('[ASYMMETRIC_SPATIAL_PORTAL]'),
            ),
        ).toBe(true)
        expect(
            report?.errors.some((e) =>
                e.includes('[ACOUSTIC_ATTENUATION_VIOLATION]'),
            ),
        ).toBe(true)
        expect(
            report?.errors.some((e) => e.includes('[CLUE_LEMMA_COLLISION]')),
        ).toBe(true)
    })

    it('Pass 3 & Gate 0 Positive Gauntlet: seals 000.sample-hearth deterministically with identical Merkle root across runs and deep-freezes V8 heap', () => {
        const outDir = makeScratchDir('compiled-out')
        let run1: CompileBit | undefined
        let run2: CompileBit | undefined

        const model1 = reducer(
            new CompileModel(),
            new ActCmp.Gate0Verify({
                idx: 'g0-run1',
                seriesSlug: '000.sample-hearth',
                outputDir: outDir,
                slv: (res: { cmpBit: CompileBit }) => {
                    run1 = res.cmpBit
                },
            }),
        )

        const model2 = reducer(
            new CompileModel(),
            new ActCmp.Gate0Verify({
                idx: 'g0-run2',
                seriesSlug: '000.sample-hearth',
                outputDir: outDir,
                slv: (res: { cmpBit: CompileBit }) => {
                    run2 = res.cmpBit
                },
            }),
        )

        expect(model1.status).toBe('SEALED')
        expect(model2.status).toBe('SEALED')
        expect(run1?.val).toBe(1)
        expect(run2?.val).toBe(1)
        expect(run1?.rootMerkleHash).toMatch(/^[a-f0-9]{64}$/)
        // Zero-Drift Determinism: identical Merkle root across consecutive invocations
        expect(run1?.rootMerkleHash).toBe(run2?.rootMerkleHash)

        // Verify canonical bible-state.json exists on disk
        const canonicalFile = path.join(outDir, 'bible-state.json')
        expect(fs.existsSync(canonicalFile)).toBe(true)

        // Verify V8 heap deepFreeze immutability on sealed catalog
        expect(Object.isFrozen(model1.entityCatalog)).toBe(true)
        expect(() => {
            model1.entityCatalog.injected = 'illegal_mutation'
        }).toThrow(TypeError)
    })

    it('Level 3 Stylometric & Voice-Bleed Linter: flags corporate slop tokens and shared signature callbacks outside the sealing loop', () => {
        const cleanCatalog = {
            char_snag: {
                id: 'char_snag',
                entity_type: 'character',
                voice_callbacks: ['by the damp soot'],
                prose_body: 'Snag crouched beside the iron grate and listened.',
            },
            char_gristle: {
                id: 'char_gristle',
                entity_type: 'character',
                voice_callbacks: ['rust take your boots'],
                prose_body:
                    'Gristle tapped the brass ladle against the kettle.',
            },
        }
        const cleanRes = auditStylometrics(cleanCatalog)
        expect(cleanRes.passed).toBe(true)
        expect(cleanRes.slopViolations).toEqual([])
        expect(cleanRes.voiceBleedCollisions).toEqual([])

        const pollutedCatalog = {
            char_snag: {
                id: 'char_snag',
                entity_type: 'character',
                voice_callbacks: ['check the cauldron'],
                prose_body:
                    'We must leverage holistic synergy to delve into this paradigm.',
            },
            char_gristle: {
                id: 'char_gristle',
                entity_type: 'character',
                voice_callbacks: ['check the cauldron'],
                prose_body: 'Gristle scowled at the cold hearth.',
            },
        }
        const badRes = auditStylometrics(pollutedCatalog)
        expect(badRes.passed).toBe(false)
        expect(badRes.slopViolations.length).toBeGreaterThan(0)
        expect(badRes.voiceBleedCollisions.length).toBe(1)
        expect(badRes.voiceBleedCollisions[0]).toContain(
            '[VOICE_BLEED_COLLISION]',
        )
    })

    it('Hermetic Offline Deletion Verification: purges compiled output and verifies 100% bit-for-bit Merkle root parity on rebuild', () => {
        const outDir = makeScratchDir('offline-parity')
        let result: CompileBit | undefined

        const next = reducer(
            new CompileModel(),
            new ActCmp.OfflineDeletionTest({
                idx: 'offline-test',
                seriesSlug: '000.sample-hearth',
                outputDir: outDir,
                slv: (res: { cmpBit: CompileBit }) => {
                    result = res.cmpBit
                },
            }),
        )

        expect(next.status).toBe('SEALED')
        expect(result?.val).toBe(1)
        expect(result?.offlineParityReport?.parityVerified).toBe(true)
        expect(result?.offlineParityReport?.initialHash).toMatch(
            /^[a-f0-9]{64}$/,
        )
        expect(result?.offlineParityReport?.initialHash).toBe(
            result?.offlineParityReport?.rebuiltHash,
        )
        expect(
            result?.offlineParityReport?.purgedFilesCount,
        ).toBeGreaterThanOrEqual(2)
    })

    it('BEE State Integration: dispatches [Compile action] Run Compile directly through 299.lore State.hunt', async () => {
        const outDir = makeScratchDir('bee-state-out')
        const ste = new State()
        const res = await ste.hunt(ActCmp.RUN_COMPILE, {
            idx: 'bee-hunt-test',
            actionType: 'full-compile',
            seriesSlug: '000.sample-hearth',
            outputDir: outDir,
        })

        expect(res?.cmpBit?.val).toBe(1)
        expect(res?.cmpBit?.rootMerkleHash).toMatch(/^[a-f0-9]{64}$/)
        expect(res?.cmpBit?.catalogSummary?.totalEntities).toBe(6)
        expect(Object.keys(res?.cmpBit?.entityHashes || {}).length).toBe(6)
    })

    it('RFC 8785 JCS & deepFreeze: sorts keys deterministically by UTF-16 code units and strips root volatile timestamps', () => {
        const inputA = {
            z_key: 10,
            a_key: 'hello',
            compiled_at: '2026-01-01T00:00:00Z',
            nested: { b: 2, a: 1 },
        }
        const inputB = {
            nested: { a: 1, b: 2 },
            a_key: 'hello',
            compiled_at: '2099-12-31T23:59:59Z',
            z_key: 10,
        }
        expect(jcsSerialize(inputA, true)).toBe(jcsSerialize(inputB, true))
        expect(jcsSerialize(inputA, true)).toBe(
            '{"a_key":"hello","nested":{"a":1,"b":2},"z_key":10}',
        )

        const frozen = deepFreeze({ outer: { inner: [1, 2, 3] } })
        expect(Object.isFrozen(frozen)).toBe(true)
        expect(Object.isFrozen(frozen.outer)).toBe(true)
        expect(Object.isFrozen(frozen.outer.inner)).toBe(true)
    })
})
