import { describe, it, expect } from 'vitest'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { inspectPublishRecurrenceGrammarParity } from '../98.menu.unit/buz/fleetPublish.buzz'

function makeDir(
    configChrono: Record<string, unknown>,
    bibleChrono: Record<string, unknown>,
): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fleet-rec-'))
    fs.writeFileSync(
        path.join(dir, 'series.config.json'),
        JSON.stringify({
            series_slug: 'test-series',
            chronology: configChrono,
        }),
    )
    fs.writeFileSync(
        path.join(dir, 'bible-state.json'),
        JSON.stringify({ chronology: bibleChrono }),
    )
    return dir
}

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
            startTimeHm: '22:00',
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

describe('fleet publish recurrence parity', () => {
    it('passes parity and emits cns00 telemetry', () => {
        const dir = makeDir(chrono(), chrono())
        const lines: string[] = []
        const ste = {
            hunt: (_action: string, payload: { src?: string }) => {
                if (payload?.src) lines.push(String(payload.src))
            },
        }
        const res = inspectPublishRecurrenceGrammarParity(dir, ste as never)
        expect(res.ok).toBe(true)
        expect(res.rules).toBe(1)
        const tele = lines.join('\n')
        expect(tele).toContain('>> [PUBLISH:RECURRENCE]')
        expect(tele).toMatch(/rules=1 blackouts=0 next7dOccurrences=\d+/)
    })

    it('detects drift when config adds blackout without recompile', () => {
        const dir = makeDir(
            chrono({ series_blackout_dates: ['2026-12-25'] }),
            chrono(),
        )
        const lines: string[] = []
        const ste = {
            hunt: (_action: string, payload: { src?: string }) => {
                if (payload?.src) lines.push(String(payload.src))
            },
        }
        expect(() =>
            inspectPublishRecurrenceGrammarParity(dir, ste as never),
        ).toThrow('PUBLISH_RECURRENCE_DRIFT')
        expect(lines.join('\n')).toContain('[PUBLISH_RECURRENCE_DRIFT]')
    })

    it('detects drift when recurrenceRule is mutated without recompile', () => {
        const mutated = chrono()
        ;(
            mutated.scheduled_beats[0].recurrenceRule as {
                weekdayMask: string[]
            }
        ).weekdayMask = ['MON', 'FRI']
        const dir = makeDir(mutated, chrono())
        const lines: string[] = []
        const ste = {
            hunt: (_action: string, payload: { src?: string }) => {
                if (payload?.src) lines.push(String(payload.src))
            },
        }
        expect(() =>
            inspectPublishRecurrenceGrammarParity(dir, ste as never),
        ).toThrow('PUBLISH_RECURRENCE_DRIFT')
        expect(lines.join('\n')).toContain('[PUBLISH_RECURRENCE_DRIFT]')
    })
})
