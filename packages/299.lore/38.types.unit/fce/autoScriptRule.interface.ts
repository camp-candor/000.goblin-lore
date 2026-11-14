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
