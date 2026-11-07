import { describe, it, expect } from 'vitest'
import path from 'node:path'
import {
    loadConditionsCatalogFromDisk,
    extractCharacterSomaticRecord,
} from '../buz/extractSomaticLedger.buzz.js'
import { SqliteSomaticStore } from '../buz/sqliteSomaticStore.buzz.js'
import { LedgerModel } from '../ledger.model.js'
import { initLedger, extractSomaticLedger } from '../ledger.buzzer.js'
import { discoverSeriesCharacters } from '../../98.menu.unit/buz/00.menu.buzz.js'

describe('16.ledger.unit :: Wiregrass Basin (The Parallax Dinner) Somatic Extraction', () => {
    const repoRoot = path.resolve(__dirname, '../../../../')
    const conditionsPath = path.join(
        repoRoot,
        'series/wiregrass-basin/world/conditions.md',
    )
    const johnnyPath = path.join(
        repoRoot,
        'series/wiregrass-basin/characters/char_johnny_walkman.md',
    )
    const orbiePath = path.join(
        repoRoot,
        'series/wiregrass-basin/characters/char_orbie_mayhaw.md',
    )
    const beverlyPath = path.join(
        repoRoot,
        'series/wiregrass-basin/characters/char_miss_beverly.md',
    )

    it('loads all 5 canonical conditions from series/wiregrass-basin/world/conditions.md', () => {
        const catalog = loadConditionsCatalogFromDisk(conditionsPath)
        expect(catalog.size).toBeGreaterThanOrEqual(5)
        expect(catalog.has('cnd_elephants_sway')).toBe(true)
        expect(catalog.has('cnd_euclidean_posture')).toBe(true)
        expect(catalog.has('cnd_third_metatarsal_fracture')).toBe(true)
    })

    it('extracts Johnny Walkman somatic baseline and baritone DSP deltas', () => {
        const catalog = loadConditionsCatalogFromDisk(conditionsPath)
        const rec = extractCharacterSomaticRecord(johnnyPath, catalog)

        expect(rec.entityId).toBe('char_johnny_walkman')
        expect(rec.armsAvailable).toBe(2)
        expect(rec.legsAvailable).toBe(2)
        expect(rec.locomotionTier).toBe('UNRESTRICTED')
        expect(rec.chronicFatigueFloorBps).toBe(1500)
        expect(rec.chronicParanoiaFloorBps).toBe(2800)
        expect(rec.bannedVerbs).toContain('sit_still')
        expect(rec.baselineDspDeltas.pitchShiftCentitones).toBe(-200)
        expect(rec.baselineDspDeltas.bannedCadences).toContain('RAPID_STACCATO')
        expect(Object.isFrozen(rec)).toBe(true)
    })

    it('extracts Dr. Orbie Mayhaw Euclidean Posture and banned cervical verbs', () => {
        const catalog = loadConditionsCatalogFromDisk(conditionsPath)
        const rec = extractCharacterSomaticRecord(orbiePath, catalog)

        expect(rec.entityId).toBe('char_orbie_mayhaw')
        expect(rec.armsAvailable).toBe(2)
        expect(rec.locomotionTier).toBe('UNRESTRICTED')
        expect(rec.chronicRefusalStrainFloorBps).toBe(2400)
        expect(rec.chronicParanoiaFloorBps).toBe(3600)
        expect(rec.bannedVerbs).toEqual(['head_tilt', 'nod', 'slouch'])
        expect(rec.baselineDspDeltas.pitchShiftCentitones).toBe(150)
        expect(rec.baselineDspDeltas.bannedCadences).toContain('SLOW_DRAWL')
    })

    it('derives LIMPING locomotion tier and >= 5000 pain floor for Miss Beverly', () => {
        const catalog = loadConditionsCatalogFromDisk(conditionsPath)
        const rec = extractCharacterSomaticRecord(beverlyPath, catalog)

        expect(rec.entityId).toBe('char_miss_beverly')
        expect(rec.legsAvailable).toBe(1)
        expect(rec.locomotionTier).toBe('LIMPING')
        expect(rec.chronicPainFloorBps).toBe(5200)
        expect(rec.bannedVerbs).toContain('sprint')
        expect(rec.bannedVerbs).toContain('lunge')
    })

    it('persists all three Parallax Dinner cast members into SqliteSomaticStore via extractSomaticLedger buzzer', async () => {
        const model = new LedgerModel()
        initLedger(model, { idx: 'init' }, {} as any)

        let receipt: any
        await extractSomaticLedger(
            model,
            {
                idx: 'extract-wiregrass',
                dat: {
                    conditionsPath,
                    characterPaths: [johnnyPath, orbiePath, beverlyPath],
                },
                slv: (res) => {
                    receipt = res.ldgBit
                },
            },
            { hunt: async () => {} } as any,
        )

        expect(receipt).toBeDefined()
        expect(receipt.val).toBe(3)

        const rows = model.sqliteStore!.listSeriesSomaticLedger()
        expect(rows.map((r) => r.entityId)).toEqual([
            'char_johnny_walkman',
            'char_miss_beverly',
            'char_orbie_mayhaw',
        ])
    })

    it('exposes all Wiregrass Basin cast members to Blessed TUI character discovery', () => {
        const discovered = discoverSeriesCharacters('wiregrass-basin')
        expect(discovered).toContain('char_johnny_walkman.md')
        expect(discovered).toContain('char_orbie_mayhaw.md')
        expect(discovered).toContain('char_miss_beverly.md')
    })
})
