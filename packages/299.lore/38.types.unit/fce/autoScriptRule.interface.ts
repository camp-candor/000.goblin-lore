import { z } from 'zod'

export const SignificantEventCategorySchema = z.enum([
    'PARANOIA_TRIGGERED',
    'GRIEVANCE_BREACH',
    'SOMATIC_TRAUMA',
    'INVENTORY_TRANSFER',
    'EPISTEMIC_REVEAL',
    'CHRONO_MILESTONE',
])

export type SignificantEventCategory = z.infer<
    typeof SignificantEventCategorySchema
>

export const AutoScriptRuleSchema = z
    .object({
        category: SignificantEventCategorySchema,
        enabled: z.boolean().default(true),
        min_severity_bps: z.number().int().min(0).max(10000).default(5000),
        cooldown_ticks: z.number().int().min(0).max(1000).default(1),
        priority_weight_bps: z.number().int().min(0).max(10000).default(7500),
    })
    .strict()

export type AutoScriptRule = z.infer<typeof AutoScriptRuleSchema>

export const ActStageSchema = z.enum(['ACT_I', 'ACT_II', 'ACT_III'])
export type ActStage = z.infer<typeof ActStageSchema>

export const ActWindowModeSchema = z.enum([
    'HORIZON_PERCENT',
    'SOLAR_24H_CYCLE',
    'MULTI_DAY_ARC',
])
export type ActWindowMode = z.infer<typeof ActWindowModeSchema>

export const DiurnalTensionWeightsSchema = z
    .object({
        DAWN: z.number().int().min(1000).max(30000).default(9500),
        MORNING: z.number().int().min(1000).max(30000).default(8500),
        AFTERNOON: z.number().int().min(1000).max(30000).default(10000),
        DUSK: z.number().int().min(1000).max(30000).default(11500),
        NIGHT: z.number().int().min(1000).max(30000).default(12500),
    })
    .strict()
export type DiurnalTensionWeights = z.infer<typeof DiurnalTensionWeightsSchema>

export const PacingBudgetConfigSchema = z
    .object({
        enabled: z.boolean().default(true),
        min_ticks_between_scenes: z.number().int().min(0).max(1000).default(2),
        min_minutes_between_scenes: z
            .number()
            .int()
            .min(0)
            .max(1440)
            .default(15),
        max_dry_spell_ticks: z.number().int().min(1).max(2000).default(6),
        drought_boost_bps_per_tick: z
            .number()
            .int()
            .min(0)
            .max(5000)
            .default(650),
        max_drought_boost_bps: z.number().int().min(0).max(10000).default(5500),
        act_i_end_bps: z.number().int().min(500).max(8000).default(3333),
        act_ii_end_bps: z.number().int().min(1000).max(9500).default(7500),
        act_i_multiplier_bps: z
            .number()
            .int()
            .min(1000)
            .max(50000)
            .default(8500),
        act_ii_multiplier_bps: z
            .number()
            .int()
            .min(1000)
            .max(50000)
            .default(11500),
        act_iii_multiplier_bps: z
            .number()
            .int()
            .min(1000)
            .max(50000)
            .default(14500),
        critical_override_bps: z
            .number()
            .int()
            .min(5000)
            .max(10000)
            .default(9400),
        act_window_mode: ActWindowModeSchema.default('HORIZON_PERCENT'),
        diurnal_tension_weights_bps: DiurnalTensionWeightsSchema.default({
            DAWN: 9500,
            MORNING: 8500,
            AFTERNOON: 10000,
            DUSK: 11500,
            NIGHT: 12500,
        }),
    })
    .strict()
    .superRefine((val, ctx) => {
        if (val.act_i_end_bps >= val.act_ii_end_bps) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message:
                    '[OUT_OF_ORDER_ACTS] act_i_end_bps must be strictly less than act_ii_end_bps',
                path: ['act_i_end_bps'],
            })
        }
    })

export type PacingBudgetConfig = z.infer<typeof PacingBudgetConfigSchema>

export function resolvePacingBudgetConfig(input?: unknown): PacingBudgetConfig {
    if (input === undefined || input === null) {
        return PacingBudgetConfigSchema.parse({})
    }
    return PacingBudgetConfigSchema.parse(input)
}

export const AutoScriptConfigSchema = z
    .object({
        enabled: z.boolean().default(true),
        min_global_significance_bps: z
            .number()
            .int()
            .min(0)
            .max(10000)
            .default(5000),
        max_scripts_per_run: z.number().int().min(1).max(1000).default(64),
        output_subdir: z
            .string()
            .regex(/^[a-z0-9/_-]+$/i)
            .default('drafts/auto-script'),
        rules: z
            .array(AutoScriptRuleSchema)
            .min(1)
            .default([
                {
                    category: 'PARANOIA_TRIGGERED',
                    enabled: true,
                    min_severity_bps: 7000,
                    cooldown_ticks: 1,
                    priority_weight_bps: 9000,
                },
                {
                    category: 'GRIEVANCE_BREACH',
                    enabled: true,
                    min_severity_bps: 5500,
                    cooldown_ticks: 1,
                    priority_weight_bps: 8500,
                },
                {
                    category: 'SOMATIC_TRAUMA',
                    enabled: true,
                    min_severity_bps: 4000,
                    cooldown_ticks: 2,
                    priority_weight_bps: 8000,
                },
                {
                    category: 'CHRONO_MILESTONE',
                    enabled: true,
                    min_severity_bps: 3000,
                    cooldown_ticks: 5,
                    priority_weight_bps: 5000,
                },
            ]),
        pacing_budget: PacingBudgetConfigSchema.optional(),
    })
    .strict()

export type AutoScriptConfig = z.infer<typeof AutoScriptConfigSchema>

export const DEFAULT_AUTO_SCRIPT_CONFIG: AutoScriptConfig =
    AutoScriptConfigSchema.parse({})

export function resolveAutoScriptConfig(input?: unknown): AutoScriptConfig {
    if (input === undefined || input === null) {
        return AutoScriptConfigSchema.parse({})
    }
    return AutoScriptConfigSchema.parse(input)
}
