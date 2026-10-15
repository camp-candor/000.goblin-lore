import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import {
    StandingEngine,
    SceneDependencyRecord,
} from '../src/core/ledger/standingEngine.js'
import { calculateAuditPriorityScore } from '../src/schemas/standing.js'
import {
    stampRatifiedPossession,
    calculateSalience,
} from '../src/harvest/ratificationStamper.js'
import { verifyByteZeroIntegrity } from '../src/scaffolder/entityBuilder.js'
import { ErrataManager } from '../src/core/ledger/errataManager.js'
import { ErrataRecord } from '../src/schemas/errata.js'

describe('Phase 5: Canon Lifecycle, Harvest Ratification & Append-Only Errata', () => {
    let tmpDir: string
    let errataPath: string

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(
            path.join(os.tmpdir(), 'goblin_lore_phase5_test_'),
        )
        errataPath = path.join(tmpDir, 'lore', 'errata.json')
    })

    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true })
    })

    it('guarantees zero-cascade propagation for FLAGGED_FOR_REVIEW and atomic cascade for DEPRECATED', () => {
        const dependencies: SceneDependencyRecord[] = [
            {
                scene_id: 'sc_101_01',
                depends_on_entity_id: 'char_bog',
                is_dirty: false,
            },
            {
                scene_id: 'sc_101_02',
                depends_on_entity_id: 'char_bog',
                is_dirty: false,
            },
            {
                scene_id: 'sc_102_04',
                depends_on_entity_id: 'loc_culvert',
                is_dirty: false,
            },
        ]

        // Transition to FLAGGED_FOR_REVIEW: must suppress cascade
        const flagResult = StandingEngine.executeTransition(
            'char_bog',
            'ACTIVE_ENDORSED',
            'FLAGGED_FOR_REVIEW',
            'user_continuity_editor',
            'Doubt over left arm injury timeline',
            dependencies,
            45,
        )
        expect(flagResult.cascadeFired).toBe(false)
        expect(flagResult.dirtyScenes.length).toBe(0)

        // Transition to DEPRECATED_ARCHIVED: must fire atomic cascade across dependent scenes
        const deprecateResult = StandingEngine.executeTransition(
            'char_bog',
            'FLAGGED_FOR_REVIEW',
            'DEPRECATED_ARCHIVED',
            'user_showrunner',
            'Canonical retcon applied',
            dependencies,
            46,
        )
        expect(deprecateResult.cascadeFired).toBe(true)
        expect(deprecateResult.dirtyScenes).toEqual(['sc_101_01', 'sc_101_02'])
    })

    it('executes 5-second Still Good affirmation without bumping versions or mutating hash', () => {
        const res = StandingEngine.executeStillGoodAffirmation(
            'char_bog',
            'user_showrunner',
        )
        expect(res.versionBumped).toBe(false)
        expect(res.hashMutated).toBe(false)
        expect(res.last_reconsidered_at).toBeGreaterThan(0)
    })

    it('calculates logarithmic audit priority score correctly', () => {
        // 60 days unreviewed with 9 downstream scenes: 60 * log10(10) = 60 * 1 = 60.00
        const score = calculateAuditPriorityScore(60, 9)
        expect(score).toBe(60.0)

        // 0 scenes dependent: log10(1) = 0
        expect(calculateAuditPriorityScore(100, 0)).toBe(0)
    })

    it('promotes unratified detail above 0.70 salience into Byte-0 Markdown dossier', () => {
        const candidate = {
            harvest_id: 'det_20261015_green_cup',
            suggested_slug: 'item_green_enamel_cup',
            name: 'Green Enamel Cup',
            recurrence_count: 4,
      drama_weight: 0.85,
            description: 'Chipped tin cup with peeling green enamel paint.',
            assigned_owner: 'char_bog',
            occupies_hands: 1,
            mass_grams: 120,
        }

        const salience = calculateSalience(
            candidate.recurrence_count,
            candidate.drama_weight,
        )
        expect(salience).toBeGreaterThanOrEqual(0.7)

        const receipt = stampRatifiedPossession(
            candidate,
            'user_showrunner',
            42,
        )
        expect(receipt.entity_id).toBe('item_green_enamel_cup')
        expect(verifyByteZeroIntegrity(receipt.dossier_content).valid).toBe(
            true,
        )

        // Reject promotion below 0.70 salience threshold
        const lowSalienceCandidate = {
            ...candidate,
            recurrence_count: 1,
            drama_weight: 0.2,
        }
        expect(() => {
            stampRatifiedPossession(lowSalienceCandidate, 'user_showrunner', 42)
        }).toThrow(/SALIENCE_THRESHOLD_ERROR/)
    })

    it('appends records to the Errata Ledger without mutating existing entries', () => {
        const manager = new ErrataManager(errataPath)
        const initialLedger = manager.loadLedger()
        expect(initialLedger.records.length).toBe(0)

        const record: ErrataRecord = {
            errata_id: 'err_culvert_seam_01',
            superseded_canon_sha: 'a'.repeat(64),
            active_canon_sha: 'b'.repeat(64),
            affected_entity_ids: ['loc_culvert'],
            affected_artifact_shas: ['c'.repeat(64)],
            reason: 'Culvert drainage seam relocated in Episode 102 master',
            authorized_by: 'user_showrunner',
            timestamp_utc: '2026-10-15T15:40:00.000Z',
            reanchoring_strategy: 'REMASTER_V2',
        }

        manager.appendErrata(record)
        const updated = manager.loadLedger()
        expect(updated.records.length).toBe(1)
        expect(updated.records[0].errata_id).toBe('err_culvert_seam_01')

        // Reject duplicate errata ID
        expect(() => manager.appendErrata(record)).toThrow(
            /ERRATA_DUPLICATE_ERROR/,
        )
    })
})
