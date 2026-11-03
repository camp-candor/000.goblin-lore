import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import {
    parseByteZeroDossier,
    loadConditionsCatalogFromDisk,
    extractCharacterSomaticRecord,
} from '../buz/extractSomaticLedger.buzz.js'
import { SqliteSomaticStore } from '../buz/sqliteSomaticStore.buzz.js'
import { assertIntegerMetric } from '../val/conditionsRegistry.val.js'
import { LedgerModel } from '../ledger.model.js'
import {
    initLedger,
    extractSomaticLedger,
    querySomaticLedgerRecord,
} from '../ledger.buzzer.js'

describe('16.ledger.unit :: Disk-Backed Somatic Ledger Extraction', () => {
    let tempDir: string
    let conditionsPath: string
    let bogPath: string
    let wartPath: string

    beforeEach(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ledger-test-'))

        conditionsPath = path.join(tempDir, 'conditions.md')
        fs.writeFileSync(
            conditionsPath,
            `---
id: world_conditions_registry
type: conditions_catalog
version: 1
conditions:
  - condition_slug: cnd_severed_left_arm
    title: Severed Left Arm
    arm_penalty_bps: 10000
    velocity_penalty_bps: 0
    chronic_fatigue_floor_bps: 1500
    chronic_pain_floor_bps: 3500
    chronic_refusal_strain_floor_bps: 2000
    chronic_paranoia_floor_bps: 1000
    auditory_debuff_cdb: 0
    banned_verbs:
      - bimanual_lift
      - two_handed_strike
    dsp_deltas:
      pitch_shift_centitones: 0
      formant_warping_bps: 10000
      vocal_fry_density_bps: 2000
      breathiness_pause_bps: 11000
      banned_cadences: []
  - condition_slug: cnd_crushed_larynx
    title: Crushed Laryngeal Cartilage
    arm_penalty_bps: 0
    velocity_penalty_bps: 0
    chronic_fatigue_floor_bps: 2500
    chronic_pain_floor_bps: 4000
    chronic_refusal_strain_floor_bps: 3000
    chronic_paranoia_floor_bps: 2500
    auditory_debuff_cdb: 1500
    banned_verbs:
      - yell
      - shout
    dsp_deltas:
      pitch_shift_centitones: -400
      formant_warping_bps: 7000
      vocal_fry_density_bps: 4500
      breathiness_pause_bps: 15000
      banned_cadences:
        - RAPID_STACCATO
---
# Canonical World Conditions
`,
        )

        bogPath = path.join(tempDir, 'bog.md')
        fs.writeFileSync(
            bogPath,
            `---
id: char_bog
name: Bog
type: character
machineRail:
  id: char_bog
  somatic:
    locomotion_baseline: bipedal_standard
    conditions: []
    banned_kinetic_verbs: []
---
# Bog Dossier
`,
        )

        wartPath = path.join(tempDir, 'wart.md')
        fs.writeFileSync(
            wartPath,
            `---
id: char_wart
name: Wart
type: character
machineRail:
  id: char_wart
  somatic:
    locomotion_baseline: bipedal_hunched
    conditions:
      - cnd_severed_left_arm
      - cnd_crushed_larynx
    banned_kinetic_verbs:
      - climb
---
# Wart Dossier
`,
        )
    })

    afterEach(() => {
        fs.rmSync(tempDir, { recursive: true, force: true })
    })

    it('asserts integer metric invariants and prohibits floating-point numbers', () => {
        expect(() => assertIntegerMetric(1000, 'testField')).not.toThrow()
        expect(() => assertIntegerMetric(1000.5, 'testField')).toThrowError(
            '[FLOAT_PROHIBITED]',
        )
        expect(() =>
            assertIntegerMetric('not-a-number', 'testField'),
        ).toThrowError('[FLOAT_PROHIBITED]')
    })

    it('rejects files violating Byte-0 delimiter boundaries', () => {
        const invalidPath = path.join(tempDir, 'invalid.md')
        fs.writeFileSync(invalidPath, ' \n---\nid: invalid\n---')
        expect(() => parseByteZeroDossier(invalidPath)).toThrowError(
            '[BYTE_ZERO_BREACH]',
        )
    })

    it('loads condition catalog from disk and extracts clean baseline for Bog', () => {
        const catalog = loadConditionsCatalogFromDisk(conditionsPath)
        expect(catalog.size).toBe(2)

        const record = extractCharacterSomaticRecord(bogPath, catalog)
        expect(record.entityId).toBe('char_bog')
        expect(record.availableArmsBps).toBe(20000)
        expect(record.armsAvailable).toBe(2)
        expect(record.legsAvailable).toBe(2)
        expect(record.locomotionTier).toBe('UNRESTRICTED')
        expect(record.chronicFatigueFloorBps).toBe(0)
        expect(record.chronicPainFloorBps).toBe(0)
        expect(record.bannedVerbs).toEqual([])
        expect(Object.isFrozen(record)).toBe(true)
    })

    it('extracts compound conditions and aggregates chronic baseline floors for Wart', () => {
        const catalog = loadConditionsCatalogFromDisk(conditionsPath)
        const record = extractCharacterSomaticRecord(wartPath, catalog)

        expect(record.entityId).toBe('char_wart')
        expect(record.availableArmsBps).toBe(10000)
        expect(record.armsAvailable).toBe(1)
        expect(record.chronicFatigueFloorBps).toBe(4000) // 1500 + 2500
        expect(record.chronicPainFloorBps).toBe(7500) // 3500 + 4000
        expect(record.chronicRefusalStrainFloorBps).toBe(5000) // 2000 + 3000
        expect(record.chronicParanoiaFloorBps).toBe(3500) // 1000 + 2500
        expect(record.auditoryDebuffCdB).toBe(1500)
        expect(record.locomotionTier).toBe('LIMPING') // chronic pain >= 5000
        expect(record.bannedVerbs).toContain('bimanual_lift')
        expect(record.bannedVerbs).toContain('climb')
        expect(record.bannedVerbs).toContain('shout')
        expect(record.baselineDspDeltas.pitchShiftCentitones).toBe(-400)
        expect(record.baselineDspDeltas.formantWarpingBps).toBe(7000)
        expect(record.baselineDspDeltas.vocalFryDensityBps).toBe(4500)
        expect(record.baselineDspDeltas.bannedCadences).toContain(
            'RAPID_STACCATO',
        )
    })

    it('persists and queries records in local SQLite store', () => {
        const store = new SqliteSomaticStore(':memory:')
        const catalog = loadConditionsCatalogFromDisk(conditionsPath)
        const wartRecord = extractCharacterSomaticRecord(wartPath, catalog)

        store.upsertSomaticLedgerRecord(wartRecord, 42)
        const queried = store.queryCharacterSomaticLedger('char_wart')

        expect(queried).not.toBeNull()
        expect(queried!.entityId).toBe('char_wart')
        expect(queried!.availableArmsBps).toBe(10000)
        expect(queried!.chronicPainFloorBps).toBe(7500)
        expect(queried!.locomotionTier).toBe('LIMPING')
        expect(queried!.bannedVerbs).toContain('climb')
        expect(queried!.baselineDspDeltas.bannedCadences).toContain(
            'RAPID_STACCATO',
        )

        store.close()
    })

    it('executes full extraction buzzer cycle through LedgerModel and resolves receipt', async () => {
        const model = new LedgerModel()
        initLedger(model, { idx: 'init' }, {} as any)

        let emittedReceipt: any
        await extractSomaticLedger(
            model,
            {
                idx: 'extract-test',
                dat: {
                    conditionsPath,
                    characterPaths: [bogPath, wartPath],
                },
                slv: (res) => {
                    emittedReceipt = res.ldgBit
                },
            },
            {
                hunt: async () => {},
            } as any,
        )

        expect(emittedReceipt).toBeDefined()
        expect(emittedReceipt.val).toBe(2)
        expect(model.somaticRecords['char_wart']).toBeDefined()
        expect(model.conditionsCatalog['cnd_crushed_larynx']).toBeDefined()

        let queriedWart: any
        querySomaticLedgerRecord(
            model,
            {
                idx: 'query-test',
                dat: { entityId: 'char_wart' },
                slv: (res) => {
                    queriedWart = res.ldgBit.dat
                },
            },
            {} as any,
        )

        expect(queriedWart).toBeDefined()
        expect(queriedWart.entityId).toBe('char_wart')
        expect(queriedWart.armsAvailable).toBe(1)
    })
})
