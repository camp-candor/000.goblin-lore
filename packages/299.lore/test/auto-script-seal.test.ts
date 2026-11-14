import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { CompileModel } from '../43.compile.unit/compile.model.js'
import { pass3Seal } from '../43.compile.unit/buz/compile.buzz.js'
import { SeriesModel } from '../29.series.unit/series.model.js'
import { scaffoldSeriesTree } from '../29.series.unit/buz/scaffoldSeriesTree.buzz.js'
import {
    seedWorldDefinitions,
    verifyByteZeroBuffer,
    buildDramaticCatalystsDossier,
} from '../27.seed.unit/buz/seedWorldDefinitions.buzz.js'
import { DEFAULT_AUTO_SCRIPT_CONFIG } from '../38.types.unit/fce/autoScriptRule.interface.js'

function makeValidSeriesConfig(seriesSlug: string, autoScript?: any) {
    return {
        schema_version: '1.0.0',
        series_slug: seriesSlug,
        display_name: 'Auto Script Seal Test',
        genre_tag: 'STANDARD',
        central_irony: 'Testing auto script canon sealing deterministically',
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
        ...(autoScript !== undefined ? { auto_script: autoScript } : {}),
    }
}

function isAscii(s: string): boolean {
    for (let i = 0; i < s.length; i++) {
        if (s.charCodeAt(i) > 0x7f) return false
    }
    return true
}

describe('Auto Script Canon Manifest Sealing', () => {
    it('seeds Byte-0 dramatic-catalysts dossier', () => {
        const content = buildDramaticCatalystsDossier(
            DEFAULT_AUTO_SCRIPT_CONFIG,
            'seal-probe',
        )
        expect(content.charCodeAt(0)).toBe(0x2d)
        expect(content.charCodeAt(1)).toBe(0x2d)
        expect(content.charCodeAt(2)).toBe(0x2d)
        expect(content.charCodeAt(3)).toBe(0x0a)
        expect(content.includes('\r')).toBe(false)
        expect(verifyByteZeroBuffer(Buffer.from(content, 'utf8'))).toBe(true)
        expect(isAscii(content)).toBe(true)
        expect(content).toContain('min_global_significance_bps')
        expect(content).toContain('PARANOIA_TRIGGERED')
    })

    it('seals auto-script bundle with legacy fallback and Merkle sensitivity', async () => {
        const repoRoot = path.resolve(__dirname, '../../../')
        const slug = 'vitest-tmp-auto-script-seal'
        const seriesDir = path.join(repoRoot, 'series', slug)
        const compiledDir = path.join(repoRoot, 'compiled', slug)
        try {
            let scaffoldBit: any
            await scaffoldSeriesTree(new SeriesModel(), {
                idx: 'good-scaffold',
                dat: { repoRoot, config: makeValidSeriesConfig(slug) },
                slv: (r: any) => {
                    scaffoldBit = r.seriesBit
                },
            })
            expect(scaffoldBit?.val).toBe(1)
            seedWorldDefinitions(seriesDir, slug)

            const catBuf = fs.readFileSync(
                path.join(seriesDir, 'world', 'dramatic-catalysts.md'),
            )
            expect([catBuf[0], catBuf[1], catBuf[2], catBuf[3]]).toEqual([
                0x2d, 0x2d, 0x2d, 0x0a,
            ])
            expect(verifyByteZeroBuffer(catBuf)).toBe(true)

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
            expect(bibleA.auto_script_bundle).toBeDefined()
            expect(bibleA.auto_script_bundle.config).toBeDefined()
            expect(bibleA.auto_script_bundle.voice_lexicon).toBeDefined()
            expect(
                bibleA.auto_script_bundle.location_stage_profiles,
            ).toBeDefined()
            expect(bibleA.auto_script_bundle.dramatic_palette).toBeDefined()
            expect(isAscii(JSON.stringify(bibleA.auto_script_bundle))).toBe(
                true,
            )
            const keysA = Object.keys(bibleA.auto_script_bundle.voice_lexicon)
            expect([...keysA].sort()).toEqual(keysA)

            let sealA2: any
            pass3Seal(new CompileModel(), {
                idx: 'seal-a2',
                seriesSlug: slug,
                slv: (r: any) => {
                    sealA2 = r.cmpBit
                },
            })
            const bibleA2 = JSON.parse(
                fs.readFileSync(
                    path.join(compiledDir, 'bible-state.json'),
                    'utf8',
                ),
            )
            expect(bibleA2.root_merkle_hash).toBe(bibleA.root_merkle_hash)
            expect(JSON.stringify(bibleA2.auto_script_bundle)).toBe(
                JSON.stringify(bibleA.auto_script_bundle),
            )

            const cfgPath = path.join(seriesDir, 'series.config.json')
            const cfgB = JSON.parse(fs.readFileSync(cfgPath, 'utf8'))
            cfgB.auto_script = {
                ...(cfgB.auto_script ?? {}),
                min_global_significance_bps: 9999,
            }
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
            expect(bibleB.root_merkle_hash).not.toBe(bibleA.root_merkle_hash)

            const cfgLegacy = JSON.parse(fs.readFileSync(cfgPath, 'utf8'))
            delete cfgLegacy.auto_script
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
            expect(bibleL.auto_script_bundle).toBeDefined()
            expect(
                bibleL.auto_script_bundle.config.min_global_significance_bps,
            ).toBe(DEFAULT_AUTO_SCRIPT_CONFIG.min_global_significance_bps)
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
