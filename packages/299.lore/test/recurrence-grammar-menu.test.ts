import { describe, it, expect } from 'vitest'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { CONFIGURE_RECURRENCE_GRAMMAR } from '../98.menu.unit/menu.action'
import {
    AGENDA_SUBMENU_CHOICES,
    RECURRENCE_MENU_CHOICE,
    configureBeatRecurrenceRule,
    manageSeriesBlackoutDates,
    previewRecurrenceCalendarHorizon,
} from '../98.menu.unit/buz/chronologyMenu.buzz'

function makeSeries(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rec-menu-'))
    const config = {
        series_slug: 'test-series',
        schema_version: '1.0.0',
        display_name: 'Test',
        genre_tag: 'STANDARD',
        central_irony: 'enough chars here for irony test',
        state_space: {
            scarcity_index_bp: 0,
            paranoia_baseline_bp: 0,
            gram_mass_tiers: {
                scrap_max_grams: 50,
                weight_max_grams: 5000,
                bulk_min_grams: 5001,
            },
        },
        action_vocabulary: {
            permitted_kinetic_verbs: ['WALK'],
            locomotion_taxonomies: ['a'],
        },
        invariant_rules: {
            thematic_categories: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
        },
        medium_projections: { target_fps: 24, audio_sample_rate_hz: 48000 },
        chronology: {
            calendar_system: 'GREGORIAN_24H',
            start_date: '2026-10-31',
            start_time: '21:00:00',
            tick_seconds: 60,
            frames_per_second: 24,
            timezone_label: 'UTC+00:00',
            era_label: 'CANON_PRESENT',
            scheduled_beats: [
                {
                    beat_id: 'court_session',
                    title: 'Court Session',
                    isoDate: '2026-11-06',
                    startTimeHm: '22:00',
                    beatCategory: 'GRIEVANCE_BREACH',
                },
            ],
        },
    }
    fs.writeFileSync(
        path.join(dir, 'series.config.json'),
        JSON.stringify(config, null, 2),
    )
    return dir
}

describe('recurrence grammar menu', () => {
    it('exports Configure Recurrence Grammar action', () => {
        expect(CONFIGURE_RECURRENCE_GRAMMAR).toBe(
            '[Menu action] Configure Recurrence Grammar',
        )
    })

    it('exposes recurrence submenu choices', () => {
        expect(RECURRENCE_MENU_CHOICE).toBe(
            '[7] CALENDAR RECURRENCE & BLACKOUT RULES',
        )
        expect(AGENDA_SUBMENU_CHOICES).toContain(
            '[5] CONFIGURE RECURRENCE & BLACKOUTS',
        )
    })

    it('assigns recurrence rule and refreshes Byte-0 dossier', () => {
        const dir = makeSeries()
        const beats = configureBeatRecurrenceRule(dir, 'court_session', {
            frequency: 'WEEKLY_MASK',
            weekdayMask: ['FRI'],
        })
        expect(beats.find((b) => b.beat_id === 'court_session')).toBeDefined()
        const buf = fs.readFileSync(path.join(dir, 'world', 'chrono-agenda.md'))
        expect(buf[0]).toBe(0x2d)
        expect(buf[1]).toBe(0x2d)
        expect(buf[2]).toBe(0x2d)
        expect(buf[3]).toBe(0x0a)
        expect(buf.includes(0x0d)).toBe(false)
        const text = buf.toString('utf8')
        expect(text).toContain('WEEKLY_MASK')
    })

    it('rejects invalid blackout date and missing discriminator before mutation', () => {
        const dir = makeSeries()
        expect(() =>
            configureBeatRecurrenceRule(dir, 'court_session', {
                frequency: 'DAILY',
                blackoutDates: ['2025-02-29'],
            }),
        ).toThrow('INVALID_BLACKOUT_DATE')
        expect(() =>
            configureBeatRecurrenceRule(dir, 'court_session', {
                frequency: 'WEEKLY_MASK',
            }),
        ).toThrow('RECURRENCE_MISSING_WEEKDAY_MASK')
        const raw = JSON.parse(
            fs.readFileSync(path.join(dir, 'series.config.json'), 'utf8'),
        )
        expect(
            (raw.chronology.scheduled_beats[0] as { recurrenceRule?: unknown })
                .recurrenceRule,
        ).toBeUndefined()
    })

    it('manages series blackout CRUD with validation', () => {
        const dir = makeSeries()
        const added = manageSeriesBlackoutDates(dir, 'ADD', '2026-12-25')
        expect(added).toContain('2026-12-25')
        expect(() =>
            manageSeriesBlackoutDates(dir, 'ADD', '2025-02-29'),
        ).toThrow('INVALID_BLACKOUT_DATE')
        const removed = manageSeriesBlackoutDates(dir, 'REMOVE', '2026-12-25')
        expect(removed).not.toContain('2026-12-25')
    })

    it('previews 14-day horizon to cns00 in ASCII', () => {
        const dir = makeSeries()
        configureBeatRecurrenceRule(dir, 'court_session', {
            frequency: 'DAILY',
        })
        const raw = JSON.parse(
            fs.readFileSync(path.join(dir, 'series.config.json'), 'utf8'),
        )
        const lines: string[] = []
        const ste = {
            hunt: (_action: string, payload: { src?: string }) => {
                if (payload?.src) lines.push(String(payload.src))
            },
        }
        const out = previewRecurrenceCalendarHorizon(
            raw.chronology,
            14,
            ste as never,
        )
        expect(out.length).toBeGreaterThan(0)
        expect(out[0]).toContain('>> [RECURRENCE:PREVIEW]')
        for (const l of out) {
            for (let i = 0; i < l.length; i++) {
                expect(l.charCodeAt(i) <= 127).toBe(true)
            }
        }
        expect(lines.join('\n')).toContain('[RECURRENCE:PREVIEW]')
    })
})
