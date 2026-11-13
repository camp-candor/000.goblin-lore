import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
    applySeriesChronologyUpdate,
    previewChronologyHorizon,
} from '../98.menu.unit/buz/chronologyMenu.buzz.js'
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

    it('preview horizon length', () => {
        const h = previewChronologyHorizon(
            { start_date: '2026-10-31', start_time: '21:00:00' },
            5,
        )
        expect(h.length).toBe(5)
    })
})
