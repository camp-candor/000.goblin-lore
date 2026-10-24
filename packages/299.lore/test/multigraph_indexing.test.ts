import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { resolveActiveSeriesDirBuzz } from '../29.series.unit/buz/series.buzz.js'
import {
    bootstrapGraphRegistryBuzz,
    queryForeignKeyCandidatesBuzz,
} from '../34.target.unit/buz/target.buzz.js'
import { validateNamespacedSpawnTargetBuzz } from '../10.escalation.unit/buz/escalation.buzz.js'
import { reconcileReciprocalLinksBuzz } from '../01.location.unit/buz/location.buzz.js'
import { TargetModel } from '../34.target.unit/target.model.js'
import { SeriesModel } from '../29.series.unit/series.model.js'

describe('Phase 2: In-Memory Corpus Multigraph Indexing', () => {
    let tempRepoRoot: string
    let tempSeriesDir: string

    beforeEach(() => {
        TargetModel.getInstance().clear()
        SeriesModel.getInstance().reset()

        tempRepoRoot = fs.mkdtempSync(
            path.join(os.tmpdir(), 'goblin-lore-test-'),
        )
        tempSeriesDir = path.join(tempRepoRoot, 'series', 'test-series')

        fs.mkdirSync(path.join(tempSeriesDir, 'characters'), {
            recursive: true,
        })
        fs.mkdirSync(path.join(tempSeriesDir, 'locations'), { recursive: true })
        fs.mkdirSync(path.join(tempSeriesDir, 'possessions'), {
            recursive: true,
        })
        fs.mkdirSync(path.join(tempSeriesDir, 'grievances'), {
            recursive: true,
        })
        fs.mkdirSync(path.join(tempSeriesDir, 'world'), { recursive: true })

        // Seed test files
        fs.writeFileSync(
            path.join(tempSeriesDir, 'characters', 'char_bog.md'),
            '---\nid: char_bog\nname: Bog\nhome_location: loc_warm_pipe\n---\nBog narrative.',
            'utf8',
        )

        fs.writeFileSync(
            path.join(tempSeriesDir, 'characters', 'char_wart.md'),
            '---\nid: char_wart\nname: Wart\n---\nWart narrative.',
            'utf8',
        )

        fs.writeFileSync(
            path.join(tempSeriesDir, 'locations', 'loc_warm_pipe.md'),
            '---\nid: loc_warm_pipe\nname: Warm Pipe\nconnected_locations:\n  - loc_attic\n---\nPipe.',
            'utf8',
        )

        fs.writeFileSync(
            path.join(tempSeriesDir, 'locations', 'loc_attic.md'),
            '---\nid: loc_attic\nname: Attic Stair\nconnected_locations: []\n---\nAttic.',
            'utf8',
        )

        fs.writeFileSync(
            path.join(tempSeriesDir, 'grievances', 'grv_fuel_theft.md'),
            '---\nid: grv_fuel_theft\ntitle: Fuel Theft\nparticipants_primary:\n  - char_bog\n  - char_wart\n---\nGrievance.',
            'utf8',
        )
    })

    afterEach(() => {
        fs.rmSync(tempRepoRoot, { recursive: true, force: true })
    })

    describe('Task 2.1: Active Series Workspace Path Resolver', () => {
        it('resolves and binds existing series root directory', () => {
            const res = resolveActiveSeriesDirBuzz('test-series', tempRepoRoot)
            expect(res.success).toBe(true)
            expect(res.seriesPath).toBe(tempSeriesDir)
            expect(SeriesModel.getInstance().getState().activeSeriesSlug).toBe(
                'test-series',
            )
        })

        it('rejects non-existent series directory', () => {
            const res = resolveActiveSeriesDirBuzz(
                'missing-series',
                tempRepoRoot,
            )
            expect(res.success).toBe(false)
            expect(res.message).toContain('Series directory does not exist')
        })
    })

    describe('Task 2.2: Local Markdown Corpus Pre-Indexer', () => {
        it('indexes all valid Markdown dossiers into memory', () => {
            const res = bootstrapGraphRegistryBuzz(tempSeriesDir)
            expect(res.success).toBe(true)
            expect(res.totalIndexed).toBe(5)
            expect(res.domainCounts.character).toBe(2)
            expect(res.domainCounts.location).toBe(2)
            expect(res.domainCounts.grievance).toBe(1)

            const bogNode = TargetModel.getInstance().getNode('char_bog')
            expect(bogNode).toBeDefined()
            expect(bogNode?.title).toBe('Bog')
            expect(bogNode?.references).toContain('loc_warm_pipe')
        })

        it('skips template and retired dossiers during bootstrap', () => {
            fs.writeFileSync(
                path.join(tempSeriesDir, 'characters', '_template.md'),
                '---\nid: char_template\n---\nTemplate.',
                'utf8',
            )
            const res = bootstrapGraphRegistryBuzz(tempSeriesDir)
            expect(res.totalIndexed).toBe(5)
            expect(TargetModel.getInstance().hasNode('char_template')).toBe(
                false,
            )
        })
    })

    describe('Task 2.3: Fuzzy Foreign-Key Typeahead Provider', () => {
        beforeEach(() => {
            bootstrapGraphRegistryBuzz(tempSeriesDir)
        })

        it('filters foreign keys by domain prefix', () => {
            const characters = queryForeignKeyCandidatesBuzz('char_')
            expect(characters).toEqual(['char_bog', 'char_wart'])

            const locations = queryForeignKeyCandidatesBuzz('loc_')
            expect(locations).toEqual(['loc_attic', 'loc_warm_pipe'])
        })

        it('filters foreign keys by query substring', () => {
            const matches = queryForeignKeyCandidatesBuzz('char_', 'war')
            expect(matches).toEqual(['char_wart'])
        })
    })

    describe('Task 2.4: Namespaced Spawn Target Validator', () => {
        beforeEach(() => {
            bootstrapGraphRegistryBuzz(tempSeriesDir)
        })

        it('accepts valid namespaced grievance pointer existing in registry', () => {
            const res = validateNamespacedSpawnTargetBuzz(
                'grievance:grv_fuel_theft',
            )
            expect(res.success).toBe(true)
            expect(res.code).toBe('OK')
        })

        it('rejects non-namespaced target string', () => {
            const res = validateNamespacedSpawnTargetBuzz('grv_fuel_theft')
            expect(res.success).toBe(false)
            expect(res.code).toBe('INVALID_SPAWN_NAMESPACE')
        })

        it('rejects non-existent child grievance pointer', () => {
            const res = validateNamespacedSpawnTargetBuzz(
                'grievance:grv_nonexistent',
            )
            expect(res.success).toBe(false)
            expect(res.code).toBe('TARGET_NOT_FOUND')
        })
    })

    describe('Task 2.5: Reciprocal Spatial Link Reconciler', () => {
        beforeEach(() => {
            bootstrapGraphRegistryBuzz(tempSeriesDir)
        })

        it('appends reciprocal location link and preserves Byte-0 alignment', () => {
            const res = reconcileReciprocalLinksBuzz(
                'loc_warm_pipe',
                'loc_attic',
            )
            expect(res.success).toBe(true)
            expect(res.alreadyLinked).toBe(false)

            const updatedAttic = fs.readFileSync(
                path.join(tempSeriesDir, 'locations', 'loc_attic.md'),
                'utf8',
            )
            expect(updatedAttic.startsWith('---\n')).toBe(true)
            expect(updatedAttic).toContain('loc_warm_pipe')
        })

        it('is idempotent when reciprocal link is already present', () => {
            reconcileReciprocalLinksBuzz('loc_warm_pipe', 'loc_attic')
            const secondRun = reconcileReciprocalLinksBuzz(
                'loc_warm_pipe',
                'loc_attic',
            )
            expect(secondRun.success).toBe(true)
            expect(secondRun.alreadyLinked).toBe(true)
        })
    })
})
