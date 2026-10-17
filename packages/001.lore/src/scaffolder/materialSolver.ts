import {
  MaterialStateVector,
  AttemptedOperation,
} from "../schemas/materialState.js";

export interface MaterialEvaluationResult {
  satisfiable: boolean;
  errorCode?:
    | "MATERIAL_STATE_CONFLICT"
    | "COMBUSTION_IMPOSSIBILITY_HALT"
    | "MECHANICAL_SEIZURE_HALT"
    | "ZERO_INTEGRITY_HALT";
  reason?: string;
  updatedMaterialState?: MaterialStateVector;
  errorVector?: {
    domain: "PHYSICAL_MATERIAL";
    target_entity: string;
    rule_id: string;
    offending_tokens: string[];
  };
}

export class MaterialFeasibilitySolver {
  /**
   * Evaluates operational feasibility of a tool, weapon, or mechanism
   */
  public static evaluateOperation(
    itemState: MaterialStateVector,
    operation: AttemptedOperation
  ): MaterialEvaluationResult {
    // 1. Zero structural integrity assertion
    if (itemState.structural_integrity_bps === 0 || !itemState.is_operable) {
      return {
        satisfiable: false,
        errorCode: "ZERO_INTEGRITY_HALT",
        reason: `DESTROYED_ITEM: Item '${itemState.item_id}' has 0 structural integrity and cannot be operated.`,
        errorVector: {
          domain: "PHYSICAL_MATERIAL",
          target_entity: itemState.item_id,
          rule_id: "ZERO_INTEGRITY_HALT",
          offending_tokens: ["structural_integrity_bps: 0", "is_operable: false"],
        },
      };
    }

    // 2. Severe corrosion mechanism seizure (corrosion > 9000 bps)
    if (
      operation.operation_type === "OPERATE_MECHANISM" ||
      operation.operation_type === "PRY_LEVERAGE"
    ) {
      if (itemState.material_class === "METALLIC" && itemState.corrosion_bps > 9000) {
        return {
          satisfiable: false,
          errorCode: "MECHANICAL_SEIZURE_HALT",
          reason: `OXIDATION_SEIZURE: Item '${itemState.item_id}' corrosion is ${itemState.corrosion_bps} bps (>9000 bps). Mechanical operation seized.`,
          errorVector: {
            domain: "PHYSICAL_MATERIAL",
            target_entity: itemState.item_id,
            rule_id: "MECHANICAL_SEIZURE_HALT",
            offending_tokens: [`corrosion_bps: ${itemState.corrosion_bps}`],
          },
        };
      }
    }

    // 3. Combustion / Ignition check
    if (operation.operation_type === "IGNITE") {
      return this.evaluateCombustion(itemState);
    }

    // 4. Kinetic impact application
    if (operation.operation_type === "STRIKE_IMPACT") {
      const updated = this.applyImpact(itemState, operation.applied_energy_bps);
      return {
        satisfiable: true,
        updatedMaterialState: updated,
      };
    }

    return {
      satisfiable: true,
      updatedMaterialState: { ...itemState },
    };
  }

  /**
   * Enforces wetness and combustibility boundaries
   */
  public static evaluateCombustion(itemState: MaterialStateVector): MaterialEvaluationResult {
    if (itemState.wetness_bps > 3000) {
      return {
        satisfiable: false,
        errorCode: "COMBUSTION_IMPOSSIBILITY_HALT",
        reason: `WET_ITEM_COMBUSTION: Item '${itemState.item_id}' has wetness of ${itemState.wetness_bps} bps (>3000 bps). Ignition impossible.`,
        errorVector: {
          domain: "PHYSICAL_MATERIAL",
          target_entity: itemState.item_id,
          rule_id: "COMBUSTION_IMPOSSIBILITY_HALT",
          offending_tokens: [`wetness_bps: ${itemState.wetness_bps}`],
        },
      };
    }

    if (itemState.combustibility_tier === "IMMUNE") {
      return {
        satisfiable: false,
        errorCode: "COMBUSTION_IMPOSSIBILITY_HALT",
        reason: `NON_COMBUSTIBLE: Item '${itemState.item_id}' has combustibility tier 'IMMUNE'.`,
        errorVector: {
          domain: "PHYSICAL_MATERIAL",
          target_entity: itemState.item_id,
          rule_id: "COMBUSTION_IMPOSSIBILITY_HALT",
          offending_tokens: ["combustibility_tier: IMMUNE"],
        },
      };
    }

    return {
      satisfiable: true,
      updatedMaterialState: { ...itemState },
    };
  }

  /**
   * Applies impact damage using Damage Threshold (DT) and integer Banker's Rounding
   */
  public static applyImpact(
    itemState: MaterialStateVector,
    impactEnergyBps: number
  ): MaterialStateVector {
    if (impactEnergyBps <= itemState.damage_threshold_bps) {
      // Impact energy absorbed completely by Damage Threshold
      return { ...itemState };
    }

    const netDamage = impactEnergyBps - itemState.damage_threshold_bps;
    const remainingIntegrity = Math.max(0, itemState.structural_integrity_bps - netDamage);
    const isOperable = remainingIntegrity > 0 ? itemState.is_operable : false;

    return {
      ...itemState,
      structural_integrity_bps: remainingIntegrity,
      is_operable: isOperable,
    };
  }
}
