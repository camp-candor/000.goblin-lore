import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'
import { StandingEngine } from '../src/core/ledger/standingEngine.js'
import { ErrataManager } from '../src/core/ledger/errataManager.js'
import {
    RatificationStamper,
    calculateSalience,
} from '../src/harvest/ratificationStamper.js'
import { syncValidatedCanonToD1 } from '../scripts/syncToD1.js'
import {
    FactStandingMetadataSchema,
    calculateAuditPriorityScore,
} from '../src/schemas/standing.js'
import {
    ErrataRecordSchema,
    classifyMediaProvenance,
} from '../src/schemas/errata.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('Phase 5: Canon Lifecycle Standing, Harvest Ratification & Upstream D1 Migration', () => {
    let tmpDir: string
    let db: Database.Database
    let standingEngine: StandingEngine
    let errataManager: ErrataManager
    let ratificationStamper: RatificationStamper

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'goblin_lore_p5_'))
        db = new Database(':memory:')
        db.pragma('foreign_keys = ON')

        const schemaSql = fs.readFileSync(
            path.resolve(
                __dirname,
                '../migrations/0001_phase0_flat_schema.sql',
            ),
            'utf8',
        )
        db.exec(schemaSql)

        standingEngine = new StandingEngine(db)
        errataManager = new ErrataManager(tmpDir)
        ratificationStamper = new RatificationStamper(db, tmpDir)
    })

    afterEach(() => {
        db.close()
        fs.rmSync(tmpDir, { recursive: true, force: true })
    })

    it('verifies the Zero-Cascade Liminal Guarantee on FLAGGED_FOR_REVIEW', () => {
        db.prepare(
            `
            INSERT INTO facts (id, claim_text, scope, standing, version, author, created_at_ms, last_edited_at_ms)
            VALUES ('fact_marsh_gate', 'Gate is barred', 'LOCATION', 'ACTIVE_ENDORSED', 1, 'Elena', 0, 0)
        `,
        ).run()

        db.prepare(
            `
            INSERT INTO scenes (id, episode_num, scene_num, text, status, is_dirty)
            VALUES ('scene_101', 1, 1, 'At the gate.', 'clean', 0)
        `,
        ).run()

        db.prepare(
            `
            INSERT INTO scene_fact_dependencies (scene_id, fact_id, pinned_version, created_at_ms)
            VALUES ('scene_101', 'fact_marsh_gate', 1, 0)
        `,
        ).run()

        standingEngine.transitionStanding(
            'fact_marsh_gate',
            'FLAGGED_FOR_REVIEW',
            'Elena',
        )

        const sceneClean = db
            .prepare('SELECT status, is_dirty FROM scenes WHERE id = ?')
            .get('scene_101') as { status: string; is_dirty: number }
        expect(sceneClean.status).toBe('clean')
        expect(sceneClean.is_dirty).toBe(0)

        standingEngine.transitionStanding(
            'fact_marsh_gate',
            'DEPRECATED_ARCHIVED',
            'Elena',
        )

        const sceneDirty = db
            .prepare('SELECT status, is_dirty FROM scenes WHERE id = ?')
            .get('scene_101') as { status: string; is_dirty: number }
        expect(sceneDirty.status).toBe('dirty')
        expect(sceneDirty.is_dirty).toBe(1)
    })

    it('executes the 5-Second Still Good protocol without bumping version integer', () => {
        db.prepare(
            `
            INSERT INTO facts (id, claim_text, scope, standing, version, author, created_at_ms, last_edited_at_ms)
            VALUES ('fact_culvert_key', 'Key under stone', 'LOGISTIC', 'FLAGGED_FOR_REVIEW', 4, 'Marcus', 0, 0)
        `,
        ).run()

        const result = standingEngine.endorseStillGood(
            'fact_culvert_key',
            'Showrunner',
        )
        expect(result.success).toBe(true)
        expect(result.version).toBe(4)

        const fact = db
            .prepare('SELECT standing, version FROM facts WHERE id = ?')
            .get('fact_culvert_key') as { standing: string; version: number }
        expect(fact.standing).toBe('ACTIVE_ENDORSED')
        expect(fact.version).toBe(4)

        expect(() =>
            standingEngine.endorseStillGood('fact_missing', 'Showrunner'),
        ).toThrow(/FACT_NOT_FOUND/)
    })

    it('calculates logarithmic audit priority and sorts reconsideration queue', () => {
        expect(calculateAuditPriorityScore(10, 9)).toBe(10)
        expect(calculateAuditPriorityScore(0, 100)).toBe(0)
        expect(calculateAuditPriorityScore(-5, -1)).toBe(0)
        expect(calculateAuditPriorityScore(30, 99)).toBe(60)

        const now = 100 * 86_400_000
        db.prepare(
            `
            INSERT INTO facts (id, claim_text, scope, standing, version, author, created_at_ms, last_edited_at_ms)
            VALUES ('fact_old', 'Old fact', 'LAW', 'FLAGGED_FOR_REVIEW', 1, 'Elena', 0, 0)
        `,
        ).run()
        db.prepare(
            `
            INSERT INTO facts (id, claim_text, scope, standing, version, author, created_at_ms, last_edited_at_ms)
            VALUES ('fact_new', 'New fact', 'LAW', 'ACTIVE_ENDORSED', 1, 'Elena', 0, ?)
        `,
        ).run(now)
        db.prepare(
            `
            INSERT INTO scenes (id, episode_num, scene_num, text, status, is_dirty)
            VALUES ('scene_201', 2, 1, 'Old scene.', 'clean', 0)
        `,
        ).run()
        db.prepare(
            `
            INSERT INTO scene_fact_dependencies (scene_id, fact_id, pinned_version, created_at_ms)
            VALUES ('scene_201', 'fact_old', 1, 0)
        `,
        ).run()

        const queue = standingEngine.queryReconsiderationQueue(now)
        expect(queue[0].fact_id).toBe('fact_old')
        expect(queue[0].days_since_reconsideration).toBe(100)
        expect(queue[0].in_degree).toBe(1)
        expect(queue[0].audit_priority_score).toBeCloseTo(30.1, 1)
    })

    it('enforces strict standing schema and rejects un-schemaed keys', () => {
        expect(
            FactStandingMetadataSchema.parse({ fact_id: 'fact_culvert_key' })
                .standing,
        ).toBe('ACTIVE_ENDORSED')
        expect(() =>
            FactStandingMetadataSchema.parse({
                fact_id: 'fact_culvert_key',
                bogus_key: true,
            }),
        ).toThrow()
        expect(() =>
            FactStandingMetadataSchema.parse({ fact_id: 'bad-id' }),
        ).toThrow()
    })

    it('quarantines emergent props and promotes only upon human ratification', () => {
        const lowSalience = calculateSalience(1, 0.2)
        expect(lowSalience).toBeLessThan(0.7)
        expect(calculateSalience(5, 1)).toBe(1)
        expect(calculateSalience(4, 0.9)).toBe(0.86)

        const lowResult = ratificationStamper.quarantineCandidate({
            id: 'item_pebble',
            name: 'Common Pebble',
            recurrence_count: 1,
            dramatic_salience: 0.2,
            suggested_weight_bps: 100,
            occupies_hands: 0,
            first_observed_scene: 'scene_01',
        })
        expect(lowResult).toBe(false)

        const highResult = ratificationStamper.quarantineCandidate({
            id: 'item_brass_siphon',
            name: 'Brass Siphon',
            recurrence_count: 4,
            dramatic_salience: 0.9,
            suggested_weight_bps: 2000,
            occupies_hands: 1,
            first_observed_scene: 'scene_02',
        })
        expect(highResult).toBe(true)

        const quarantined = db
            .prepare('SELECT status FROM unratified_details WHERE id = ?')
            .get('item_brass_siphon') as { status: string }
        expect(quarantined.status).toBe('QUARANTINED')
        expect(
            fs.existsSync(
                path.join(tmpDir, 'possessions', 'item_brass_siphon.md'),
            ),
        ).toBe(false)
        expect(
            fs.existsSync(path.join(tmpDir, 'compiled', 'bible-state.json')),
        ).toBe(false)

        const dossierPath = ratificationStamper.stampRatifiedPossession(
            'item_brass_siphon',
            'Showrunner',
        )
        expect(fs.existsSync(dossierPath)).toBe(true)
        const content = fs.readFileSync(dossierPath, 'utf8')
        expect(content.startsWith('---\n')).toBe(true)
        expect(content).toContain('id: item_brass_siphon')

        const ratified = db
            .prepare('SELECT status FROM unratified_details WHERE id = ?')
            .get('item_brass_siphon') as { status: string }
        expect(ratified.status).toBe('RATIFIED')

        expect(() =>
            ratificationStamper.stampRatifiedPossession(
                'item_missing',
                'Showrunner',
            ),
        ).toThrow(/DETAIL_NOT_FOUND/)
    })

    it('appends immutable errata records and rejects duplicates', () => {
        const errata = {
            id: 'errata_001',
            superseded_canon_sha: 'a'.repeat(64),
            active_canon_sha: 'b'.repeat(64),
            affected_entity_ids: ['char_silas'],
            severity: 'CANONICAL_BREACH' as const,
            defect_description: 'Silas used paralyzed arm in Ep 102',
            corrective_action: 'Inpaint frame plate with splint',
            reported_by: 'QA_Inspector',
            created_at_epoch: 0,
        }

        errataManager.appendErrata(errata)
        const ledger = errataManager.readLedger()
        expect(ledger.records).toHaveLength(1)
        expect(fs.existsSync(path.join(tmpDir, 'lore', 'errata.json'))).toBe(
            true,
        )

        expect(() => errataManager.appendErrata(errata)).toThrow(
            /DUPLICATE_ERRATA_ID/,
        )

        expect(() =>
            ErrataRecordSchema.parse({ ...errata, extra_key: 1 }),
        ).toThrow()
        expect(classifyMediaProvenance('a'.repeat(64), 'a'.repeat(64))).toBe(
            'REPLAY',
        )
        expect(classifyMediaProvenance('a'.repeat(64), 'b'.repeat(64))).toBe(
            'REMASTER',
        )
        expect(errataManager.classifyProvenance(errata)).toBe('REMASTER')
    })

    it('gates upstream D1 migration until Gate 1 verification clears', () => {
        const localDbPath = path.join(tmpDir, 'local_test.db')
        const testDb = new Database(localDbPath)
        testDb.exec(`
            CREATE TABLE facts (id TEXT PRIMARY KEY, claim_text TEXT);
            INSERT INTO facts VALUES ('fact_1', 'Canon');
        `)
        testDb.close()

        const compiledPath = path.join(tmpDir, 'bible-state.json')
        fs.writeFileSync(
            compiledPath,
            JSON.stringify({ _meta: { state_hash: 'c'.repeat(64) } }),
        )

        expect(() => {
            syncValidatedCanonToD1({
                localDbPath,
                compiledBiblePath: compiledPath,
                isGate1Passed: false,
            })
        }).toThrow(/GATE_1_PRECONDITION_FAILED/)

        expect(() => {
            syncValidatedCanonToD1({
                localDbPath: path.join(tmpDir, 'missing.db'),
                compiledBiblePath: compiledPath,
                isGate1Passed: true,
            })
        }).toThrow(/LOCAL_DB_NOT_FOUND/)

        const badHashPath = path.join(tmpDir, 'bad-bible.json')
        fs.writeFileSync(
            badHashPath,
            JSON.stringify({ _meta: { state_hash: 'short' } }),
        )
        expect(() => {
            syncValidatedCanonToD1({
                localDbPath,
                compiledBiblePath: badHashPath,
                isGate1Passed: true,
            })
        }).toThrow(/COMPILED_HASH_INVALID/)

        const sync = syncValidatedCanonToD1({
            localDbPath,
            compiledBiblePath: compiledPath,
            isGate1Passed: true,
            d1BindingTarget: 'CANON_DB',
        })
        expect(sync.success).toBe(true)
        expect(sync.syncedFactsCount).toBe(1)
        expect(sync.stateHash).toBe('c'.repeat(64))
        expect(sync.message).toBe('GATE_1_VERIFIED_D1_SYNC_READY')
    })
})
