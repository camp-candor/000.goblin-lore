import { z } from "zod";

// ---------------------------------------------------------------------------
// 1. Core Enumerations & Normalizers
// ---------------------------------------------------------------------------
export const ScopeEnum = z.enum(["CHARACTER", "LOCATION", "LOGISTIC", "LAW"]);
export type Scope = z.infer<typeof ScopeEnum>;

export const AuthorityLevelEnum = z.enum([
  "AXIOM",
  "CANON",
  "EVENT",
  "RUNTIME_STATE",
  "PROJECTION",
  "SPECULATION",
]);
export type AuthorityLevel = z.infer<typeof AuthorityLevelEnum>;

export const TriStateStandingEnum = z.enum([
  "ACTIVE_ENDORSED",
  "FLAGGED_FOR_REVIEW",
  "DEPRECATED_ARCHIVED",
]);
export type TriStateStanding = z.infer<typeof TriStateStandingEnum>;

export const NfcNormalizedString = z
  .string()
  .min(1, "Text must not be empty")
  .transform((val) => val.normalize("NFC").trim());

// ---------------------------------------------------------------------------
// 2. Fact Node Contract (Strict Dual-Rail Machine Fact)
// ---------------------------------------------------------------------------
export const FactNodeSchema = z
  .object({
    id: z
      .string()
      .regex(
        /^fact_[a-z0-9_]+$/,
        "Fact ID must match snake_case format prefixed with fact_"
      ),
    claim_text: NfcNormalizedString,
    scope: ScopeEnum,
    authority_level: AuthorityLevelEnum.default("CANON"),
    standing: TriStateStandingEnum.default("ACTIVE_ENDORSED"),
    version: z.number().int().min(1, "Version must be a positive integer >= 1").default(1),
    content_hash: z
      .string()
      .regex(/^[0-9a-f]{64}$/, "content_hash must be a 64-character lowercase hexadecimal SHA-256"),
    author: z.string().min(1, "Author identifier is required"),
    created_at_epoch: z.number().int().min(0).default(0),
    last_edited_epoch: z.number().int().min(0).default(0),
    review_notes: z.string().optional(),
  })
  .strict();

export type FactNode = z.infer<typeof FactNodeSchema>;

// Authority Hierarchy Weighting for Downward Validation
export const AuthorityPrecedence: Record<AuthorityLevel, number> = {
  AXIOM: 6,
  CANON: 5,
  EVENT: 4,
  RUNTIME_STATE: 3,
  PROJECTION: 2,
  SPECULATION: 1,
};
