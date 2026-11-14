import { describe, it, expect } from 'vitest'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import * as crypto from 'node:crypto'
import {
    buildChronoAgendaDossier,
    generateChronoAgendaDossierMarkdown,
    seedChronoAgendaDossier,
} from '../27.seed.unit/buz/seedWorldDefinitions.buzz'
import {
    resolveSealedAgendaChronology,
    canonicalizeSealedChronology,
    jcsSerialize,
} from '../43.compile.unit/buz/compile.buzz'

const chrono = (extra: Record<string, unknown> = {}) => ({
    calendar_system: 'GREGORIAN_24H',
    start_date: '2026-10-31',
    start_time: '21:00:00',
    tick_seconds: 60,
    frames_per_second: 24,
    timezone_label: 'UTC+00:00',
    era_label: 'CANON_PRESENT',
    scheduled_beats: [
        {
            beat_id: 'friday_court',
            title: 'Friday Court',
            isoDate: '2026-10-31',
            startTimeHm: '09:00',
            beatCategory: 'GRIEVANCE_BREACH',
            recurrenceRule: {
                frequency: 'WEEKLY_MASK',
                weekdayMask: ['FRI'],
                blackoutShiftPolicy: 'SKIP',
            },
        },
    ],
    ...extra,
})

describe('recurrence compile seal', () => {
    it('emits Byte-0 dossier with recurrence columns and preview', () => {
        const content = buildChronoAgendaDossier(
            { series_slug: 'test-series' },
            chrono({ series_blackout_dates: ['2026-12-25'] }) as never,
            [
                {
                    beat_id: 'friday_court',
                    isoDate: '2026-10-31',
                    startTimeHm: '09:00',
                    beatCategory: 'GRIEVANCE_BREACH',
                    targetTick: 0,
                    reserveStartTick: 0,
                    reserveCooldownTicks: 2,
                    valid: true,
                },
            ],
        )
        expect(content.charCodeAt(0)).toBe(0x2d)
        expect(content.charCodeAt(1)).toBe(0x2d)
        expect(content.charCodeAt(2)).toBe(0x2d)
        expect(content.charCodeAt(3)).toBe(0x0a)
        expect(content).not.toContain('\r')
        expect(content).toContain('frequency')
        expect(content).toContain('WEEKLY_MASK')
        expect(content).toContain('FRI')
        expect(content).toContain('SKIP')
        expect(content).toContain('series_blackout_dates')
        expect(content).toContain('2026-12-25')
        expect(content).toContain('14-Day Recurring Occurrence Preview')
        expect(generateChronoAgendaDossierMarkdown).toBe(
            buildChronoAgendaDossier,
        )
    })

    it('seedChronoAgendaDossier writes Byte-0 file', () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rec-seal-'))
        const receipt = seedChronoAgendaDossier(
            dir,
            'test-series',
            { series_slug: 'test-series' },
            chrono({ series_blackout_dates: ['2026-12-25'] }) as never,
            undefined,
        )
        expect(receipt.byteZeroVerified).toBe(true)
        const buf = fs.readFileSync(receipt.absolutePath)
        expect(buf[0]).toBe(0x2d)
        expect(buf[1]).toBe(0x2d)
        expect(buf[2]).toBe(0x2d)
        expect(buf[3]).toBe(0x0a)
        expect(buf.includes(0x0d)).toBe(false)
    })

    it('rejects dead-end blackout trap', () => {
        const dead = chrono({
            scheduled_beats: [
                {
                    beat_id: 'doomed',
                    title: 'Doomed',
                    isoDate: '2026-10-31',
                    startTimeHm: '22:00',
                    beatCategory: 'GRIEVANCE_BREACH',
                    recurrenceRule: {
                        frequency: 'DAILY',
                        untilIsoDate: '2026-11-01',
                        blackoutDates: ['2026-10-31', '2026-11-01'],
                        blackoutShiftPolicy: 'SKIP',
                    },
                },
            ],
        })
        expect(() => resolveSealedAgendaChronology({}, dead as never)).toThrow(
            'RECURRENCE_ZERO_MATCH_IN_HORIZON',
        )
    })

    it('JCS hash invariant under array permutation', () => {
        const base = chrono({
            series_blackout_dates: ['2026-12-25', '2026-11-01'],
            scheduled_beats: [
                {
                    beat_id: 'friday_court',
                    title: 'Friday Court',
                    isoDate: '2026-10-31',
                    startTimeHm: '09:00',
                    beatCategory: 'GRIEVANCE_BREACH',
                    recurrenceRule: {
                        frequency: 'WEEKLY_MASK',
                        weekdayMask: ['FRI', 'MON'],
                        blackoutDates: ['2026-12-25', '2026-11-01'],
                        blackoutShiftPolicy: 'SKIP',
                    },
                },
            ],
        })
        const shuffled = chrono({
            series_blackout_dates: ['2026-11-01', '2026-12-25'],
            scheduled_beats: [
                {
                    beat_id: 'friday_court',
                    title: 'Friday Court',
                    isoDate: '2026-10-31',
                    startTimeHm: '09:00',
                    beatCategory: 'GRIEVANCE_BREACH',
                    recurrenceRule: {
                        frequency: 'WEEKLY_MASK',
                        weekdayMask: ['MON', 'FRI'],
                        blackoutDates: ['2026-11-01', '2026-12-25'],
                        blackoutShiftPolicy: 'SKIP',
                    },
                },
            ],
        })
        const a = canonicalizeSealedChronology(base as never)
        const b = canonicalizeSealedChronology(shuffled as never)
        const ha = crypto
            .createHash('sha256')
            .update(jcsSerialize(a, false))
            .digest('hex')
        const hb = crypto
            .createHash('sha256')
            .update(jcsSerialize(b, false))
            .digest('hex')
        expect(ha).toBe(hb)

        const mutated = chrono({
            series_blackout_dates: ['2026-12-25', '2026-11-01', '2026-11-02'],
            scheduled_beats: (base.scheduled_beats as unknown[]).slice(),
        })
        const c = canonicalizeSealedChronology(mutated as never)
        const hc = crypto
            .createHash('sha256')
            .update(jcsSerialize(c, false))
            .digest('hex')
        expect(hc).not.toBe(ha)
    })
})
