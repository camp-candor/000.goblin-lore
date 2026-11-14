import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { CompileModel } from '../43.compile.unit/compile.model.js'
import { pass3Seal } from '../43.compile.unit/buz/compile.buzz.js'
import { SeriesModel } from '../29.series.unit/series.model.js'
import { scaffoldSeriesTree } from '../29.series.unit/buz/scaffoldSeriesTree.buzz.js'
import {
    seedWorldDefinitions,
    verifyByteZeroBuffer,
} from '../27.seed.unit/buz/seedWorldDefinitions.buzz.js'

function makeValidSeriesConfig(
    seriesSlug: string,
    chronology?: Record<string, any>,
) {
    return {
        schema_version: '1.0.0',
        series_slug: seriesSlug,
        display_name: 'Chrono Seal Test',
        genre_tag: 'STANDARD',
        central_irony: 'Testing fail closed chronology validation and sealing',
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

describe('chronology compile seal', () => {
    it('seals chronology into bible-state.json', () => {
        const model = new CompileModel()
        let sealBit: any
        pass3Seal(model, {
            idx: 'test-seal-chrono',
            seriesSlug: '000.sample-hearth',
            slv: (res: any) => {
                sealBit = res.cmpBit
            },
        })
        expect(sealBit).toBeDefined()
        expect(sealBit.val).toBe(1)
        const biblePath = path.join(
            path.resolve(__dirname, '../../../'),
            'compiled/000.sample-hearth/bible-state.json',
        )
        const onDisk = JSON.parse(fs.readFileSync(biblePath, 'utf8'))
        expect(onDisk.chronology).toBeDefined()
        expect(onDisk.chronology.start_date).toBeDefined()
        expect(onDisk.chronology.start_time).toBeDefined()
        expect(onDisk.chronology.start_snapshot).toBeDefined()
    })

    it('rejects malformed genesis dates fail-closed before writing series.config.json', async () => {
        const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'chrono-seal-'))
        try {
            let badDateBit: any
            await scaffoldSeriesTree(new SeriesModel(), {
                idx: 'bad-date',
                dat: {
                    repoRoot: tmpRoot,
                    config: makeValidSeriesConfig('bad-date-series', {
                        start_date: '2026-02-29',
                        start_time: '21:00:00',
                    }),
                },
                slv: (r: any) => {
                    badDateBit = r.seriesBit
                },
            })
            expect(badDateBit?.val).toBe(0)
            expect(badDateBit?.dat?.error).toContain('INVALID_CALENDAR_DATE')
            expect(
                fs.existsSync(
                    path.join(
                        tmpRoot,
                        'series/bad-date-series/series.config.json',
                    ),
                ),
            ).toBe(false)

            let badTimeBit: any
            await scaffoldSeriesTree(new SeriesModel(), {
                idx: 'bad-time',
                dat: {
                    repoRoot: tmpRoot,
                    config: makeValidSeriesConfig('bad-time-series', {
                        start_date: '2026-10-31',
                        start_time: '24:01',
                    }),
                },
                slv: (r: any) => {
                    badTimeBit = r.seriesBit
                },
            })
            expect(badTimeBit?.val).toBe(0)
            expect(
                fs.existsSync(
                    path.join(
                        tmpRoot,
                        'series/bad-time-series/series.config.json',
                    ),
                ),
            ).toBe(false)
        } finally {
            fs.rmSync(tmpRoot, { recursive: true, force: true })
        }
    })

    it('enforces Byte-0 world/chronology.md, Merkle sensitivity, and legacy omitted fallback', async () => {
        const repoRoot = path.resolve(__dirname, '../../../')
        const slug = 'vitest-tmp-chrono-seal'
        const seriesDir = path.join(repoRoot, 'series', slug)
        const compiledDir = path.join(repoRoot, 'compiled', slug)
        try {
            let scaffoldBit: any
            await scaffoldSeriesTree(new SeriesModel(), {
                idx: 'good-scaffold',
                dat: {
                    repoRoot,
                    config: makeValidSeriesConfig(slug, {
                        start_date: '2026-10-31',
                        start_time: '21:00:00',
                    }),
                },
                slv: (r: any) => {
                    scaffoldBit = r.seriesBit
                },
            })
            expect(scaffoldBit?.val).toBe(1)
            seedWorldDefinitions(seriesDir, slug)

            const chronoBuf = fs.readFileSync(
                path.join(seriesDir, 'world', 'chronology.md'),
            )
            expect([
                chronoBuf[0],
                chronoBuf[1],
                chronoBuf[2],
                chronoBuf[3],
            ]).toEqual([0x2d, 0x2d, 0x2d, 0x0a])
            expect(chronoBuf.includes(0x0d)).toBe(false)
            expect(
                chronoBuf[0] === 0xef &&
                    chronoBuf[1] === 0xbb &&
                    chronoBuf[2] === 0xbf,
            ).toBe(false)
            expect(verifyByteZeroBuffer(chronoBuf)).toBe(true)

            let sealA: any
            pass3Seal(new CompileModel(), {
                idx: 'seal-a',
                seriesSlug: slug,
                slv: (r: any) => {
                    sealA = r.cmpBit
                },
            })
            expect(sealA?.val).toBe(1)
            const bibleA = JSON.parse(
                fs.readFileSync(
                    path.join(compiledDir, 'bible-state.json'),
                    'utf8',
                ),
            )
            expect(bibleA.chronology.start_snapshot.clockTimeHm).toBe('21:00')
            expect(bibleA.chronology.start_snapshot.daypart).toBe('NIGHT')

            const cfgPath = path.join(seriesDir, 'series.config.json')
            const cfgB = JSON.parse(fs.readFileSync(cfgPath, 'utf8'))
            cfgB.chronology.start_time = '21:01:00'
            fs.writeFileSync(cfgPath, JSON.stringify(cfgB, null, 2))

            let sealB: any
            pass3Seal(new CompileModel(), {
                idx: 'seal-b',
                seriesSlug: slug,
                slv: (r: any) => {
                    sealB = r.cmpBit
                },
            })
            expect(sealB?.val).toBe(1)
            const bibleB = JSON.parse(
                fs.readFileSync(
                    path.join(compiledDir, 'bible-state.json'),
                    'utf8',
                ),
            )
            expect(bibleB.chronology.start_snapshot.clockTimeHm).toBe('21:01')
            expect(bibleB.chronology.start_snapshot.daypart).toBe('NIGHT')
            expect(bibleA.root_merkle_hash).not.toBe(bibleB.root_merkle_hash)

            const cfgLegacy = JSON.parse(fs.readFileSync(cfgPath, 'utf8'))
            delete cfgLegacy.chronology
            fs.writeFileSync(cfgPath, JSON.stringify(cfgLegacy, null, 2))

            let sealL: any
            pass3Seal(new CompileModel(), {
                idx: 'seal-legacy',
                seriesSlug: slug,
                slv: (r: any) => {
                    sealL = r.cmpBit
                },
            })
            expect(sealL?.val).toBe(1)
            const bibleL = JSON.parse(
                fs.readFileSync(
                    path.join(compiledDir, 'bible-state.json'),
                    'utf8',
                ),
            )
            expect(bibleL.chronology.start_date).toBe('2026-10-31')
            expect(bibleL.chronology.start_time).toBe('21:00:00')
            expect(bibleL.chronology.tick_seconds).toBe(60)
            expect(bibleL.chronology.frames_per_second).toBe(24)
        } finally {
            if (fs.existsSync(seriesDir)) {
                fs.rmSync(seriesDir, { recursive: true, force: true })
            }
            if (fs.existsSync(compiledDir)) {
                fs.rmSync(compiledDir, { recursive: true, force: true })
            }
        }
    })
})
