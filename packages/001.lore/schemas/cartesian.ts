import { z } from "zod";

// ---------------------------------------------------------------------------
// Stage F: Physical Opportunity Schemas (Ground-Truth Physical Reality)
// ---------------------------------------------------------------------------
export const PhysicalEventModalityEnum = z.enum([
  "VISUAL",
  "AUDITORY",
  "OLFACTORY",
  "TACTILE",
]);

export const PhysicalOpportunitySchema = z
  .object({
    id: z.string().regex(/^opp_[a-z0-9_]+$/),
    location_id: z.string().regex(/^loc_[a-z0-9_]+$/),
    actor_id: z.string().regex(/^char_[a-z0-9_]+$/),
    target_entity_id: z.string().optional(),
    action_verb: z.string().min(1),
    is_physically_possible: z.boolean(),
    impossibility_reason: z.string().optional(),
    tick: z.number().int().min(0),
  })
  .strict();

export const PhysicalWorldEventSchema = z
  .object({
    id: z.string().regex(/^event_[a-z0-9_]+$/),
    location_id: z.string().regex(/^loc_[a-z0-9_]+$/),
    initiator_id: z.string().regex(/^char_[a-z0-9_]+$/),
    action_verb: z.string().min(1),
    target_id: z.string().optional(),
    sound_power_cb: z.number().int().min(0).default(0), // Integer centibels (1 dB = 100 cB)
    optical_signature_lux: z.number().int().min(0).default(0),
    is_silent: z.boolean().default(false),
    tick: z.number().int().min(0),
  })
  .strict();

export type PhysicalOpportunity = z.infer<typeof PhysicalOpportunitySchema>;
export type PhysicalWorldEvent = z.infer<typeof PhysicalWorldEventSchema>;

// ---------------------------------------------------------------------------
// Stage G: Sensory Transduction Schemas (Perception Filter)
// ---------------------------------------------------------------------------
export const PerceptSchema = z
  .object({
    id: z.string().regex(/^percept_[a-z0-9_]+$/),
    observer_id: z.string().regex(/^char_[a-z0-9_]+$/),
    source_event_id: z.string().regex(/^event_[a-z0-9_]+$/),
    modality: PhysicalEventModalityEnum,
    perceived_intensity_bps: z.number().int().min(0).max(10000), // Integer basis points (10000 = 1.0)
    received_snr_cb: z.number().int(), // Signal-to-noise ratio in centibels
    apparent_location_id: z.string().regex(/^loc_[a-z0-9_]+$/),
    apparent_source_entity: z.string().optional(),
    tick: z.number().int().min(0),
  })
  .strict();

export type Percept = z.infer<typeof PerceptSchema>;

// ---------------------------------------------------------------------------
// Stage H: Epistemic Belief Schemas (Subjective Mind State)
// ---------------------------------------------------------------------------
export const BeliefSourceEnum = z.enum([
  "DIRECT_PERCEPT",
  "TESTIMONY",
  "INFERENCE",
  "FALSE_RUMOR",
]);

export const BeliefRecordSchema = z
  .object({
    id: z.string().regex(/^belief_[a-z0-9_]+$/),
    actor_id: z.string().regex(/^char_[a-z0-9_]+$/),
    subject_entity_id: z.string().min(1),
    attribute_or_action: z.string().min(1),
    believed_value: z.string().min(1),
    confidence_bps: z.number().int().min(0).max(10000), // Basis points (10000 = absolute certainty)
    source_type: BeliefSourceEnum,
    grounding_percept_ids: z.array(z.string().regex(/^percept_[a-z0-9_]+$/)).default([]),
    formed_at_tick: z.number().int().min(0),
  })
  .strict();

export type BeliefRecord = z.infer<typeof BeliefRecordSchema>;

// ---------------------------------------------------------------------------
// Stage J: Untrusted Generative Expression Schemas (Dialogue & Motor Output)
// ---------------------------------------------------------------------------
export const GeneratedExpressionSchema = z
  .object({
    id: z.string().regex(/^expr_[a-z0-9_]+$/),
    speaker_id: z.string().regex(/^char_[a-z0-9_]+$/),
    scene_id: z.string().min(1),
    expressed_claims: z.array(
      z.object({
        referenced_entity_id: z.string().min(1),
        claimed_state: z.string().min(1),
      })
    ),
    raw_dialogue_or_blocking: z.string().min(1),
    grounding_belief_ids: z.array(z.string().regex(/^belief_[a-z0-9_]+$/)),
    tick: z.number().int().min(0),
  })
  .strict();

export type GeneratedExpression = z.infer<typeof GeneratedExpressionSchema>;

// ---------------------------------------------------------------------------
// Pipeline Error Signature Vector
// ---------------------------------------------------------------------------
export const CartesianBreachSchema = z
  .object({
    domain: z.literal("CARTESIAN_FIREWALL"),
    actor_id: z.string().regex(/^char_[a-z0-9_]+$/),
    rule_id: z.literal("CARTESIAN_FIREWALL_BREACH"),
    violating_expression_id: z.string(),
    ungrounded_entities: z.array(z.string()),
    diagnostic_reason: z.string(),
  })
  .strict();

export type CartesianBreach = z.infer<typeof CartesianBreachSchema>;
