import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { CompileModel } from '../43.compile.unit/compile.model.js'
import {
    pass3Seal,
    resolveSealedAgendaChronology,
} from '../43.compile.unit/buz/compile.buzz.js'
import { SeriesModel } from '../29.series.unit/series.model.js'
import { scaffoldSeriesTree } from '../29.series.unit/buz/scaffoldSeriesTree.buzz.js'
import {
    buildChronoAgendaDossier,
    verifyByteZeroBuffer,
} from '../27.seed.unit/buz/seedWorldDefinitions.buzz.js'
import { computeAgendaBeatTickOffset } from '../05.clock.unit/buz/clock.buzz.js'
import { ScheduledBeatSchema } from '../38.types.unit/fce/chronology.interface.js'

const repoRoot = path.resolve(__dirname, '../../../')

function makeConfig(slug: string, chronology?: Record<string, unknown>) {
    return {
        schema_version: '1.0.0',
        series_slug: slug,
        display_name: 'Agenda Seal Test',
        genre_tag: 'STANDARD',
        central_irony: 'Testing sealed agenda dossier foreign keys',
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
            thematic_categories: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
        },
        medium_projections: { target_fps: 24, audio_sample_rate_hz: 48000 },
        ...(chronology ? { chronology } : {}),
    }
}

const beat = (over: Record<string, unknown>) =>
    ScheduledBeatSchema.parse({
        beat_id: 'curfew_one',
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

describe('chrono agenda seal', () => {
    it('builds Byte-0 LF-only world/chrono-agenda.md content', () => {
        const chrono = {
            start_date: '2026-10-31',
            start_time: '21:00:00',
            tick_seconds: 60,
        }
        const b1 = beat({ beat_id: 'a_first' })
        const b2 = beat({ beat_id: 'b_second', startTimeHm: '23:45' })
        const offsets = [b1, b2].map((b) =>
            computeAgendaBeatTickOffset(chrono as never, b),
        )
        const md = buildChronoAgendaDossier(
            { series_slug: 'agenda-seal' },
            chrono,
            offsets,
        )
        expect(md.charCodeAt(0)).toBe(0x2d)
        expect(md.slice(0, 4)).toBe('---\n')
        expect(md).not.toContain('\r')
        expect(md).not.toContain('﻿')
        const buf = Buffer.from(md, 'utf8')
        expect([buf[0], buf[1], buf[2], buf[3]]).toEqual([
            0x2d, 0x2d, 0x2d, 0x0a,
        ])
        expect(buf.includes(0x0d)).toBe(false)
        expect(verifyByteZeroBuffer(buf)).toBe(true)
        expect(md).toContain('a_first')
        expect(md).toContain('b_second')
    })

    it('rejects dangling location and participant refs fail-closed', () => {
        const chrono = {
            start_date: '2026-10-31',
            start_time: '21:00:00',
            tick_seconds: 60,
            frames_per_second: 24,
            timezone_label: 'UTC+00:00',
            era_label: 'CANON_PRESENT',
            scheduled_beats: [
                beat({ beat_id: 'bad_loc', locationId: 'loc_missing' }),
            ],
        }
        expect(() =>
            resolveSealedAgendaChronology({}, chrono as never),
        ).toThrow(/AGENDA_UNKNOWN_ENTITY_REF/)
        const chrono2 = {
            ...(chrono as Record<string, unknown>),
            scheduled_beats: [
                beat({ beat_id: 'bad_char', participantIds: ['char_ghost'] }),
            ],
        }
        expect(() =>
            resolveSealedAgendaChronology({}, chrono2 as never),
        ).toThrow(/AGENDA_UNKNOWN_ENTITY_REF/)
        const okCatalog = {
            loc_hall: { entity_type: 'location' },
            char_aria: { entity_type: 'character' },
        }
        const chrono3 = {
            ...(chrono as Record<string, unknown>),
            scheduled_beats: [
                beat({
                    beat_id: 'good_refs',
                    locationId: 'loc_hall',
                    participantIds: ['char_aria'],
                }),
            ],
        }
        expect(() =>
            resolveSealedAgendaChronology(okCatalog, chrono3 as never),
        ).not.toThrow()
    })

    it('fails closed on past non-recurring beats and seals sorted beats pre-hash', () => {
        const pastChrono = {
            start_date: '2026-10-31',
            start_time: '21:00:00',
            tick_seconds: 60,
            frames_per_second: 24,
            timezone_label: 'UTC+00:00',
            era_label: 'CANON_PRESENT',
            scheduled_beats: [
                beat({ beat_id: 'past_one', isoDate: '2026-10-30' }),
            ],
        }
        expect(() =>
            resolveSealedAgendaChronology({}, pastChrono as never),
        ).toThrow(/AGENDA_IN_THE_PAST/)
        const unsorted = {
            start_date: '2026-10-31',
            start_time: '21:00:00',
            tick_seconds: 60,
            frames_per_second: 24,
            timezone_label: 'UTC+00:00',
            era_label: 'CANON_PRESENT',
            scheduled_beats: [
                beat({ beat_id: 'z_last', startTimeHm: '23:45' }),
                beat({ beat_id: 'a_first', startTimeHm: '22:00' }),
            ],
        }
        const sealed = resolveSealedAgendaChronology({}, unsorted as never)
        const ids = (
            (
                sealed as unknown as {
                    scheduled_beats: Array<{ beat_id: string }>
                }
            ).scheduled_beats ?? []
        ).map((b) => b.beat_id)
        expect(ids).toEqual(['a_first', 'z_last'])
    })

    it('merkle sensitivity on beat time and reserve ticks, plus legacy compat', async () => {
        const slug = 'vitest-tmp-agenda-seal'
        const seriesDir = path.join(repoRoot, 'series', slug)
        const compiledDir = path.join(repoRoot, 'compiled', slug)
        try {
            let scaf: unknown
            await scaffoldSeriesTree(new SeriesModel(), {
                idx: 'agenda-scaffold',
                dat: {
                    repoRoot,
                    config: makeConfig(slug, {
                        start_date: '2026-10-31',
                        start_time: '21:00:00',
                        tick_seconds: 60,
                        scheduled_beats: [
                            beat({
                                beat_id: 'tentpole_a',
                                startTimeHm: '22:00',
                            }),
                        ],
                    }),
                },
                slv: (r: unknown) => {
                    scaf = (r as { seriesBit: unknown }).seriesBit
                },
            })
            expect((scaf as { val: number })?.val).toBe(1)
            let sealA: unknown
            pass3Seal(new CompileModel(), {
                idx: 'agenda-seal-a',
                seriesSlug: slug,
                slv: (r: unknown) => {
                    sealA = (r as { cmpBit: unknown }).cmpBit
                },
            })
            expect((sealA as { val: number })?.val).toBe(1)
            const bibleA = JSON.parse(
                fs.readFileSync(
                    path.join(compiledDir, 'bible-state.json'),
                    'utf8',
                ),
            )
            expect(bibleA.chronology.scheduled_beats).toHaveLength(1)
            const hashA = bibleA.root_merkle_hash as string

            const cfgPath = path.join(seriesDir, 'series.config.json')
            const cfgB = JSON.parse(fs.readFileSync(cfgPath, 'utf8'))
            cfgB.chronology.scheduled_beats[0].startTimeHm = '22:30'
            fs.writeFileSync(cfgPath, JSON.stringify(cfgB, null, 2))
            let sealB: unknown
            pass3Seal(new CompileModel(), {
                idx: 'agenda-seal-b',
                seriesSlug: slug,
                slv: (r: unknown) => {
                    sealB = (r as { cmpBit: unknown }).cmpBit
                },
            })
            expect((sealB as { val: number })?.val).toBe(1)
            const bibleB = JSON.parse(
                fs.readFileSync(
                    path.join(compiledDir, 'bible-state.json'),
                    'utf8',
                ),
            )
            expect(bibleB.root_merkle_hash).not.toBe(hashA)

            const cfgC = JSON.parse(fs.readFileSync(cfgPath, 'utf8'))
            cfgC.chronology.scheduled_beats[0].startTimeHm = '22:00'
            cfgC.chronology.scheduled_beats[0].reserveCooldownTicks = 9
            fs.writeFileSync(cfgPath, JSON.stringify(cfgC, null, 2))
            let sealC: unknown
            pass3Seal(new CompileModel(), {
                idx: 'agenda-seal-c',
                seriesSlug: slug,
                slv: (r: unknown) => {
                    sealC = (r as { cmpBit: unknown }).cmpBit
                },
            })
            expect((sealC as { val: number })?.val).toBe(1)
            const bibleC = JSON.parse(
                fs.readFileSync(
                    path.join(compiledDir, 'bible-state.json'),
                    'utf8',
                ),
            )
            expect(bibleC.root_merkle_hash).not.toBe(bibleA.root_merkle_hash)

            const cfgL = JSON.parse(fs.readFileSync(cfgPath, 'utf8'))
            delete cfgL.chronology.scheduled_beats
            fs.writeFileSync(cfgPath, JSON.stringify(cfgL, null, 2))
            let sealL: unknown
            pass3Seal(new CompileModel(), {
                idx: 'agenda-seal-legacy',
                seriesSlug: slug,
                slv: (r: unknown) => {
                    sealL = (r as { cmpBit: unknown }).cmpBit
                },
            })
            expect((sealL as { val: number })?.val).toBe(1)
        } finally {
            if (fs.existsSync(seriesDir)) {
                fs.rmSync(seriesDir, { recursive: true, force: true })
            }
            if (fs.existsSync(compiledDir)) {
                fs.rmSync(compiledDir, { recursive: true, force: true })
            }
        }
        void os.tmpdir
    })
})
