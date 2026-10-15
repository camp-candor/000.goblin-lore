import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import {
    canonicalizeJson,
    computeMerkleRoot,
    verifyStateMerkleParity,
} from '../src/core/canon/merkleVerifier.js'
import { ThreePassCompiler } from '../scripts/compile.js'
import { loadBibleState, deepFreeze } from '../src/core/canon/bibleLoader.js'

describe('Phase 4: Merkle Verifier & Canonicalization', () => {
    it('canonicalizeJson adheres to strict RFC 8785 rules', () => {
        const input = { b: 'string', a: 1, c: { e: null, d: [3, 2, 1] } }
        const canonical = canonicalizeJson(input)
        expect(canonical).toBe(
            '{"a":1,"b":"string","c":{"d":[3,2,1],"e":null}}',
        )

        const strNFC = canonicalizeJson({ val: 'Am\x65\u0301lie' })
        expect(strNFC).toBe('{"val":"Amélie"}')

        expect(() => canonicalizeJson({ val: NaN })).toThrow(/Invalid number/)
        expect(() => canonicalizeJson({ val: Infinity })).toThrow(
            /Invalid number/,
        )

        const negZero = canonicalizeJson({ val: -0 })
        expect(negZero).toBe('{"val":0}')
    })

    it('computeMerkleRoot produces the correct SHA-256 digest', () => {
        const payload = { test: 123 }
        const hash = computeMerkleRoot(payload)
        const expectedCanonical = '{"test":123}'
        const expectedHash = crypto
            .createHash('sha256')
            .update(expectedCanonical, 'utf8')
            .digest('hex')
            .toLowerCase()

        expect(hash).toBe(expectedHash)
        expect(hash).toHaveLength(64)
    })

    it('verifyStateMerkleParity strips _meta.state_hash and verifies parity', () => {
        const payload = { data: 'test' }
        const rootHash = computeMerkleRoot(payload)

        const sealedPayload = {
            _meta: { state_hash: rootHash },
            data: 'test',
        }

        expect(() =>
            verifyStateMerkleParity(sealedPayload, rootHash),
        ).not.toThrow()

        const tamperedPayload = {
            _meta: { state_hash: rootHash },
            data: 'test_tampered',
        }

        expect(() =>
            verifyStateMerkleParity(tamperedPayload, rootHash),
        ).toThrow(/CANON_DESYNC_HALT/)
    })
})

describe('Phase 4: Deep Freeze Loader', () => {
    it('deepFreeze prevents property mutation', () => {
        const obj = { a: 1, b: { c: 2 } }
        const frozen = deepFreeze(obj)

        expect(() => {
            ;(frozen as any).a = 2
        }).toThrowError()
        expect(() => {
            ;(frozen as any).b.c = 3
        }).toThrowError()
    })

    it('loadBibleState loads and verifies the hash', () => {
        const dir = fs.mkdtempSync('test_bible_loader_')
        const filePath = path.join(dir, 'bible-state.json')

        const payload = { test: 'data' }
        const hash = computeMerkleRoot(payload)
        const sealed = { _meta: { state_hash: hash }, test: 'data' }

        fs.writeFileSync(filePath, JSON.stringify(sealed))

        const loaded = loadBibleState(filePath)
        expect(loaded.test).toBe('data')
        expect(() => {
            ;(loaded as any).test = 'mutated'
        }).toThrowError()

        // Tamper
        const tampered = { _meta: { state_hash: hash }, test: 'tampered' }
        fs.writeFileSync(filePath, JSON.stringify(tampered))

        expect(() => loadBibleState(filePath)).toThrow(/CANON_DESYNC_HALT/)

        fs.rmSync(dir, { recursive: true, force: true })
    })
})

describe('Phase 4: ThreePassCompiler', () => {
    let testDataDir: string
    let testOutputDir: string

    beforeEach(() => {
        testDataDir = fs.mkdtempSync('test_compiler_data_')
        testOutputDir = fs.mkdtempSync('test_compiler_output_')
    })

    afterEach(() => {
        fs.rmSync(testDataDir, { recursive: true, force: true })
        fs.rmSync(testOutputDir, { recursive: true, force: true })
    })

    it('Pass 1 evaluates SAT equations', () => {
        fs.mkdirSync(path.join(testDataDir, 'characters'))
        fs.mkdirSync(path.join(testDataDir, 'possessions'))

        fs.writeFileSync(
            path.join(testDataDir, 'possessions', 'heavy_item.md'),
            `---
id: item_heavy
name: Heavy Rock
type: possession
logistical:
  occupies_hands: 2
---`,
        )

        fs.writeFileSync(
            path.join(testDataDir, 'characters', 'char1.md'),
            `---
id: char_1
name: Weak Char
type: character
somatic:
  available_arms: 1
logistical:
  held:
    - item_heavy
epistemic:
  escalation_ceiling: 3
---`,
        )

        const compiler = new ThreePassCompiler(testDataDir, testOutputDir)
        expect(() => compiler.pass1_ShapesAndScalars()).toThrow(
            /COMPILER_SAT_ERROR/,
        )
    })

    it('Pass 2 throws COMPILER_DAG_CYCLE on circular grievance deadlocks', () => {
        fs.mkdirSync(path.join(testDataDir, 'grievances'))

        fs.writeFileSync(
            path.join(testDataDir, 'grievances', 'grv_1.md'),
            `---
id: grv_1
title: Grv 1
category: resource_hoarding
participants_primary: [char_a, char_b]
intensity_envelope:
  min: 1
  max: 3
spawns_on_max_escalation:
  - grv_2
---`,
        )

        fs.writeFileSync(
            path.join(testDataDir, 'grievances', 'grv_2.md'),
            `---
id: grv_2
title: Grv 2
category: resource_hoarding
participants_primary: [char_b, char_a]
intensity_envelope:
  min: 1
  max: 3
spawns_on_max_escalation:
  - grv_1
---`,
        )

        const compiler = new ThreePassCompiler(testDataDir, testOutputDir)
        compiler.pass1_ShapesAndScalars()
        expect(() => compiler.pass2_RelationalAndInvariants()).toThrow(
            /COMPILER_DAG_CYCLE/,
        )
    })

    it('Pass 3 outputs the sealed JSON files with hashes', () => {
        const compiler = new ThreePassCompiler(testDataDir, testOutputDir)
        compiler.run() // Will run passes 1, 2, 3 on empty data, which is valid

        const files = fs.readdirSync(testOutputDir)
        expect(files).toContain('bible-state.json')

        const headPath = path.join(testOutputDir, 'bible-state.json')
        const data = JSON.parse(fs.readFileSync(headPath, 'utf8'))

        expect(data._meta.state_hash).toBeDefined()
        expect(data._meta.state_hash).toHaveLength(64)
        expect(data.entities.characters).toEqual([])

        const wormFile = files.find(
            (f) =>
                f.startsWith('bible-state_') &&
                f.endsWith('.json') &&
                f !== 'bible-state.json',
        )
        expect(wormFile).toBeDefined()
    })
})
