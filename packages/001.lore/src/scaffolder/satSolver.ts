import { CharacterMachineRail, PossessionMachineRail } from "../schemas/entities.js";

export interface SomaticSatEvaluation {
  satisfiable: boolean;
  netArmsAvailable: number;
  handsDemanded: number;
  activeTraumaPenalties: number;
  violatedBannedVerbs: string[];
  errorCode?: "SOMATIC_SAT_BREACH" | "KINETIC_VERB_BREACH";
  reason?: string;
}

/**
 * Enforces the Hand Capacity Invariant and Kinetic Exclusion Masks at Stage T0 = $0.00:
 * sum(occupies_hands) <= max(0, available_arms - traumaPenalties)
 */
export function evaluateSomaticSAT(
  character: CharacterMachineRail,
  heldPossessions: PossessionMachineRail[],
  attemptedActions: string[] = []
): SomaticSatEvaluation {
  const traumaPenalties = character.somatic.active_conditions.reduce(
    (acc: number, cond: any) => acc + cond.trauma_penalty_arms,
    0
  );

  const netArmsAvailable = Math.max(0, character.somatic.available_arms - traumaPenalties);

  const handsDemanded = heldPossessions.reduce(
    (acc: number, item: PossessionMachineRail) => acc + item.logistical.occupies_hands,
    0
  );

  // Check 1: Hand capacity invariant
  if (handsDemanded > netArmsAvailable) {
    return {
      satisfiable: false,
      netArmsAvailable,
      handsDemanded,
      activeTraumaPenalties: traumaPenalties,
      violatedBannedVerbs: [],
      errorCode: "SOMATIC_SAT_BREACH",
      reason: `OVERCAPACITY: Demanded ${handsDemanded} hands but only ${netArmsAvailable} functional limbs available.`,
    };
  }

  // Check 2: Banned kinetic verbs intersection
  const bannedSet = new Set(character.somatic.banned_kinetic_verbs.map((v: string) => v.toUpperCase()));
  const violatedVerbs = attemptedActions.filter((action) => bannedSet.has(action.toUpperCase()));

  if (violatedVerbs.length > 0) {
    return {
      satisfiable: false,
      netArmsAvailable,
      handsDemanded,
      activeTraumaPenalties: traumaPenalties,
      violatedBannedVerbs: violatedVerbs,
      errorCode: "KINETIC_VERB_BREACH",
      reason: `MOTOR_VIOLATION: Attempted banned verbs: [${violatedVerbs.join(", ")}]`,
    };
  }

  return {
    satisfiable: true,
    netArmsAvailable,
    handsDemanded,
    activeTraumaPenalties: traumaPenalties,
    violatedBannedVerbs: [],
  };
}
