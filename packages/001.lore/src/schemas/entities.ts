import { z } from "zod";

// ---------------------------------------------------------------------------
// 1. Somatic Vector Schema (Motor, Anatomical & Kinetic Bounds)
// ---------------------------------------------------------------------------
export const LocomotionTierEnum = z.enum([
  "bipedal_standard",
  "bipedal_hunched",
  "quadrupedal",
  "slithering",
  "limping",
  "immobilized",
]);

export const SomaticConditionSchema = z
  .object({
    id: z.string().regex(/^cond_[a-z0-9_]+$/),
    severity_bps: z.number().int().min(0).max(10000), // Integer basis points (10,000 = 1.0)
    trauma_penalty_arms: z.number().int().min(0).max(2).default(0),
    description: z.string().min(1),
  })
  .strict();

export const SomaticVectorSchema = z
  .object({
    locomotion_baseline: LocomotionTierEnum,
    available_arms: z.number().int().min(0).max(2).default(2),
    somatic_capability_mask: z.number().int().default(0), // 32-bit bitmask
    active_conditions: z.array(SomaticConditionSchema).default([]),
    banned_kinetic_verbs: z.array(z.string().min(1)).default([]),
  })
  .strict();

export type SomaticVector = z.infer<typeof SomaticVectorSchema>;

// ---------------------------------------------------------------------------
// 2. Logistical Vector Schema (Slots, Capacity & Equip Satisfiability)
// ---------------------------------------------------------------------------
export const LogisticalSlotsSchema = z
  .object({
    worn: z.array(z.string().regex(/^item_[a-z0-9_]+$/)).default([]),
    held: z.array(z.string().regex(/^item_[a-z0-9_]+$/)).default([]),
    carried: z.array(z.string().regex(/^item_[a-z0-9_]+$/)).default([]),
    cached: z.array(z.string().regex(/^item_[a-z0-9_]+$/)).default([]),
  })
  .strict();

export const CharacterLogisticalVectorSchema = z
  .object({
    hand_capacity: z.number().int().min(0).max(2).default(2),
    slots: LogisticalSlotsSchema.default({ worn: [], held: [], carried: [], cached: [] }),
    max_carry_weight_bps: z.number().int().min(0).max(10000).default(5000),
  })
  .strict();

export const PossessionLogisticalVectorSchema = z
  .object({
    occupies_hands: z.number().int().min(0).max(2).default(1),
    weight_class_bps: z.number().int().min(0).max(10000).default(1000),
    is_two_handed: z.boolean().default(false),
  })
  .strict();

// ---------------------------------------------------------------------------
// 3. Epistemic Vector Schema (Information Asymmetry & Mystery Bounds)
// ---------------------------------------------------------------------------
export const EpistemicHorizonEnum = z.enum([
  "TOTAL_IGNORANCE",
  "RUMOR_ONLY",
  "FALSE_BELIEF",
  "PARTIAL_FACT",
  "WITHHELD",
  "KNOWN_TRUE",
]);

export const EpistemicVectorSchema = z
  .object({
    horizon: EpistemicHorizonEnum.default("TOTAL_IGNORANCE"),
    known_facts: z.array(z.string().regex(/^fact_[a-z0-9_]+$/)).default([]),
    distorted_beliefs: z.record(z.string(), z.string()).default({}),
    escalation_ceiling: z.number().int().min(1).max(5).default(3),
  })
  .strict();

// ---------------------------------------------------------------------------
// 4. Refusal Vector Schema (Uncompromising Moral & Physical Limits)
// ---------------------------------------------------------------------------
export const RefusalVectorSchema = z
  .object({
    trigger: z.string().min(1),
    mandatory_refusal: z.string().min(1),
    unavoidable_cost: z.string().min(1),
  })
  .strict();

export type RefusalVector = z.infer<typeof RefusalVectorSchema>;

// ---------------------------------------------------------------------------
// 5. Dual-Rail Entity Schemas (Machine Rail Frontmatter Contracts)
// ---------------------------------------------------------------------------
export const CharacterMachineRailSchema = z
  .object({
    id: z.string().regex(/^char_[a-z0-9_]+$/),
    name: z.string().min(1),
    entity_type: z.literal("character"),
    version: z.number().int().min(1).default(1),
    depends_on: z.array(z.string()).default([]),
    somatic: SomaticVectorSchema,
    logistical: CharacterLogisticalVectorSchema,
    epistemic: EpistemicVectorSchema,
    refusal_vectors: z.array(RefusalVectorSchema).default([]),
    created_at_epoch: z.number().int().default(0),
    updated_at_epoch: z.number().int().default(0),
  })
  .strict();

export const PossessionMachineRailSchema = z
  .object({
    id: z.string().regex(/^item_[a-z0-9_]+$/),
    name: z.string().min(1),
    entity_type: z.literal("possession"),
    version: z.number().int().min(1).default(1),
    depends_on: z.array(z.string()).default([]),
    logistical: PossessionLogisticalVectorSchema,
    created_at_epoch: z.number().int().default(0),
    updated_at_epoch: z.number().int().default(0),
  })
  .strict();

export type CharacterMachineRail = z.infer<typeof CharacterMachineRailSchema>;
export type PossessionMachineRail = z.infer<typeof PossessionMachineRailSchema>;
