import { describe, it, expect } from 'vitest'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import * as crypto from 'node:crypto'
import {
    estimate24HourCadenceBounds,
    inspectPublishPacingBudgetParity,
} from '../98.menu.unit/buz/fleetPublish.buzz.js'
import { resolvePacingBudgetConfig } from '../38.types.unit/fce/autoScriptRule.interface.js'

function sha256File(p: string): string {
    return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')
}

describe('fleet-pacing-publish', () => {
    it('computes deterministic 24h cadence bounds with integers', () => {
        const pacing = resolvePacingBudgetConfig({})
        const b = estimate24HourCadenceBounds(pacing, 900)
        expect(b.ticksPer24h).toBe(96)
        expect(Number.isInteger(b.ticksPer24h)).toBe(true)
        expect(Number.isInteger(b.maxCooldownLimitedScenes)).toBe(true)
        expect(Number.isInteger(b.droughtGuaranteedFloorScenes)).toBe(true)
        expect(b.droughtGuaranteedFloorScenes).toBe(
            Math.floor(96 / (pacing.max_dry_spell_ticks + 1)),
        )
        expect(b.maxCooldownLimitedScenes).toBe(
            Math.floor(96 / (pacing.min_ticks_between_scenes + 1)) + 1,
        )
    })

    it('inspects valid manifest and emits pacing telemetry', () => {
        const pacing = resolvePacingBudgetConfig({})
        const bibleState = {
            auto_script_bundle: { config: { pacing_budget: pacing } },
            chronology: { tick_seconds: 900 },
        }
        const seen: string[] = []
        const ste: any = {
            hunt: (_a: string, p: any) => {
                seen.push(String(p?.src || ''))
            },
        }
        const res = inspectPublishPacingBudgetParity(bibleState, 900, ste)
        expect(res.ok).toBe(true)
        expect(res.legacy).toBe(false)
        expect(res.pacing?.min_ticks_between_scenes).toBe(2)
        expect(seen.join('\n')).toContain('[PUBLISH:PACING]')
    })

    it('legacy manifest warns but completes safely', () => {
        const seen: string[] = []
        const ste: any = {
            hunt: (_a: string, p: any) => {
                seen.push(String(p?.src || ''))
            },
        }
        const res = inspectPublishPacingBudgetParity(
            { auto_script_bundle: { config: {} } },
            900,
            ste,
        )
        expect(res.ok).toBe(true)
        expect(res.legacy).toBe(true)
        expect(seen.join('\n')).toContain('[PUBLISH:PACING_WARN]')
    })

    it('preserves SHA-256 bit identity on copy', () => {
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fleet-pacing-'))
        const src = path.join(tmp, 'bible-state.json')
        const dst = path.join(tmp, 'dest.json')
        const payload = JSON.stringify({
            auto_script_bundle: {
                config: { pacing_budget: resolvePacingBudgetConfig({}) },
            },
        })
        fs.writeFileSync(src, payload)
        fs.copyFileSync(src, dst)
        expect(sha256File(src)).toBe(sha256File(dst))
        fs.rmSync(tmp, { recursive: true, force: true })
    })
})
