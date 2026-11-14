import { CatalystModel } from '../catalyst.model.js'
import type CatalystBit from '../fce/catalyst.bit.js'
import type State from '../../99.core/state.js'
import {
    AutoScriptConfigSchema,
    resolvePacingBudgetConfig,
    type ActStage,
    type AutoScriptConfig,
    type PacingBudgetConfig,
    type SignificantEventCategory,
} from '../../38.types.unit/fce/autoScriptRule.interface.js'
import type { DaypartBand } from '../../38.types.unit/fce/chronology.interface.js'
import {
    evaluateGlobalSceneCooldown,
    computeDroughtPressureBoostBps,
} from '../../06.cooldown.unit/buz/cooldown.buzz.js'
import {
    resolveNarrativeActStage,
    computeThreeActPacingMultiplierBps,
} from '../../10.escalation.unit/buz/escalation.buzz.js'
import type {
    CatalystEvaluationInput,
    CatalystSignificanceReceipt,
} from '../fce/catalyst.interface.js'

function assertBasisPoints(value: number, fieldName: string): void {
    if (
        typeof value !== 'number' ||
        !Number.isSafeInteger(value) ||
        value < 0 ||
        value > 10000
    ) {
        throw new Error(
            `[OUT_OF_BOUNDS] ${fieldName} must be an integer in [0, 10000]. Received: ${value}`,
        )
    }
}

function assertTick(value: number, fieldName: string): void {
    if (
        typeof value !== 'number' ||
        !Number.isSafeInteger(value) ||
        value < 0
    ) {
        throw new Error(
            `[OUT_OF_BOUNDS] ${fieldName} must be a non-negative integer. Received: ${value}`,
        )
    }
}

export function evaluateCatalystSignificance(
    config: AutoScriptConfig,
    eventInput: CatalystEvaluationInput,
): CatalystSignificanceReceipt {
    const parsed = AutoScriptConfigSchema.parse(config)
    const category = eventInput.category as SignificantEventCategory
    assertBasisPoints(eventInput.severityBps, 'severityBps')
    assertTick(eventInput.currentTick, 'currentTick')
    const rule = parsed.rules.find((r) => r.category === category)
    const lastMap = eventInput.lastEmittedTickByCategory ?? {}
    if (!rule) {
        return Object.freeze({
            category,
            severityBps: eventInput.severityBps,
            minSeverityBps: 0,
            priorityWeightBps: 0,
            significanceBps: 0,
            globalThresholdBps: parsed.min_global_significance_bps,
            isSignificant: false,
            reason: 'NO_MATCHING_RULE',
            currentTick: eventInput.currentTick,
        })
    }
    if (rule.enabled === false || parsed.enabled === false) {
        return Object.freeze({
            category,
            severityBps: eventInput.severityBps,
            minSeverityBps: rule.min_severity_bps,
            priorityWeightBps: rule.priority_weight_bps,
            significanceBps: 0,
            globalThresholdBps: parsed.min_global_significance_bps,
            isSignificant: false,
            reason: 'CATEGORY_DISABLED',
            currentTick: eventInput.currentTick,
        })
    }
    const lastTick = lastMap[category]
    if (
        typeof lastTick === 'number' &&
        Number.isSafeInteger(lastTick) &&
        eventInput.currentTick - lastTick < rule.cooldown_ticks
    ) {
        return Object.freeze({
            category,
            severityBps: eventInput.severityBps,
            minSeverityBps: rule.min_severity_bps,
            priorityWeightBps: rule.priority_weight_bps,
            significanceBps: 0,
            globalThresholdBps: parsed.min_global_significance_bps,
            isSignificant: false,
            reason: 'COOLDOWN_ACTIVE',
            currentTick: eventInput.currentTick,
        })
    }
    if (eventInput.severityBps < rule.min_severity_bps) {
        return Object.freeze({
            category,
            severityBps: eventInput.severityBps,
            minSeverityBps: rule.min_severity_bps,
            priorityWeightBps: rule.priority_weight_bps,
            significanceBps: 0,
            globalThresholdBps: parsed.min_global_significance_bps,
            isSignificant: false,
            reason: 'BELOW_RULE_SEVERITY',
            currentTick: eventInput.currentTick,
        })
    }
    const significanceBps = Math.trunc(
        (eventInput.severityBps * rule.priority_weight_bps) / 10000,
    )
    if (significanceBps < parsed.min_global_significance_bps) {
        return Object.freeze({
            category,
            severityBps: eventInput.severityBps,
            minSeverityBps: rule.min_severity_bps,
            priorityWeightBps: rule.priority_weight_bps,
            significanceBps,
            globalThresholdBps: parsed.min_global_significance_bps,
            isSignificant: false,
            reason: 'BELOW_GLOBAL_THRESHOLD',
            currentTick: eventInput.currentTick,
        })
    }
    return Object.freeze({
        category,
        severityBps: eventInput.severityBps,
        minSeverityBps: rule.min_severity_bps,
        priorityWeightBps: rule.priority_weight_bps,
        significanceBps,
        globalThresholdBps: parsed.min_global_significance_bps,
        isSignificant: true,
        reason: 'SIGNIFICANT',
        currentTick: eventInput.currentTick,
    })
}

export const SCORE_CATALYST_EVENT = '[Catalyst buzzer] Score Catalyst Event'

export function scoreCatalystEvent(
    config: AutoScriptConfig,
    eventInput: CatalystEvaluationInput,
): CatalystSignificanceReceipt {
    return evaluateCatalystSignificance(config, eventInput)
}

export function scoreCatalystBatch(
    config: AutoScriptConfig,
    events: CatalystEvaluationInput[],
): CatalystSignificanceReceipt[] {
    const sorted = [...events].sort((a, b) => {
        if (a.category < b.category) return -1
        if (a.category > b.category) return 1
        return a.currentTick - b.currentTick
    })
    return Object.freeze(
        sorted.map((e) => evaluateCatalystSignificance(config, e)),
    ) as CatalystSignificanceReceipt[]
}

export interface PacingCatalystInput extends CatalystEvaluationInput {
    ticksSinceLastScene?: number | null
    minutesSinceLastScene?: number | null
    totalTicks?: number
    elapsedSolarMinutes?: number
    progressBps?: number
    daypart?: DaypartBand
}

export interface PacingCatalystVerdict {
    shouldEmit: boolean
    actStage: ActStage
    effectiveScoreBps: number
    actMultiplierBps: number
    diurnalWeightBps: number
    combinedMultiplierBps: number
    droughtBoostBps: number
    suppressedByCooldown: boolean
    droughtBreakerActive: boolean
    baseSignificant: boolean
    baseSignificanceBps: number
}

export function evaluateCatalystWithPacingBudget(
    config: AutoScriptConfig,
    input: PacingCatalystInput,
): PacingCatalystVerdict {
    const parsed = AutoScriptConfigSchema.parse(config)
    const pacing: PacingBudgetConfig = resolvePacingBudgetConfig(
        (parsed as any).pacing_budget ?? {},
    )
    const base = evaluateCatalystSignificance(parsed, input)
    const ticksSince =
        input.ticksSinceLastScene === undefined
            ? null
            : input.ticksSinceLastScene
    const minutesSince =
        input.minutesSinceLastScene === undefined
            ? null
            : input.minutesSinceLastScene
    const cooldown = evaluateGlobalSceneCooldown(
        ticksSince,
        minutesSince,
        input.severityBps,
        pacing,
    )
    const droughtBoostBps = computeDroughtPressureBoostBps(ticksSince, pacing)
    const droughtBreakerActive = droughtBoostBps > 0
    let progressBps = 0
    if (typeof input.progressBps === 'number') {
        progressBps = Math.trunc(input.progressBps)
    } else if (
        typeof input.currentTick === 'number' &&
        typeof input.totalTicks === 'number' &&
        input.totalTicks > 0
    ) {
        progressBps = Math.trunc(
            (Math.trunc(input.currentTick) * 10000) /
                Math.trunc(input.totalTicks),
        )
    } else if (typeof input.elapsedSolarMinutes === 'number') {
        progressBps = Math.trunc(
            (Math.trunc(input.elapsedSolarMinutes) * 10000) / 1440,
        )
    }
    const actStage = resolveNarrativeActStage(progressBps, pacing)
    const daypart: DaypartBand = input.daypart ?? 'NIGHT'
    const actMultiplierBps =
        actStage === 'ACT_I'
            ? pacing.act_i_multiplier_bps
            : actStage === 'ACT_II'
              ? pacing.act_ii_multiplier_bps
              : pacing.act_iii_multiplier_bps
    const diurnalWeightBps =
        pacing.diurnal_tension_weights_bps[daypart] ?? 10000
    const combinedMultiplierBps = Number(
        (BigInt(actMultiplierBps) * BigInt(diurnalWeightBps)) / 10000n,
    )
    const scaled = Math.trunc(
        (base.significanceBps * combinedMultiplierBps) / 10000,
    )
    const effectiveScoreBps = Math.min(10000, scaled + droughtBoostBps)
    const shouldEmit = base.isSignificant && !cooldown.blocked
    const suppressedByCooldown = cooldown.blocked
    return Object.freeze({
        shouldEmit,
        actStage,
        effectiveScoreBps,
        actMultiplierBps,
        diurnalWeightBps,
        combinedMultiplierBps,
        droughtBoostBps,
        suppressedByCooldown,
        droughtBreakerActive,
        baseSignificant: base.isSignificant,
        baseSignificanceBps: base.significanceBps,
    })
}

export const initCatalyst = (
    cpy: CatalystModel,
    bal: CatalystBit,
    ste?: State,
): CatalystModel => {
    cpy.idx = bal.idx || '42.catalyst'
    if (bal.slv) {
        bal.slv({ ctlBit: { idx: 'init-catalyst', val: 0 } })
    }
    return cpy
}

export const updateCatalyst = (
    cpy: CatalystModel,
    bal: CatalystBit,
    ste?: State,
): CatalystModel => {
    if (bal.slv) {
        bal.slv({ ctlBit: { idx: 'update-catalyst', val: 0 } })
    }
    return cpy
}
