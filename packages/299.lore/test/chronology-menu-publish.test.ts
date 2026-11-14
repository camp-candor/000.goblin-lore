import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
    applySeriesChronologyUpdate,
    previewChronologyHorizon,
} from '../98.menu.unit/buz/chronologyMenu.buzz.js'
import { publishSealedCanonToFleet } from '../98.menu.unit/buz/fleetPublish.buzz.js'
import { verifyByteZeroBuffer } from '../27.seed.unit/buz/seedWorldDefinitions.buzz.js'

describe('chronology menu publish', () => {
    it('updates series chronology and refreshes world/chronology.md', () => {
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'chrono-'))
        const seriesDir = path.join(tmp, 'series', 'test-series')
        fs.mkdirSync(path.join(seriesDir, 'world'), { recursive: true })
        fs.writeFileSync(
            path.join(seriesDir, 'series.config.json'),
            JSON.stringify(
                {
                    schema_version: '1.0.0',
                    series_slug: 'test-series',
                    display_name: 'Test',
                    genre_tag: 'STANDARD',
                    central_irony: 'enough chars here yes',
                    state_space: {
                        scarcity_index_bp: 0,
                        paranoia_baseline_bp: 0,
                        somatic_fatigue_enabled: true,
                        epistemic_ignorance_enabled: true,
                        gram_mass_tiers: {
                            scrap_max_grams: 50,
                            weight_max_grams: 5000,
                            bulk_min_grams: 5001,
                        },
                    },
                    action_vocabulary: {
                        permitted_kinetic_verbs: ['WALK'],
                        forbidden_verbs_global: [],
                        locomotion_taxonomies: ['a'],
                    },
                    invariant_rules: {
                        thematic_categories: [
                            'a',
                            'b',
                            'c',
                            'd',
                            'e',
                            'f',
                            'g',
                        ],
                    },
                    medium_projections: {
                        target_fps: 24,
                        audio_sample_rate_hz: 48000,
                    },
                },
                null,
                2,
            ),
        )
        const resolved = applySeriesChronologyUpdate(seriesDir, {
            start_date: '2027-01-01',
            start_time: '08:30',
        })
        expect(resolved.start_date).toBe('2027-01-01')
        const buf = fs.readFileSync(
            path.join(seriesDir, 'world', 'chronology.md'),
        )
        expect(verifyByteZeroBuffer(buf)).toBe(true)
    })

    it('rejects invalid date', () => {
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'chrono-'))
        const seriesDir = path.join(tmp, 'series', 'test-series')
        fs.mkdirSync(path.join(seriesDir, 'world'), { recursive: true })
        fs.writeFileSync(
            path.join(seriesDir, 'series.config.json'),
            JSON.stringify({ series_slug: 'test-series' }),
        )
        expect(() =>
            applySeriesChronologyUpdate(seriesDir, {
                start_date: '2025-02-29',
            }),
        ).toThrow()
    })

    it('preview horizon length and midnight rollover', () => {
        const h = previewChronologyHorizon(
            {
                start_date: '2026-10-31',
                start_time: '23:58:00',
                tick_seconds: 60,
            },
            5,
        )
        expect(h.length).toBe(5)
        expect(`${h[0].isoDate} ${h[0].clockTimeHms}`).toBe(
            '2026-10-31 23:58:00',
        )
        expect(h[0].daypart).toBe('NIGHT')
        expect(`${h[2].isoDate} ${h[2].clockTimeHms}`).toBe(
            '2026-11-01 00:00:00',
        )
        expect(h[2].daypart).toBe('NIGHT')
        expect(`${h[4].isoDate} ${h[4].clockTimeHms}`).toBe(
            '2026-11-01 00:02:00',
        )
        expect(h[4].daypart).toBe('NIGHT')
    })

    it('preserves chronology block during publishSealedCanonToFleet', async () => {
        const tmpEngine = fs.mkdtempSync(path.join(os.tmpdir(), 'chrono-pub-'))
        try {
            let pubRes: any
            await publishSealedCanonToFleet(
                {},
                {
                    idx: 'test-chrono-pub',
                    src: '000.sample-hearth',
                    dat: {
                        seriesSlug: '000.sample-hearth',
                        targetEngineRoot: tmpEngine,
                        targetSpatialRoot: path.join(tmpEngine, 'no-spatial'),
                    },
                    slv: (res: any) => {
                        pubRes = res
                    },
                } as any,
                { hunt: async () => ({}) } as any,
            )
            expect(pubRes?.pubBit?.val).toBe(1)
            const emitted = JSON.parse(
                fs.readFileSync(
                    path.join(
                        tmpEngine,
                        'compiled',
                        '000.sample-hearth',
                        'bible-state.json',
                    ),
                    'utf8',
                ),
            )
            expect(emitted.chronology?.start_date).toBeDefined()
            expect(emitted.chronology?.start_time).toBeDefined()
            expect(emitted.chronology?.tick_seconds).toBeDefined()
            expect(emitted.chronology?.start_snapshot).toBeDefined()
        } finally {
            fs.rmSync(tmpEngine, { recursive: true, force: true })
        }
    })
})
