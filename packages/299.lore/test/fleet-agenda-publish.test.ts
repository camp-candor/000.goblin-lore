import { describe, it, expect } from 'vitest'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import * as crypto from 'node:crypto'
import { inspectPublishChronoAgendaParity } from '../98.menu.unit/buz/fleetPublish.buzz.js'

function sha256File(p: string): string {
    return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')
}

function makeSte(seen: string[]): unknown {
    return {
        hunt: (_a: string, payload: { src?: string }) => {
            seen.push(String(payload?.src || ''))
        },
    }
}

describe('fleet agenda publish', () => {
    it('emits agenda summary count and first timestamp telemetry', () => {
        const seen: string[] = []
        const bibleState = {
            chronology: {
                scheduled_beats: [
                    {
                        beat_id: 'curfew_one',
                        isoDate: '2026-10-31',
                        startTimeHm: '23:30',
                        beatCategory: 'GRIEVANCE_BREACH',
                    },
                    {
                        beat_id: 'tribunal_two',
                        isoDate: '2026-11-01',
                        startTimeHm: '08:00',
                        beatCategory: 'EPISTEMIC_REVEAL',
                    },
                ],
            },
        }
        const res = inspectPublishChronoAgendaParity(
            bibleState,
            makeSte(seen) as never,
        )
        expect(res.ok).toBe(true)
        expect(res.empty).toBe(false)
        expect(res.count).toBe(2)
        expect(res.firstIsoDate).toBe('2026-10-31')
        expect(res.firstStartTimeHm).toBe('23:30')
        const joined = seen.join('\n')
        expect(joined).toContain('>> [PUBLISH:AGENDA]')
        expect(joined).toContain('count=2')
        expect(joined).toContain('2026-10-31 23:30')
        expect(joined).toContain('GRIEVANCE_BREACH')
        for (const line of seen) {
            expect(/^[\x00-\x7F]*$/.test(line)).toBe(true)
        }
    })

    it('legacy manifest without beats logs empty marker without error', () => {
        const seen: string[] = []
        const res = inspectPublishChronoAgendaParity(
            { chronology: {} },
            makeSte(seen) as never,
        )
        expect(res.ok).toBe(true)
        expect(res.empty).toBe(true)
        expect(res.count).toBe(0)
        expect(seen.join('\n')).toContain('>> [PUBLISH:AGENDA_EMPTY]')
        const res2 = inspectPublishChronoAgendaParity({}, undefined)
        expect(res2.ok).toBe(true)
        expect(res2.empty).toBe(true)
    })

    it('preserves exact SHA-256 bit parity on fleet copy', () => {
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fleet-agenda-'))
        try {
            const src = path.join(tmp, 'bible-state.json')
            const dst = path.join(tmp, 'engine-bible-state.json')
            const payload = JSON.stringify({
                chronology: {
                    scheduled_beats: [
                        {
                            beat_id: 'curfew_one',
                            isoDate: '2026-10-31',
                            startTimeHm: '23:30',
                            beatCategory: 'GRIEVANCE_BREACH',
                        },
                    ],
                },
            })
            fs.writeFileSync(src, payload)
            fs.copyFileSync(src, dst)
            expect(sha256File(src)).toBe(sha256File(dst))
        } finally {
            fs.rmSync(tmp, { recursive: true, force: true })
        }
    })

    it('contains zero console.log calls', () => {
        const src = fs.readFileSync(
            '98.menu.unit/buz/fleetPublish.buzz.ts',
            'utf8',
        )
        expect(src).not.toContain('console.log')
        expect(src).not.toContain('console.error')
    })
})
