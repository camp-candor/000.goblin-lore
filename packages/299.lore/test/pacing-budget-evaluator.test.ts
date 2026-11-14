import { describe, it, expect } from 'vitest'
import {
    evaluateGlobalSceneCooldown,
    computeDroughtPressureBoostBps,
} from '../06.cooldown.unit/buz/cooldown.buzz.js'
import {
    resolveNarrativeActStage,
    computeThreeActPacingMultiplierBps,
} from '../10.escalation.unit/buz/escalation.buzz.js'
import { evaluateCatalystWithPacingBudget } from '../42.catalyst.unit/buz/catalyst.buzz.js'
import { resolvePacingBudgetConfig } from '../38.types.unit/fce/autoScriptRule.interface.js'

const pacing = resolvePacingBudgetConfig({})

describe('pacing-budget-evaluator', () => {
    it('first scene never blocked', () => {
        const r = evaluateGlobalSceneCooldown(null, null, 5000, pacing)
        expect(r.blocked).toBe(false)
        expect(r.reason).toBe('FIRST_SCENE')
    })

    it('enforces tick and minute cooldown', () => {
        const blocked = evaluateGlobalSceneCooldown(0, 0, 5000, pacing)
        expect(blocked.blocked).toBe(true)
        expect(blocked.reason).toBe('COOLDOWN_ACTIVE')
        expect(blocked.remainingTicks).toBe(pacing.min_ticks_between_scenes)
        const clear = evaluateGlobalSceneCooldown(10, 60, 5000, pacing)
        expect(clear.blocked).toBe(false)
    })

    it('critical override bypasses cooldown', () => {
        const r = evaluateGlobalSceneCooldown(
            0,
            0,
            pacing.critical_override_bps,
            pacing,
        )
        expect(r.blocked).toBe(false)
        expect(r.overrideApplied).toBe(true)
        expect(r.reason).toBe('CRITICAL_OVERRIDE')
    })

    it('drought boost scales and caps', () => {
        expect(computeDroughtPressureBoostBps(0, pacing)).toBe(0)
        expect(computeDroughtPressureBoostBps(null, pacing)).toBe(0)
        expect(
            computeDroughtPressureBoostBps(pacing.max_dry_spell_ticks, pacing),
        ).toBe(pacing.drought_boost_bps_per_tick)
        const huge = computeDroughtPressureBoostBps(100000, pacing)
        expect(huge).toBe(pacing.max_drought_boost_bps)
    })

    it('resolves act stages across window modes', () => {
        expect(resolveNarrativeActStage(0, pacing)).toBe('ACT_I')
        expect(resolveNarrativeActStage(pacing.act_i_end_bps, pacing)).toBe(
            'ACT_I',
        )
        expect(resolveNarrativeActStage(pacing.act_i_end_bps + 1, pacing)).toBe(
            'ACT_II',
        )
        expect(resolveNarrativeActStage(pacing.act_ii_end_bps, pacing)).toBe(
            'ACT_II',
        )
        expect(resolveNarrativeActStage(10000, pacing)).toBe('ACT_III')
        // HORIZON_PERCENT tick/totalTicks
        expect(
            resolveNarrativeActStage({ tick: 0, totalTicks: 100 }, pacing),
        ).toBe('ACT_I')
        expect(
            resolveNarrativeActStage({ tick: 99, totalTicks: 100 }, pacing),
        ).toBe('ACT_III')
        // SOLAR_24H_CYCLE elapsedSolarMinutes
        expect(
            resolveNarrativeActStage({ elapsedSolarMinutes: 0 }, pacing),
        ).toBe('ACT_I')
        expect(
            resolveNarrativeActStage({ elapsedSolarMinutes: 1439 }, pacing),
        ).toBe('ACT_III')
    })

    it('computes integer combined multiplier', () => {
        const m = computeThreeActPacingMultiplierBps('ACT_I', 'NIGHT', pacing)
        const expected = Number(
            (BigInt(pacing.act_i_multiplier_bps) *
                BigInt(pacing.diurnal_tension_weights_bps.NIGHT)) /
                10000n,
        )
        expect(m).toBe(expected)
        expect(Number.isInteger(m)).toBe(true)
    })

    it('catalyst verdict combines pacing telemetry', () => {
        const config: any = { enabled: true, pacing_budget: pacing }
        const verdict = evaluateCatalystWithPacingBudget(config, {
            category: 'PARANOIA_TRIGGERED',
            severityBps: 9000,
            currentTick: 50,
            ticksSinceLastScene: 10,
            minutesSinceLastScene: 60,
            totalTicks: 100,
            daypart: 'DUSK',
        })
        expect(verdict.actStage).toBeDefined()
        expect(verdict.effectiveScoreBps).toBeGreaterThanOrEqual(0)
        expect(verdict.droughtBoostBps).toBeGreaterThanOrEqual(0)
        expect(typeof verdict.shouldEmit).toBe('boolean')
        expect(typeof verdict.suppressedByCooldown).toBe('boolean')
        expect(typeof verdict.droughtBreakerActive).toBe('boolean')
        expect(Object.isFrozen(verdict)).toBe(true)
        // suppressed path
        const suppressed = evaluateCatalystWithPacingBudget(config, {
            category: 'PARANOIA_TRIGGERED',
            severityBps: 9000,
            currentTick: 50,
            ticksSinceLastScene: 0,
            minutesSinceLastScene: 0,
            totalTicks: 100,
            daypart: 'DAWN',
        })
        expect(suppressed.suppressedByCooldown).toBe(true)
        expect(suppressed.shouldEmit).toBe(false)
    })
})
