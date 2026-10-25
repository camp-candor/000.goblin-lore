/**
 * packages/299.lore/15.item.unit/test/itemScaffold.test.ts
 * Vitest verification battery for Interactive Possession Scaffolding Interview.
 */
import * as fs from 'node:fs'
import * as path from 'node:path'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { ItemModel } from '../item.model.js'
import * as ActItm from '../item.action.js'
import { reducer } from '../item.reduce.js'
import {
    resolveWeightClass,
    renderPossessionDossierMarkdown,
    writePossessionDossierAtomic,
    WEIGHT_CLASS_PRESETS,
} from '../buz/itemScaffold.buzz.js'

describe('Interactive Possession Scaffolding Interview (15.item.unit)', () => {
    const tmpTestDir = path.join(process.cwd(), '.tmp_test_possession_scaffold')

    afterEach(() => {
        if (fs.existsSync(tmpTestDir)) {
            fs.rmSync(tmpTestDir, { recursive: true, force: true })
        }
    })

    it('P0.1: resolves weight class tiers correctly based on gram mass thresholds', () => {
        expect(resolveWeightClass(30)).toBe('scrap')
        expect(resolveWeightClass(50)).toBe('scrap')
        expect(resolveWeightClass(51)).toBe('shine')
        expect(resolveWeightClass(250)).toBe('shine')
        expect(resolveWeightClass(251)).toBe('weight')
        expect(resolveWeightClass(5000)).toBe('weight')
        expect(resolveWeightClass(5001)).toBe('bulk')
    })

    it('P0.2: formats possession dossier strictly beginning with --- at Byte 0', () => {
        const md = renderPossessionDossierMarkdown({
            id: 'item_trench_knife',
            name: 'Iron Trench Knife',
            massGrams: 120,
            weightClass: 'shine',
            equipSlot: 'held_primary',
            occupiesHandsBps: 10000,
            custodyHolder: 'char_bog',
            isContested: true,
        })

        const buf = Buffer.from(md, 'utf8')
        expect(buf[0]).toBe(0x2d) // '-'
        expect(buf[1]).toBe(0x2d) // '-'
        expect(buf[2]).toBe(0x2d) // '-'
        expect(buf[3]).toBe(0x0a) // '\n'
        expect(md.includes('id: item_trench_knife')).toBe(true)
        expect(md.includes('mass_grams: 120')).toBe(true)
        expect(md.includes('weight_class: shine')).toBe(true)
        expect(md.includes('occupies_hands_bps: 10000')).toBe(true)
        expect(md.includes('custody_holder: char_bog')).toBe(true)
        expect(md.includes('## Physical Condition')).toBe(true)
        expect(md.includes('## Provenance & Salvage History')).toBe(true)
    })

    it('P0.3: executes atomic POSIX file persistence and enforces Byte 0 invariant', () => {
        const targetFile = path.join(tmpTestDir, 'item_atomic_knife.md')
        const content = renderPossessionDossierMarkdown({
            id: 'item_atomic_knife',
            name: 'Atomic Knife',
            massGrams: 45,
            weightClass: 'scrap',
            equipSlot: 'carried',
            occupiesHandsBps: 0,
            custodyHolder: undefined,
            isContested: false,
        })

        writePossessionDossierAtomic(targetFile, content)

        expect(fs.existsSync(targetFile)).toBe(true)
        const readBuf = fs.readFileSync(targetFile)
        expect(readBuf[0]).toBe(0x2d)
        expect(readBuf[1]).toBe(0x2d)
        expect(readBuf[2]).toBe(0x2d)
    })

    it('P0.4: routes SCAFFOLD_POSSESSION_WIZARD through reducer with state bus mocks', async () => {
        const model = new ItemModel()
        const calls: Array<{ action: string; payload: any }> = []

        const mockState: any = {
            hunt: vi.fn(async (action: string, payload: any) => {
                calls.push({ action, payload })
                return {}
            }),
        }

        let resolvedResult: any = null
        const action = new ActItm.ScaffoldPossessionWizard({
            idx: 'test-item-wizard',
            dat: {
                seriesSlug: 'test-series',
                itemId: 'item_unit_knife',
                name: 'Unit Knife',
                massGrams: 850,
                weightClass: 'weight',
                equipSlot: 'held_primary',
                occupiesHandsBps: 10000,
                custodyHolder: 'char_wart',
                isContested: true,
            },
            slv: (res) => {
                resolvedResult = res
            },
        })

        await reducer(model, action, mockState)

        expect(resolvedResult).toBeDefined()
        expect(resolvedResult.success).toBe(true)
        expect(resolvedResult.itemId).toBe('item_unit_knife')

        const consoleCalls = calls.filter(
            (c) => c.action === '[Console action] Update Console',
        )
        expect(consoleCalls.length).toBeGreaterThan(0)
        const sealedCall = consoleCalls.find((c) =>
            c.payload?.src?.includes('written to disk at Byte 0'),
        )
        expect(sealedCall).toBeDefined()

        // Clean up created file in series/test-series if written
        if (resolvedResult.filePath && fs.existsSync(resolvedResult.filePath)) {
            fs.unlinkSync(resolvedResult.filePath)
            const parentDir = path.dirname(resolvedResult.filePath)
            if (fs.existsSync(parentDir)) fs.rmdirSync(parentDir)
        }
    })
})
