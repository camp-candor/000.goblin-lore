import { describe, it, expect } from 'vitest'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import * as crypto from 'node:crypto'
import {
    buildDramaticCatalystsDossier,
    verifyByteZeroBuffer,
} from '../27.seed.unit/buz/seedWorldDefinitions.buzz.js'
import { resolvePacingBudgetConfig } from '../38.types.unit/fce/autoScriptRule.interface.js'
import { jcsSerialize } from '../43.compile.unit/buz/compile.buzz.js'

describe('pacing-budget-seal', () => {
    it('dossier opens at Byte 0 with LF-only frontmatter', () => {
        const md = buildDramaticCatalystsDossier({}, 'test-slug')
        const buf = Buffer.from(md, 'utf8')
        expect(verifyByteZeroBuffer(buf)).toBe(true)
        expect(buf[0]).toBe(0x2d)
        expect(buf[1]).toBe(0x2d)
        expect(buf[2]).toBe(0x2d)
        expect(buf[3]).toBe(0x0a)
        expect(md.includes('\r')).toBe(false)
        for (let i = 0; i < buf.length; i++) {
            expect(buf[i] <= 0x7f).toBe(true)
        }
        expect(md).toContain('min_ticks_between_scenes')
        expect(md).toContain('max_dry_spell_ticks')
        expect(md).toContain('act_window_mode')
        expect(md).toContain('act_i_multiplier_bps')
        expect(md).toContain('act_ii_multiplier_bps')
        expect(md).toContain('act_iii_multiplier_bps')
    })

    it('changing pacing changes Merkle root deterministically', () => {
        const base = resolvePacingBudgetConfig({})
        const alt = resolvePacingBudgetConfig({
            min_ticks_between_scenes: 9,
            act_iii_multiplier_bps: 20000,
        })
        const h1 = crypto
            .createHash('sha256')
            .update(jcsSerialize({ pacing_budget: base }, true), 'utf8')
            .digest('hex')
        const h2 = crypto
            .createHash('sha256')
            .update(jcsSerialize({ pacing_budget: alt }, true), 'utf8')
            .digest('hex')
        expect(h1).not.toBe(h2)
        const h1b = crypto
            .createHash('sha256')
            .update(jcsSerialize({ pacing_budget: base }, true), 'utf8')
            .digest('hex')
        expect(h1).toBe(h1b)
    })

    it('legacy series without pacing seals canonical defaults', () => {
        const pacing = resolvePacingBudgetConfig(undefined)
        expect(pacing.min_ticks_between_scenes).toBe(2)
        const md = buildDramaticCatalystsDossier(
            { enabled: true },
            'legacy-slug',
        )
        expect(md).toContain('min_ticks_between_scenes: 2')
        const buf = Buffer.from(md, 'utf8')
        expect(verifyByteZeroBuffer(buf)).toBe(true)
    })

    it('deterministic two-pass dossier bytes are identical', () => {
        const a = buildDramaticCatalystsDossier({}, 'slug-a')
        const b = buildDramaticCatalystsDossier({}, 'slug-a')
        expect(a).toBe(b)
        const ha = crypto.createHash('sha256').update(a, 'utf8').digest('hex')
        const hb = crypto.createHash('sha256').update(b, 'utf8').digest('hex')
        expect(ha).toBe(hb)
    })
})
