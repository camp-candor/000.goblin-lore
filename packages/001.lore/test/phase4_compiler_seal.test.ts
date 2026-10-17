import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import Database from 'better-sqlite3'
import {
    canonicalizeJson,
    computeMerkleRoot,
    verifyStateMerkleParity,
} from '../src/core/canon/merkleVerifier.js'
import { ThreePassCompiler } from '../scripts/compile.js'
import { loadBibleState, deepFreeze } from '../src/core/canon/bibleLoader.js'
import { buildByteZeroDossier } from '../src/scaffolder/entityBuilder.js'

describe('Phase 4: The 3-Pass Offline Compiler & Merkle Root Sealing', () => {
    let tmpDir: string

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'goblin_lore_p4_'))
    })

    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true })
    })

    it('enforces RFC 8785 key-order invariance and Unicode NFC normalization', () => {
        const objA = { b: 2, a: 1, c: { y: 'test', x: 'nfcA\u030A' } }
        const objB = { a: 1, c: { x: 'nfc\u00C5', y: 'test' }, b: 2 }

        const canonicalA = canonicalizeJson(objA)
        const canonicalB = canonicalizeJson(objB)

        expect(canonicalA).toBe(canonicalB)
        expect(computeMerkleRoot(objA)).toBe(computeMerkleRoot(objB))
    })

    it('rejects non-finite numbers with TypeError', () => {
        expect(() => canonicalizeJson({ value: Number.NaN })).toThrow(TypeError)
        expect(() => canonicalizeJson({ value: Infinity })).toThrow(TypeError)
    })

    it('detects single-byte payload tampering via verifyStateMerkleParity', () => {
        const validPayload = {
            _meta: { seriesSlug: 'genesis', state_hash: '' },
            characters: { char_bog: { id: 'char_bog', name: 'Bog' } },
        }

        const hash = computeMerkleRoot({
            _meta: { seriesSlug: 'genesis' },
            characters: { char_bog: { id: 'char_bog', name: 'Bog' } },
        })
        validPayload._meta.state_hash = hash

        const parityBefore = verifyStateMerkleParity(validPayload, hash)
        expect(parityBefore.valid).toBe(true)

        // Tamper with a single letter
        validPayload.characters.char_bog.name = 'Bof'
        const parityAfter = verifyStateMerkleParity(validPayload, hash)
        expect(parityAfter.valid).toBe(false)
    })

    it('executes Passes 1, 2, and 3, outputting atomic dual snapshots and WORM archive', () => {
        const charsDir = path.join(tmpDir, 'characters')
        const possDir = path.join(tmpDir, 'possessions')
        const grvDir = path.join(tmpDir, 'grievances')
        fs.mkdirSync(charsDir)
        fs.mkdirSync(possDir)
        fs.mkdirSync(grvDir)

        const knifePath = path.join(possDir, 'item_iron_knife.md')
        fs.writeFileSync(
            knifePath,
            buildByteZeroDossier(
                {
                    id: 'item_iron_knife',
                    name: 'Iron Knife',
                    entity_type: 'possession',
                    version: 1,
                    depends_on: [],
                    logistical: {
                        occupies_hands: 1,
                        weight_class_bps: 1000,
                        is_two_handed: false,
                    },
                    created_at_epoch: 0,
                    updated_at_epoch: 0,
                },
                'A dull iron blade.',
            ),
        )

        const bogPath = path.join(charsDir, 'char_bog.md')
        fs.writeFileSync(
            bogPath,
            buildByteZeroDossier(
                {
                    id: 'char_bog',
                    name: 'Bog',
                    entity_type: 'character',
                    version: 1,
                    depends_on: [],
                    somatic: {
                        locomotion_baseline: 'bipedal_hunched',
                        available_arms: 2,
                        somatic_capability_mask: 0,
                        active_conditions: [],
                        banned_kinetic_verbs: [],
                    },
                    logistical: {
                        hand_capacity: 2,
                        slots: {
                            worn: [],
                            held: ['item_iron_knife'],
                            carried: [],
                            cached: [],
                        },
                        max_carry_weight_bps: 5000,
                    },
                    epistemic: {
                        horizon: 'TOTAL_IGNORANCE',
                        known_facts: [],
                        distorted_beliefs: {},
                        escalation_ceiling: 3,
                    },
                    refusal_vectors: [],
                    created_at_epoch: 0,
                    updated_at_epoch: 0,
                },
                'Bog scavenges.',
            ),
        )

        const compiler = new ThreePassCompiler(tmpDir, 'genesis_core')
        const pass1 = compiler.executePass1({
            characters: [bogPath],
            possessions: [knifePath],
            grievances: [],
        })
        expect(pass1.characters.char_bog).toBeDefined()

        compiler.executePass2(pass1)

        const outDir = path.join(tmpDir, 'compiled')
        const pass3 = compiler.executePass3(pass1, outDir, 1700000000000)

        expect(fs.existsSync(pass3.headPath)).toBe(true)
        expect(fs.existsSync(pass3.wormPath)).toBe(true)
        expect(pass3.stateHash).toHaveLength(64)
        expect(pass3.stateHash).toMatch(/^[0-9a-f]{64}$/)
        expect(path.basename(pass3.wormPath)).toMatch(
            /^bible-state_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z\.json$/,
        )

        // Sealed HEAD loads back through the runtime loader, deeply frozen
        const loaded = loadBibleState(pass3.headPath)
        expect(loaded.isParityVerified).toBe(true)
        expect(loaded.stateHash).toBe(pass3.stateHash)
        expect(Object.isFrozen(loaded.state)).toBe(true)
    })

    it('halts loadBibleState with CANON_DESYNC_HALT on single-byte tampering', () => {
        const outDir = path.join(tmpDir, 'compiled')
        fs.mkdirSync(outDir, { recursive: true })
        const compiler = new ThreePassCompiler(tmpDir, 'genesis_core')
        const pass3 = compiler.executePass3(
            { characters: {}, possessions: {}, grievances: {} },
            outDir,
            1700000000000,
        )

        const sealed = fs.readFileSync(pass3.headPath, 'utf8')
        fs.writeFileSync(
            pass3.headPath,
            sealed.replace('genesis_core', 'genesis_corr'),
        )
        expect(() => loadBibleState(pass3.headPath)).toThrow(
            /CANON_DESYNC_HALT/,
        )
    })

    it('enforces deep-freeze immutability and rejects mutations with TypeError', () => {
        const raw = { character: { name: 'Bog', limbs: [1, 2] } }
        const frozen = deepFreeze(raw)

        expect(() => {
            frozen.character.name = 'MutatedBog'
        }).toThrow(TypeError)

        expect(() => {
            frozen.character.limbs.push(3)
        }).toThrow(TypeError)
    })

    it('verifies state hash against local SQLite canon_metadata table', () => {
        const dbPath = path.join(tmpDir, 'pilot.db')
        const db = new Database(dbPath)
        const mockHash = 'a'.repeat(64)

        db.exec(`
      CREATE TABLE canon_metadata (
        series_slug TEXT PRIMARY KEY,
        state_hash TEXT NOT NULL,
        is_dirty INTEGER NOT NULL DEFAULT 0,
        updated_at_epoch INTEGER NOT NULL
      );
      INSERT INTO canon_metadata VALUES ('test_slug', '${mockHash}', 0, 0);
    `)
        db.close()

        const stateFile = path.join(tmpDir, 'bible-state.json')
        fs.writeFileSync(
            stateFile,
            JSON.stringify({
                _meta: { seriesSlug: 'test_slug', state_hash: mockHash },
                characters: {},
            }),
        )

        // Matching hash succeeds
        const loaded = loadBibleState(stateFile, {
            localSqliteDbPath: dbPath,
            expectedStateHash: mockHash,
        })
        expect(loaded.isParityVerified).toBe(true)

        // Mismatched DB state_hash halts with CANON_DESYNC_HALT
        const corruptDbPath = path.join(tmpDir, 'corrupt.db')
        const corruptDb = new Database(corruptDbPath)
        corruptDb.exec(`
      CREATE TABLE canon_metadata (
        series_slug TEXT PRIMARY KEY,
        state_hash TEXT NOT NULL,
        is_dirty INTEGER NOT NULL DEFAULT 0,
        updated_at_epoch INTEGER NOT NULL
      );
      INSERT INTO canon_metadata VALUES ('test_slug', '${'b'.repeat(64)}', 0, 0);
    `)
        corruptDb.close()

        expect(() => {
            loadBibleState(stateFile, {
                localSqliteDbPath: corruptDbPath,
                expectedStateHash: mockHash,
            })
        }).toThrow(/CANON_DESYNC_HALT/)

        // Dirty ledger halts with CANON_DESYNC_HALT
        const dirtyDbPath = path.join(tmpDir, 'dirty.db')
        const dirtyDb = new Database(dirtyDbPath)
        dirtyDb.exec(`
      CREATE TABLE canon_metadata (
        series_slug TEXT PRIMARY KEY,
        state_hash TEXT NOT NULL,
        is_dirty INTEGER NOT NULL DEFAULT 0,
        updated_at_epoch INTEGER NOT NULL
      );
      INSERT INTO canon_metadata VALUES ('test_slug', '${mockHash}', 1, 0);
    `)
        dirtyDb.close()

        expect(() => {
            loadBibleState(stateFile, {
                localSqliteDbPath: dirtyDbPath,
                expectedStateHash: mockHash,
            })
        }).toThrow(/CANON_DESYNC_HALT/)
    })
})
