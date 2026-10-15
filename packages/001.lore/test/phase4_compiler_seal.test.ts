import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
    canonicalizeJson,
    computeMerkleRoot,
    verifyStateMerkleParity,
} from '../src/core/canon/merkleVerifier.js'
import { deepFreeze, loadBibleState } from '../src/core/canon/bibleLoader.js'

describe('Phase 4: JCS Canonicalization and deepFreeze Tests', () => {
    describe('JCS Canonicalization (RFC 8785)', () => {
        it('should sort keys lexicographically by UTF-16 code units', () => {
            const input = { b: 2, a: 1, c: 3 }
            const expected = '{"a":1,"b":2,"c":3}'
            expect(canonicalizeJson(input)).toBe(expected)
        })

        it('should apply Unicode Normalization Form C (NFC)', () => {
            const input = { a: 'e\u0301' } // e + acute accent
            const expected = '{"a":"é"}'
            expect(canonicalizeJson(input)).toBe(expected)
        })

        it('should reject non-finite numbers', () => {
            expect(() => canonicalizeJson({ a: NaN })).toThrow(TypeError)
            expect(() => canonicalizeJson({ a: Infinity })).toThrow(TypeError)
        })

        it('should format whitespace deterministically', () => {
            const input = { a: 1,   b:   2 }
            const expected = '{"a":1,"b":2}'
            expect(canonicalizeJson(input)).toBe(expected)
        })
    })

    describe('deepFreeze', () => {
        it('should recursively freeze objects', () => {
            const obj = { a: 1, b: { c: 2 }, d: [1, 2, 3] }
            const frozen = deepFreeze(obj)

            expect(Object.isFrozen(frozen)).toBe(true)
            expect(Object.isFrozen(frozen.b)).toBe(true)
            expect(Object.isFrozen(frozen.d)).toBe(true)

            expect(() => { (frozen as any).a = 2 }).toThrow(TypeError)
            expect(() => { (frozen.b as any).c = 3 }).toThrow(TypeError)
            expect(() => { (frozen.d as any).push(4) }).toThrow(TypeError)
        })
    })
})

    describe('Compiler Passes & Merkle Sealing', () => {
        let tempDir: string
        let compiledDir: string

        beforeEach(() => {
            tempDir = path.join(__dirname, '.tmp_test_data')
            compiledDir = path.join(__dirname, '.tmp_compiled')

            fs.mkdirSync(tempDir, { recursive: true })
            fs.mkdirSync(path.join(tempDir, 'characters'), { recursive: true })
            fs.mkdirSync(path.join(tempDir, 'locations'), { recursive: true })
            fs.mkdirSync(path.join(tempDir, 'possessions'), { recursive: true })
            fs.mkdirSync(path.join(tempDir, 'grievances'), { recursive: true })
            fs.mkdirSync(compiledDir, { recursive: true })
        })

        afterEach(() => {
            fs.rmSync(tempDir, { recursive: true, force: true })
            fs.rmSync(compiledDir, { recursive: true, force: true })
        })

        it('should compute merkle root correctly', () => {
            const payload = { a: 1, b: 2 }
            const canonical = canonicalizeJson(payload)
            const hash = computeMerkleRoot(canonical)
            expect(hash).toMatch(/^[a-f0-9]{64}$/)
        })

        it('should verify state merkle parity and ignore volatile state_hash', () => {
            const rawJson = JSON.stringify({
                a: 1,
                b: 2,
                _meta: { state_hash: 'dummy' }
            })
            const expectedHash = computeMerkleRoot(canonicalizeJson({ a: 1, b: 2, _meta: {} }))
            expect(verifyStateMerkleParity(rawJson, expectedHash)).toBe(true)
        })

        // More comprehensive compiler tests could be added here, mocking FS
    })
