import { CooldownModel } from '../cooldown.model.js'
import type CooldownBit from '../fce/cooldown.bit.js'
import type State from '../../99.core/state.js'
import {
    resolvePacingBudgetConfig,
    type PacingBudgetConfig,
} from '../../38.types.unit/fce/autoScriptRule.interface.js'
import type { GlobalCooldownEvaluation } from '../fce/cooldown.interface.js'

export const initCooldown = (
    cpy: CooldownModel,
    bal: CooldownBit,
    ste?: State,
): CooldownModel => {
    cpy.idx = bal.idx || '06.cooldown'
    if (bal.slv) {
        bal.slv({ cldBit: { idx: 'init-cooldown', val: 0 } })
    }
    return cpy
}

export const updateCooldown = (
    cpy: CooldownModel,
    bal: CooldownBit,
    ste?: State,
): CooldownModel => {
    if (bal.slv) {
        bal.slv({ cldBit: { idx: 'update-cooldown', val: 0 } })
    }
    return cpy
}

export function normalizePacingInput(
    pacingInput?: unknown,
): PacingBudgetConfig {
    if (
        pacingInput !== null &&
        typeof pacingInput === 'object' &&
        (pacingInput as any).min_ticks_between_scenes !== undefined
    ) {
        return resolvePacingBudgetConfig(pacingInput)
    }
    if (
        pacingInput !== null &&
        typeof pacingInput === 'object' &&
        (pacingInput as any).pacing_budget !== undefined
    ) {
        return resolvePacingBudgetConfig((pacingInput as any).pacing_budget)
    }
    if (pacingInput === undefined || pacingInput === null) {
        return resolvePacingBudgetConfig({})
    }
    try {
        return resolvePacingBudgetConfig(pacingInput)
    } catch {
        return resolvePacingBudgetConfig({})
    }
}

export function evaluateGlobalSceneCooldown(
    ticksSinceLastScene: number | null,
    minutesSinceLastScene: number | null,
    severityBps: number,
    pacingInput?: unknown,
): GlobalCooldownEvaluation {
    const pacing: PacingBudgetConfig = normalizePacingInput(pacingInput)
    if (ticksSinceLastScene === null || ticksSinceLastScene === undefined) {
        return Object.freeze({
            blocked: false,
            overrideApplied: false,
            remainingTicks: 0,
            remainingMinutes: 0,
            reason: 'FIRST_SCENE',
        }) as GlobalCooldownEvaluation
    }
    const ticks = Math.trunc(ticksSinceLastScene)
    const minutes =
        minutesSinceLastScene === null || minutesSinceLastScene === undefined
            ? null
            : Math.trunc(minutesSinceLastScene)
    const tickBlocked = ticks < pacing.min_ticks_between_scenes
    const minuteBlocked =
        pacing.min_minutes_between_scenes > 0 &&
        minutes !== null &&
        minutes < pacing.min_minutes_between_scenes
    if (tickBlocked || minuteBlocked) {
        if (severityBps >= pacing.critical_override_bps) {
            return Object.freeze({
                blocked: false,
                overrideApplied: true,
                remainingTicks: 0,
                remainingMinutes: 0,
                reason: 'CRITICAL_OVERRIDE',
            }) as GlobalCooldownEvaluation
        }
        return Object.freeze({
            blocked: true,
            overrideApplied: false,
            remainingTicks: Math.max(
                0,
                pacing.min_ticks_between_scenes - ticks,
            ),
            remainingMinutes:
                minutes !== null
                    ? Math.max(0, pacing.min_minutes_between_scenes - minutes)
                    : 0,
            reason: 'COOLDOWN_ACTIVE',
        }) as GlobalCooldownEvaluation
    }
    return Object.freeze({
        blocked: false,
        overrideApplied: false,
        remainingTicks: 0,
        remainingMinutes: 0,
        reason: 'COOLDOWN_CLEAR',
    }) as GlobalCooldownEvaluation
}

export function computeDroughtPressureBoostBps(
    ticksSinceLastScene: number | null,
    pacingInput?: unknown,
): number {
    const pacing: PacingBudgetConfig = normalizePacingInput(pacingInput)
    if (ticksSinceLastScene === null || ticksSinceLastScene === undefined) {
        return 0
    }
    const ticks = Math.trunc(ticksSinceLastScene)
    if (ticks < pacing.max_dry_spell_ticks) {
        return 0
    }
    const excessTicks = ticks - pacing.max_dry_spell_ticks + 1
    const raw = excessTicks * pacing.drought_boost_bps_per_tick
    return Math.min(pacing.max_drought_boost_bps, raw)
}
