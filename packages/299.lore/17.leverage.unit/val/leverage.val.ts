import { z } from 'zod'

/**
 * 7-bit ASCII Slug Regular Expression for characters.
 */
export const CharacterSlugRegex = /^char_[a-z0-9_]+$/

/**
 * Format helper for canonical directional edge string.
 */
export function makeRelationId(holderId: string, debtorId: string): string {
    return `${holderId}->${debtorId}`
}

/**
 * Zod schema for directional social debt record.
 */
export const StringsLedgerRecordSchema = z
    .object({
        relation_id: z.string().regex(/^char_[a-z0-9_]+->char_[a-z0-9_]+$/),
        holder_id: z.string().regex(CharacterSlugRegex),
        debtor_id: z.string().regex(CharacterSlugRegex),
        weight_bps: z.number().int().min(0).max(10000).default(10000),
        strings_count: z.number().int().nonnegative().default(1),
        updated_at_epoch: z.number().int().nonnegative().default(0),
    })
    .strict()
    .refine((data) => data.holder_id !== data.debtor_id, {
        message:
            'ANTI_REFLEXIVITY_BREACH: holder_id cannot be identical to debtor_id',
        path: ['debtor_id'],
    })

export type StringsLedgerRecord = z.infer<typeof StringsLedgerRecordSchema>

/**
 * Epistemic Leverage Vector Schema for Character Dossier Frontmatter.
 */
export const CharacterLeverageVectorSchema = z
    .object({
        actor_id: z.string().regex(CharacterSlugRegex),
        strings_held_over: z
            .array(z.string().regex(CharacterSlugRegex))
            .default([]),
        leverage_strings: z
            .record(
                z.string().regex(CharacterSlugRegex),
                z.number().int().min(0).max(10),
            )
            .default({}),
    })
    .strict()

export type CharacterLeverageVector = z.infer<
    typeof CharacterLeverageVectorSchema
>

/**
 * Input Schema for Directory Indexing Sweep.
 */
export const DirectoryIndexInputSchema = z
    .object({
        series_root_path: z.string().min(1),
        series_slug: z.string().min(1),
    })
    .strict()

export type DirectoryIndexInput = z.infer<typeof DirectoryIndexInputSchema>

/**
 * Input Schema for Spending Leverage Strings.
 */
export const SpendLeverageInputSchema = z
    .object({
        holder_id: z.string().regex(CharacterSlugRegex),
        debtor_id: z.string().regex(CharacterSlugRegex),
        spend_count: z.number().int().positive().default(1),
        reason: z.string().min(1).default('mechanical_duel_escalation'),
    })
    .strict()
    .refine((data) => data.holder_id !== data.debtor_id, {
        message: 'ANTI_REFLEXIVITY_BREACH: Cannot spend leverage over self',
        path: ['debtor_id'],
    })

export type SpendLeverageInput = z.infer<typeof SpendLeverageInputSchema>
