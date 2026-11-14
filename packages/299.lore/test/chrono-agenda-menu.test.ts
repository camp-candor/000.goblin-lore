import { describe, it, expect } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import {
    MANAGE_CHRONO_AGENDA,
    ManageChronoAgenda,
} from '../98.menu.unit/menu.action.js'
import {
    AGENDA_MENU_CHOICE,
    AGENDA_SUBMENU_CHOICES,
    runChronologyMenu,
    upsertScheduledAgendaBeat,
    removeScheduledAgendaBeat,
    previewChronoAgendaTimeline,
} from '../98.menu.unit/buz/chronologyMenu.buzz.js'
import { MenuModel } from '../98.menu.unit/menu.model.js'
import { verifyByteZeroBuffer } from '../27.seed.unit/buz/seedWorldDefinitions.buzz.js'

function isAscii(s: string): boolean {
    for (let i = 0; i < s.length; i++) {
        if (s.charCodeAt(i) > 0x7f) return false
    }
    return true
}

const beat = (over: Record<string, unknown>) => ({
    beat_id: 'midnight_curfew',
    title: 'Midnight Curfew',
    isoDate: '2026-10-31',
    startTimeHm: '23:30',
    beatCategory: 'GRIEVANCE_BREACH',
    reserveCooldownTicks: 2,
    priorityBps: 9500,
    recurringDaily: false,
    toleranceTicks: 0,
    ...over,
})

function writeBaseConfig(dir: string, chrono?: Record<string, unknown>) {
    fs.writeFileSync(
        path.join(dir, 'series.config.json'),
        JSON.stringify(
            {
                series_slug: path.basename(dir),
                chronology: {
                    start_date: '2026-10-31',
                    start_time: '21:00:00',
                    tick_seconds: 60,
                    ...(chrono ?? {}),
                },
            },
            null,
            2,
        ) + '\n',
        'utf8',
    )
}

describe('chrono agenda menu', () => {
    it('exports MANAGE_CHRONO_AGENDA action and [6] submenu choice', async () => {
        expect(MANAGE_CHRONO_AGENDA).toBe('[Menu action] Manage Chrono Agenda')
        expect(AGENDA_MENU_CHOICE).toBe(
            '[6] SCHEDULED STORY APPOINTMENTS (AGENDA)',
        )
        expect(AGENDA_SUBMENU_CHOICES).toEqual([
            '[1] LIST SCHEDULED APPOINTMENTS',
            '[2] ADD SCHEDULED STORY BEAT',
            '[3] REMOVE SCHEDULED BEAT BY ID',
            '[4] PREVIEW RESERVE COUNTDOWN TIMELINE',
            '[5] CONFIGURE RECURRENCE & BLACKOUTS',
            '[<] BACK TO CHRONOLOGY MENU',
        ])
        const prevLib = (globalThis as any).LIBRARY
        ;(globalThis as any).LIBRARY = {
            hunt: async (act: string) => {
                if (act === '[Grid action] Update Grid') {
                    return { grdBit: { dat: { mesh: 'left-4-col' } } }
                }
                if (act === '[Open action] Open Choice') {
                    return { chcBit: { src: '[<] RETURN TO LORE MENU' } }
                }
                return {}
            },
        }
        try {
            let resolved: any = null
            await runChronologyMenu(new MenuModel(), {
                idx: 'agenda-choice-list',
                dat: { seriesDir: os.tmpdir() },
                slv: (res: any) => {
                    resolved = res
                },
            } as any)
            expect(resolved?.mnuBit?.lst).toContain(AGENDA_MENU_CHOICE)
        } finally {
            ;(globalThis as any).LIBRARY = prevLib
        }
    })

    it('persists add and remove with series.config.json sync', () => {
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'agenda-crud-'))
        try {
            writeBaseConfig(tmp)
            const afterAdd = upsertScheduledAgendaBeat(
                tmp,
                beat({ beat_id: 'curfew_one' }),
            )
            expect(afterAdd.map((b) => b.beat_id)).toContain('curfew_one')
            const saved = JSON.parse(
                fs.readFileSync(path.join(tmp, 'series.config.json'), 'utf8'),
            )
            expect(
                saved.chronology.scheduled_beats.map((b: any) => b.beat_id),
            ).toContain('curfew_one')
            upsertScheduledAgendaBeat(tmp, beat({ beat_id: 'tribunal_two' }))
            const afterRemove = removeScheduledAgendaBeat(tmp, 'curfew_one')
            expect(afterRemove.map((b) => b.beat_id)).not.toContain(
                'curfew_one',
            )
            expect(afterRemove.map((b) => b.beat_id)).toContain('tribunal_two')
            const saved2 = JSON.parse(
                fs.readFileSync(path.join(tmp, 'series.config.json'), 'utf8'),
            )
            expect(
                saved2.chronology.scheduled_beats.map((b: any) => b.beat_id),
            ).toEqual(['tribunal_two'])
        } finally {
            fs.rmSync(tmp, { recursive: true, force: true })
        }
    })

    it('rejects invalid calendar dates and past timestamps before mutation', () => {
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'agenda-fail-'))
        try {
            writeBaseConfig(tmp)
            const before = fs.readFileSync(
                path.join(tmp, 'series.config.json'),
                'utf8',
            )
            expect(() =>
                upsertScheduledAgendaBeat(
                    tmp,
                    beat({ beat_id: 'bad_date', isoDate: '2025-02-29' }),
                ),
            ).toThrow()
            expect(() =>
                upsertScheduledAgendaBeat(
                    tmp,
                    beat({ beat_id: 'past_one', isoDate: '2026-10-30' }),
                ),
            ).toThrow(/AGENDA_IN_THE_PAST/)
            expect(() =>
                upsertScheduledAgendaBeat(
                    tmp,
                    beat({ beat_id: 'bad_time', startTimeHm: '25:00' }),
                ),
            ).toThrow()
            expect(
                fs.readFileSync(path.join(tmp, 'series.config.json'), 'utf8'),
            ).toBe(before)
            expect(
                fs.existsSync(path.join(tmp, 'world', 'chrono-agenda.md')),
            ).toBe(false)
        } finally {
            fs.rmSync(tmp, { recursive: true, force: true })
        }
    })

    it('refreshes world/chrono-agenda.md at Byte 0 with LF-only content', () => {
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'agenda-byte0-'))
        try {
            writeBaseConfig(tmp)
            upsertScheduledAgendaBeat(tmp, beat({ beat_id: 'curfew_one' }))
            const buf = fs.readFileSync(
                path.join(tmp, 'world', 'chrono-agenda.md'),
            )
            expect([buf[0], buf[1], buf[2], buf[3]]).toEqual([
                0x2d, 0x2d, 0x2d, 0x0a,
            ])
            expect(buf.includes(0x0d)).toBe(false)
            expect(verifyByteZeroBuffer(buf)).toBe(true)
            const text = fs.readFileSync(
                path.join(tmp, 'world', 'chrono-agenda.md'),
                'utf8',
            )
            expect(text.slice(0, 4)).toBe('---\n')
            expect(isAscii(text)).toBe(true)
        } finally {
            fs.rmSync(tmp, { recursive: true, force: true })
        }
    })

    it('previews cns00 timeline rows in exact ASCII format', () => {
        const lines: string[] = []
        const ste: any = {
            hunt: (act: string, bal: any) => {
                if (
                    act === '[Console action] Update Console' &&
                    bal?.idx === 'cns00'
                ) {
                    lines.push(String(bal?.src || ''))
                }
            },
        }
        const out = previewChronoAgendaTimeline(
            {
                start_date: '2026-10-31',
                start_time: '21:00:00',
                tick_seconds: 60,
                scheduled_beats: [
                    beat({
                        beat_id: 'tentpole_a',
                        isoDate: '2026-10-31',
                        startTimeHm: '21:10',
                    }),
                ],
            },
            ste,
        )
        expect(out[0]).toBe(
            '>> [AGENDA:BEAT] #1 | 2026-10-31 21:10 | T+10 (RES:8..10) | GRIEVANCE_BREACH | Midnight Curfew',
        )
        expect(lines).toContain(out[0])
        for (const l of [...out, ...lines]) {
            expect(isAscii(l)).toBe(true)
        }
        const empty: string[] = []
        const ste2: any = {
            hunt: (act: string, bal: any) => {
                if (act === '[Console action] Update Console') {
                    empty.push(String(bal?.src || ''))
                }
            },
        }
        const outEmpty = previewChronoAgendaTimeline(
            { start_date: '2026-10-31', start_time: '21:00:00' },
            ste2,
        )
        expect(outEmpty[0]).toContain('>> [AGENDA:EMPTY]')
    })

    it('binds net on every CHOICE_OPEN and INPUT_OPEN in agenda submenu', async () => {
        const repoRoot = path.resolve(__dirname, '../../../')
        const slug = 'vitest-tmp-agenda-net'
        const seriesDir = path.join(repoRoot, 'series', slug)
        try {
            fs.mkdirSync(seriesDir, { recursive: true })
            writeBaseConfig(seriesDir)
            const calls: Array<{ act: string; net: unknown }> = []
            const queue: Array<() => unknown> = [
                () => ({ chcBit: { src: AGENDA_MENU_CHOICE } }),
                () => ({ chcBit: { src: '[2] ADD SCHEDULED STORY BEAT' } }),
                () => ({ putBit: { src: 'net_beat' } }),
                () => ({ putBit: { src: 'Net Beat Title' } }),
                () => ({ putBit: { src: '2026-10-31' } }),
                () => ({ putBit: { src: '23:45' } }),
                () => ({ chcBit: { src: 'GRIEVANCE_BREACH' } }),
                () => ({ putBit: { src: '3' } }),
            ]
            const prevLib = (globalThis as any).LIBRARY
            ;(globalThis as any).LIBRARY = {
                hunt: async (act: string, bal: any) => {
                    if (act === '[Grid action] Update Grid') {
                        return { grdBit: { dat: { mesh: 'left-4-col' } } }
                    }
                    if (
                        act === '[Open action] Open Choice' ||
                        act === '[Open action] Open Input'
                    ) {
                        calls.push({ act, net: (bal as any)?.net })
                        const next = queue.shift()
                        if (next) return next()
                        return {
                            chcBit: { src: '[<] BACK TO CHRONOLOGY MENU' },
                        }
                    }
                    return {}
                },
            }
            try {
                await runChronologyMenu(new MenuModel(), {
                    idx: 'agenda-net-add',
                    dat: { activeSeries: slug, repoRoot },
                } as any)
            } finally {
                ;(globalThis as any).LIBRARY = prevLib
            }
            expect(calls.length).toBeGreaterThan(3)
            for (const c of calls) {
                expect(c.net).toEqual({ mesh: 'left-4-col' })
            }
            const inputCalls = calls.filter(
                (c) => c.act === '[Open action] Open Input',
            )
            expect(inputCalls.length).toBeGreaterThan(0)
            const saved = JSON.parse(
                fs.readFileSync(
                    path.join(seriesDir, 'series.config.json'),
                    'utf8',
                ),
            )
            expect(
                saved.chronology.scheduled_beats.map((b: any) => b.beat_id),
            ).toContain('net_beat')
        } finally {
            fs.rmSync(seriesDir, { recursive: true, force: true })
        }
    })

    it('dispatches MANAGE_CHRONO_AGENDA headlessly without Blessed I/O', async () => {
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'agenda-headless-'))
        try {
            writeBaseConfig(tmp)
            const logs: string[] = []
            const ste: any = {
                hunt: (act: string, bal: any) => {
                    if (act === '[Console action] Update Console') {
                        logs.push(String(bal?.src || ''))
                    }
                },
            }
            let resolved: any = null
            await runChronologyMenu(
                new MenuModel(),
                {
                    idx: 'agenda-headless-add',
                    dat: {
                        action: 'MANAGE_CHRONO_AGENDA',
                        seriesDir: tmp,
                        agendaBeat: beat({ beat_id: 'headless_one' }),
                    },
                    slv: (res: any) => {
                        resolved = res
                    },
                } as any,
                ste,
            )
            expect(resolved?.mnuBit?.val).toBe(1)
            expect(
                resolved?.mnuBit?.dat?.beats?.map((b: any) => b.beat_id),
            ).toContain('headless_one')
            expect(logs.some((l) => l.includes('>> [AGENDA:SAVED]'))).toBe(true)
            let preview: any = null
            await runChronologyMenu(
                new MenuModel(),
                {
                    idx: 'agenda-headless-preview',
                    dat: {
                        action: 'MANAGE_CHRONO_AGENDA',
                        previewAgenda: true,
                        seriesDir: tmp,
                    },
                    slv: (res: any) => {
                        preview = res
                    },
                } as any,
                ste,
            )
            expect(preview?.mnuBit?.val).toBe(1)
            expect((preview?.mnuBit?.dat?.preview as string[])[0]).toContain(
                '>> [AGENDA:BEAT]',
            )
        } finally {
            fs.rmSync(tmp, { recursive: true, force: true })
        }
    })

    it('routes ManageChronoAgenda action class through menu switchboard', () => {
        const inst = new ManageChronoAgenda({ idx: 'x' } as any)
        expect(inst.type).toBe(MANAGE_CHRONO_AGENDA)
    })

    it('contains zero console.log calls', () => {
        for (const rel of [
            '98.menu.unit/buz/chronologyMenu.buzz.ts',
            '98.menu.unit/buz/00.menu.buzz.ts',
        ]) {
            const src = fs.readFileSync(rel, 'utf8')
            expect(src).not.toContain('console.log')
            expect(src).not.toContain('console.error')
        }
    })
})
