import {
  PhysicalWorldEvent,
  Percept,
  BeliefRecord,
  GeneratedExpression,
  CartesianBreach,
} from "../../schemas/cartesian.js";

export interface EnvironmentalAcousticProfile {
  wall_damping_cb: number; // In integer centibels (e.g., 4500 cB = 45 dB)
  ambient_noise_cb: number; // e.g., 3000 cB = 30 dB
  has_direct_line_of_sight: boolean;
}

/**
 * Stage F: Evaluates physical opportunity based purely on topology and physical laws.
 * Barred from inspecting character beliefs.
 */
export function evaluatePhysicalOpportunity(
  actorLocation: string,
  targetLocation: string,
  hasPhysicalPath: boolean
): { possible: boolean; reason?: string } {
  if (actorLocation !== targetLocation && !hasPhysicalPath) {
    return {
      possible: false,
      reason: "PHYSICAL_PATH_BLOCKED: No open portal connects actor to target location.",
    };
  }
  return { possible: true };
}

/**
 * Stage G: Sensory Transduction Filter.
 * Converts physical events into subjective percepts based on distance, acoustic damping, and lighting.
 * If received signal is below noise threshold, returns null (unperceived).
 */
export function transducePercept(
  event: PhysicalWorldEvent,
  observerId: string,
  observerLocation: string,
  acousticProfile: EnvironmentalAcousticProfile,
  tick: number
): Percept | null {
  // Same room: direct perception
  if (event.location_id === observerLocation) {
    return {
      id: `percept_${event.id}_${observerId}`,
      observer_id: observerId,
      source_event_id: event.id,
      modality: event.is_silent ? "VISUAL" : "AUDITORY",
      perceived_intensity_bps: 10000,
      received_snr_cb: 5000, // Strong positive SNR
      apparent_location_id: event.location_id,
      apparent_source_entity: event.initiator_id,
      tick,
    };
  }

  // Cross-room perception: apply environmental occlusion
  if (event.is_silent && !acousticProfile.has_direct_line_of_sight) {
    // Silent event behind opaque obstacle -> zero percept
    return null;
  }

  // Calculate received sound pressure: SNR = Power - WallDamping - AmbientNoise
  const receivedSnrCb = event.sound_power_cb - acousticProfile.wall_damping_cb - acousticProfile.ambient_noise_cb;

  if (receivedSnrCb <= 0) {
    // Sound completely occluded by barrier
    return null;
  }

  // Scale received intensity (10,000 bp max)
  const perceivedIntensityBps = Math.min(10000, Math.max(500, receivedSnrCb * 2));

  return {
    id: `percept_${event.id}_${observerId}`,
    observer_id: observerId,
    source_event_id: event.id,
    modality: "AUDITORY",
    perceived_intensity_bps: perceivedIntensityBps,
    received_snr_cb: receivedSnrCb,
    apparent_location_id: event.location_id,
    tick,
  };
}

/**
 * Stage H: Epistemic Belief Updater.
 * Forms subjective beliefs from direct percepts.
 * Barred from inspecting raw physical world events.
 */
export function updateBeliefFromPercept(
  percept: Percept,
  subjectEntityId: string,
  inferredAttribute: string,
  inferredValue: string
): BeliefRecord {
  return {
    id: `belief_${percept.observer_id}_${subjectEntityId}_${percept.tick}`,
    actor_id: percept.observer_id,
    subject_entity_id: subjectEntityId,
    attribute_or_action: inferredAttribute,
    believed_value: inferredValue,
    confidence_bps: percept.perceived_intensity_bps,
    source_type: "DIRECT_PERCEPT",
    grounding_percept_ids: [percept.id],
    formed_at_tick: percept.tick,
  };
}

/**
 * Stage J Airlock: Sanitizes context for LLM generation.
 * Strips all raw physical world truth, returning an envelope containing ONLY
 * the actor's Stage H beliefs and verified percepts.
 */
export function sanitizeContextForGeneration(
  actorId: string,
  activeBeliefs: BeliefRecord[]
): { actor_id: string; authorized_knowledge: Array<{ subject: string; belief: string }> } {
  const actorBeliefs = activeBeliefs.filter((b) => b.actor_id === actorId);
  return {
    actor_id: actorId,
    authorized_knowledge: actorBeliefs.map((b) => ({
      subject: b.subject_entity_id,
      belief: `${b.attribute_or_action}:${b.believed_value}`,
    })),
  };
}

/**
 * Compile-Time Cartesian Interceptor:
 * Evaluates whether an untrusted Stage J expression references physical entities
 * or actions that the actor has NO Stage H belief regarding.
 */
export function verifyCartesianBoundary(
  expression: GeneratedExpression,
  actorBeliefs: BeliefRecord[]
): { valid: boolean; breach?: CartesianBreach } {
  const actorBeliefMap = new Set(
    actorBeliefs
      .filter((b) => b.actor_id === expression.speaker_id)
      .map((b) => `${b.subject_entity_id}:${b.attribute_or_action}`)
  );

  const ungroundedEntities: string[] = [];

  for (const claim of expression.expressed_claims) {
    const key = `${claim.referenced_entity_id}:${claim.claimed_state}`;
    if (!actorBeliefMap.has(key)) {
      ungroundedEntities.push(claim.referenced_entity_id);
    }
  }

  if (ungroundedEntities.length > 0) {
    return {
      valid: false,
      breach: {
        domain: "CARTESIAN_FIREWALL",
        actor_id: expression.speaker_id,
        rule_id: "CARTESIAN_FIREWALL_BREACH",
        violating_expression_id: expression.id,
        ungrounded_entities: ungroundedEntities,
        diagnostic_reason: `OMNISCIENCE_LEAK: Actor '${expression.speaker_id}' expressed knowledge of unobserved entities: [${ungroundedEntities.join(", ")}]`,
      },
    };
  }

  return { valid: true };
}
